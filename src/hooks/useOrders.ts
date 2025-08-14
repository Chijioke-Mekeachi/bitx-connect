import { useState, useEffect } from 'react'
import { supabase, Order } from '@/lib/supabase'
import { useAuthContext } from '@/context/AuthContext'

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthContext()

  useEffect(() => {
    if (user) {
      fetchOrders()
      subscribeToOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          offers (
            id,
            type,
            asset,
            fiat_currency,
            profiles:profile_id (
              username,
              display_name
            )
          ),
          buyer_profile:buyer_id (
            username,
            display_name
          ),
          seller_profile:seller_id (
            username,
            display_name
          ),
          payment_methods (
            type,
            label
          )
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToOrders = () => {
    if (!user) return

    const subscription = supabase
      .channel('orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `or(buyer_id.eq.${user.id},seller_id.eq.${user.id})`,
        },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const createOrder = async (orderData: {
    offer_id: string
    amount_asset: number
    payment_method_id?: string
    buyer_email?: string
    buyer_blurt_username?: string
  }) => {
    if (!user) throw new Error('Must be logged in to create orders')

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            ...orderData,
            buyer_id: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error
      await fetchOrders()
      return data
    } catch (error) {
      console.error('Error creating order:', error)
      throw error
    }
  }

  const updateOrder = async (orderId: string, updates: Partial<Order>) => {
    if (!user) throw new Error('Must be logged in')

    try {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .select()
        .single()

      if (error) throw error
      await fetchOrders()
      return data
    } catch (error) {
      console.error('Error updating order:', error)
      throw error
    }
  }

  const markOrderAsPaid = async (orderId: string, paymentReference: string) => {
    return updateOrder(orderId, {
      status: 'paid',
      payment_reference: paymentReference,
    })
  }

  const releaseOrder = async (orderId: string) => {
    return updateOrder(orderId, {
      status: 'released',
    })
  }

  const cancelOrder = async (orderId: string) => {
    return updateOrder(orderId, {
      status: 'cancelled',
    })
  }

  const disputeOrder = async (orderId: string, reason: string, description?: string) => {
    if (!user) throw new Error('Must be logged in')

    try {
      // Update order status
      await updateOrder(orderId, { status: 'disputed' })

      // Create dispute record
      const { data, error } = await supabase
        .from('disputes')
        .insert([
          {
            order_id: orderId,
            raised_by: user.id,
            reason,
            description,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating dispute:', error)
      throw error
    }
  }

  return {
    orders,
    loading,
    fetchOrders,
    createOrder,
    updateOrder,
    markOrderAsPaid,
    releaseOrder,
    cancelOrder,
    disputeOrder,
  }
}