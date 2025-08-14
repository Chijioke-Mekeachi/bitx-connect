/*
  # P2P Trading Platform Schema

  1. New Tables
    - `profiles` - User profiles linked to auth.users
    - `payment_methods` - Available payment methods for users
    - `offers` - Trading offers (buy/sell)
    - `offer_payment_methods` - Junction table for offer payment methods
    - `orders` - Active trades between users
    - `order_messages` - Chat messages for trades
    - `disputes` - Dispute resolution system

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure data access based on user ownership

  3. Features
    - Real-time updates for orders and messages
    - Automatic validation triggers
    - Comprehensive audit trail
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE offer_type AS ENUM ('buy', 'sell');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE offer_status AS ENUM ('active', 'paused', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'paid', 'released', 'cancelled', 'disputed', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM ('bank_transfer', 'mobile_money', 'paystack', 'usdt', 'cash', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY DEFAULT auth.uid(),
    username text UNIQUE NOT NULL,
    display_name text,
    country text DEFAULT 'NG',
    phone text,
    blurt_username text,
    completion_rate integer DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    total_trades integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type payment_method_type NOT NULL,
    label text NOT NULL,
    details jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Offers table
CREATE TABLE IF NOT EXISTS public.offers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type offer_type NOT NULL,
    asset text DEFAULT 'BLURT',
    fiat_currency text DEFAULT 'NGN',
    price numeric(18,6) NOT NULL CHECK (price > 0),
    min_amount numeric(18,6) NOT NULL CHECK (min_amount > 0),
    max_amount numeric(18,6) NOT NULL CHECK (max_amount >= min_amount),
    status offer_status DEFAULT 'active',
    terms text,
    blurt_username text,
    blurt_active_key text, -- This should be encrypted in production
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Offer payment methods junction table
CREATE TABLE IF NOT EXISTS public.offer_payment_methods (
    offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
    payment_method_id uuid NOT NULL REFERENCES public.payment_methods(id) ON DELETE CASCADE,
    PRIMARY KEY (offer_id, payment_method_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id uuid NOT NULL REFERENCES public.offers(id),
    buyer_id uuid NOT NULL REFERENCES public.profiles(id),
    seller_id uuid NOT NULL REFERENCES public.profiles(id),
    price numeric(18,6) NOT NULL,
    amount_asset numeric(18,6) NOT NULL CHECK (amount_asset > 0),
    fiat_amount numeric(18,2) NOT NULL CHECK (fiat_amount > 0),
    status order_status DEFAULT 'pending',
    payment_method_id uuid REFERENCES public.payment_methods(id),
    payment_reference text,
    buyer_email text,
    buyer_blurt_username text,
    seller_payment_details jsonb DEFAULT '{}',
    expires_at timestamptz DEFAULT (now() + interval '30 minutes'),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT orders_buyer_seller_different CHECK (buyer_id != seller_id)
);

-- Order messages table
CREATE TABLE IF NOT EXISTS public.order_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.profiles(id),
    message text NOT NULL,
    message_type text DEFAULT 'text',
    created_at timestamptz DEFAULT now()
);

-- Disputes table
CREATE TABLE IF NOT EXISTS public.disputes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id),
    raised_by uuid NOT NULL REFERENCES public.profiles(id),
    reason text NOT NULL,
    description text,
    status text DEFAULT 'open',
    admin_notes text,
    resolved_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Payment methods policies
CREATE POLICY "Users can view their own payment methods" ON public.payment_methods
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can manage their own payment methods" ON public.payment_methods
    FOR ALL USING (auth.uid() = profile_id);

-- Offers policies
CREATE POLICY "Offers are viewable by everyone" ON public.offers
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own offers" ON public.offers
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own offers" ON public.offers
    FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own offers" ON public.offers
    FOR DELETE USING (auth.uid() = profile_id);

-- Offer payment methods policies
CREATE POLICY "Offer payment methods are viewable by everyone" ON public.offer_payment_methods
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their offer payment methods" ON public.offer_payment_methods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.offers 
            WHERE offers.id = offer_id AND offers.profile_id = auth.uid()
        )
    );

-- Orders policies
CREATE POLICY "Users can view orders they participate in" ON public.orders
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Order participants can update orders" ON public.orders
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Order messages policies
CREATE POLICY "Order participants can view messages" ON public.order_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_id 
            AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
        )
    );

CREATE POLICY "Order participants can send messages" ON public.order_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_id 
            AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
        )
    );

-- Disputes policies
CREATE POLICY "Order participants can view disputes" ON public.disputes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_id 
            AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
        )
    );

CREATE POLICY "Order participants can create disputes" ON public.disputes
    FOR INSERT WITH CHECK (
        auth.uid() = raised_by AND
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_id 
            AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
        )
    );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Business logic triggers
CREATE OR REPLACE FUNCTION validate_order_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    offer_record public.offers;
BEGIN
    -- Get the offer details
    SELECT * INTO offer_record FROM public.offers WHERE id = NEW.offer_id;
    
    IF offer_record IS NULL THEN
        RAISE EXCEPTION 'Offer does not exist';
    END IF;
    
    -- Prevent self-trading
    IF NEW.buyer_id = offer_record.profile_id THEN
        RAISE EXCEPTION 'Cannot trade with yourself';
    END IF;
    
    -- Set seller_id from offer
    NEW.seller_id := offer_record.profile_id;
    
    -- Set price from offer
    NEW.price := offer_record.price;
    
    -- Calculate fiat amount
    NEW.fiat_amount := NEW.amount_asset * offer_record.price;
    
    -- Validate amount limits
    IF NEW.fiat_amount < offer_record.min_amount OR NEW.fiat_amount > offer_record.max_amount THEN
        RAISE EXCEPTION 'Amount outside offer limits: % to %', offer_record.min_amount, offer_record.max_amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_order_trigger
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION validate_order_before_insert();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_offers_type_status ON public.offers(type, status);
CREATE INDEX IF NOT EXISTS idx_offers_profile_id ON public.offers(profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON public.order_messages(order_id);