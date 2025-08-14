import { useState, useEffect } from 'react'
import { supabase, PaymentMethod } from '@/lib/supabase'
import { useAuthContext } from '@/context/AuthContext'

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthContext()

  useEffect(() => {
    if (user) {
      fetchPaymentMethods()
    }
  }, [user])

  const fetchPaymentMethods = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('profile_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPaymentMethods(data || [])
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPaymentMethod = async (paymentMethodData: {
    type: PaymentMethod['type']
    label: string
    details: Record<string, any>
  }) => {
    if (!user) throw new Error('Must be logged in')

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert([
          {
            ...paymentMethodData,
            profile_id: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error
      await fetchPaymentMethods()
      return data
    } catch (error) {
      console.error('Error creating payment method:', error)
      throw error
    }
  }

  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethod>) => {
    if (!user) throw new Error('Must be logged in')

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .update(updates)
        .eq('id', id)
        .eq('profile_id', user.id)
        .select()
        .single()

      if (error) throw error
      await fetchPaymentMethods()
      return data
    } catch (error) {
      console.error('Error updating payment method:', error)
      throw error
    }
  }

  const deletePaymentMethod = async (id: string) => {
    if (!user) throw new Error('Must be logged in')

    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_active: false })
        .eq('id', id)
        .eq('profile_id', user.id)

      if (error) throw error
      await fetchPaymentMethods()
    } catch (error) {
      console.error('Error deleting payment method:', error)
      throw error
    }
  }

  return {
    paymentMethods,
    loading,
    fetchPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  }
}