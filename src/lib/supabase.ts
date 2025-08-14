import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database types
export interface Profile {
  id: string
  username: string
  display_name?: string
  country?: string
  phone?: string
  blurt_username?: string
  completion_rate: number
  total_trades: number
  created_at: string
  updated_at: string
}

export interface PaymentMethod {
  id: string
  profile_id: string
  type: 'bank_transfer' | 'mobile_money' | 'paystack' | 'usdt' | 'cash' | 'other'
  label: string
  details: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Offer {
  id: string
  profile_id: string
  type: 'buy' | 'sell'
  asset: string
  fiat_currency: string
  price: number
  min_amount: number
  max_amount: number
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  terms?: string
  blurt_username?: string
  created_at: string
  updated_at: string
  profiles?: Profile
  offer_payment_methods?: {
    payment_methods: PaymentMethod
  }[]
}

export interface Order {
  id: string
  offer_id: string
  buyer_id: string
  seller_id: string
  price: number
  amount_asset: number
  fiat_amount: number
  status: 'pending' | 'paid' | 'released' | 'cancelled' | 'disputed' | 'expired'
  payment_method_id?: string
  payment_reference?: string
  buyer_email?: string
  buyer_blurt_username?: string
  seller_payment_details?: Record<string, any>
  expires_at: string
  created_at: string
  updated_at: string
  offers?: Offer
  buyer_profile?: Profile
  seller_profile?: Profile
  payment_methods?: PaymentMethod
}

export interface OrderMessage {
  id: string
  order_id: string
  sender_id: string
  message: string
  message_type: string
  created_at: string
  profiles?: Profile
}

export interface Dispute {
  id: string
  order_id: string
  raised_by: string
  reason: string
  description?: string
  status: string
  admin_notes?: string
  resolved_at?: string
  created_at: string
}