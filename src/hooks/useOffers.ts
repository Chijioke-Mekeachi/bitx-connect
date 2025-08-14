import { useState, useEffect } from 'react'
import { supabase, Offer } from '@/lib/supabase'
import { useAuthContext } from '@/context/AuthContext'

export function useOffers() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthContext()

  useEffect(() => {
    fetchOffers()
  }, [])

  const fetchOffers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          profiles:profile_id (
            id,
            username,
            display_name,
            completion_rate,
            total_trades
          ),
          offer_payment_methods (
            payment_methods (
              id,
              type,
              label
            )
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOffers(data || [])
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoading(false)
    }
  }

  const createOffer = async (offerData: {
    type: 'buy' | 'sell'
    price: number
    min_amount: number
    max_amount: number
    terms?: string
    blurt_username?: string
    payment_method_ids: string[]
  }) => {
    if (!user) throw new Error('Must be logged in to create offers')

    try {
      // Create the offer
      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .insert([
          {
            profile_id: user.id,
            type: offerData.type,
            price: offerData.price,
            min_amount: offerData.min_amount,
            max_amount: offerData.max_amount,
            terms: offerData.terms,
            blurt_username: offerData.blurt_username,
          },
        ])
        .select()
        .single()

      if (offerError) throw offerError

      // Link payment methods
      if (offerData.payment_method_ids.length > 0) {
        const paymentMethodLinks = offerData.payment_method_ids.map(pmId => ({
          offer_id: offer.id,
          payment_method_id: pmId,
        }))

        const { error: linkError } = await supabase
          .from('offer_payment_methods')
          .insert(paymentMethodLinks)

        if (linkError) throw linkError
      }

      await fetchOffers()
      return offer
    } catch (error) {
      console.error('Error creating offer:', error)
      throw error
    }
  }

  const updateOffer = async (offerId: string, updates: Partial<Offer>) => {
    if (!user) throw new Error('Must be logged in')

    try {
      const { data, error } = await supabase
        .from('offers')
        .update(updates)
        .eq('id', offerId)
        .eq('profile_id', user.id)
        .select()
        .single()

      if (error) throw error
      await fetchOffers()
      return data
    } catch (error) {
      console.error('Error updating offer:', error)
      throw error
    }
  }

  const deleteOffer = async (offerId: string) => {
    if (!user) throw new Error('Must be logged in')

    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId)
        .eq('profile_id', user.id)

      if (error) throw error
      await fetchOffers()
    } catch (error) {
      console.error('Error deleting offer:', error)
      throw error
    }
  }

  return {
    offers,
    loading,
    fetchOffers,
    createOffer,
    updateOffer,
    deleteOffer,
  }
}