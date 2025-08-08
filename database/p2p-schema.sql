-- Bitxchain P2P schema (Supabase/Postgres). Move to a migration when ready.
create extension if not exists pgcrypto;

-- Enums
DO $$ BEGIN CREATE TYPE public.offer_type AS ENUM ('buy','sell'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.offer_status AS ENUM ('active','paused','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.order_status AS ENUM ('pending','paid','released','cancelled','disputed','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payment_method_type AS ENUM ('bank_transfer','mobile_money','cash_deposit','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY, -- equals auth.uid(), no FK
  username text UNIQUE,
  display_name text,
  country text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Payment methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  type payment_method_type NOT NULL,
  label text,
  details jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Offers
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  type offer_type NOT NULL,
  asset text NOT NULL DEFAULT 'BLURT',
  fiat_currency text NOT NULL DEFAULT 'NGN',
  price numeric(18,6) NOT NULL CHECK (price > 0),
  min_amount numeric(18,6) NOT NULL CHECK (min_amount > 0),
  max_amount numeric(18,6) NOT NULL CHECK (max_amount > 0 AND max_amount >= min_amount),
  status offer_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Offer payment methods
CREATE TABLE IF NOT EXISTS public.offer_payment_methods (
  offer_id uuid NOT NULL,
  payment_method_id uuid NOT NULL,
  PRIMARY KEY (offer_id, payment_method_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  price numeric(18,6) NOT NULL,
  amount_asset numeric(18,6) NOT NULL CHECK (amount_asset > 0),
  fiat_amount numeric(18,2) NOT NULL CHECK (fiat_amount > 0),
  status order_status NOT NULL DEFAULT 'pending',
  payment_method_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS public.order_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Disputes
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  raised_by uuid NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS enable
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY IF NOT EXISTS profiles_select_public ON public.profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS profiles_insert_self ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY IF NOT EXISTS profiles_update_self ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Payment methods RLS
CREATE POLICY IF NOT EXISTS pm_select_owner ON public.payment_methods FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY IF NOT EXISTS pm_modify_owner ON public.payment_methods FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- Offers RLS
CREATE POLICY IF NOT EXISTS offers_select_all ON public.offers FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS offers_insert_owner ON public.offers FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY IF NOT EXISTS offers_update_owner ON public.offers FOR UPDATE USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY IF NOT EXISTS offers_delete_owner ON public.offers FOR DELETE USING (auth.uid() = profile_id);

-- Offer payment methods RLS
CREATE POLICY IF NOT EXISTS opm_select_all ON public.offer_payment_methods FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS opm_modify_owner ON public.offer_payment_methods FOR ALL USING (
  EXISTS(SELECT 1 FROM public.offers o WHERE o.id = offer_id AND o.profile_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.offers o WHERE o.id = offer_id AND o.profile_id = auth.uid())
);

-- Orders RLS
CREATE POLICY IF NOT EXISTS orders_select_participants ON public.orders FOR SELECT USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);
CREATE POLICY IF NOT EXISTS orders_insert_buyer ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY IF NOT EXISTS orders_update_participants ON public.orders FOR UPDATE USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

-- Messages RLS
CREATE POLICY IF NOT EXISTS om_select_participants ON public.order_messages FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid()))
);
CREATE POLICY IF NOT EXISTS om_insert_participants ON public.order_messages FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid()))
);

-- Disputes RLS
CREATE POLICY IF NOT EXISTS disputes_select_participants ON public.disputes FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid()))
);
CREATE POLICY IF NOT EXISTS disputes_insert_participants ON public.disputes FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid()))
);

-- Validation triggers
CREATE OR REPLACE FUNCTION public.fn_orders_before_insert()
RETURNS trigger AS $$
DECLARE
  v_offer public.offers;
BEGIN
  SELECT * INTO v_offer FROM public.offers WHERE id = NEW.offer_id;
  IF v_offer IS NULL THEN RAISE EXCEPTION 'Offer does not exist'; END IF;
  IF NEW.buyer_id = v_offer.profile_id THEN RAISE EXCEPTION 'Cannot buy from your own offer'; END IF;
  IF NEW.amount_asset <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  NEW.price := v_offer.price;
  NEW.seller_id := v_offer.profile_id;
  NEW.fiat_amount := NEW.amount_asset * v_offer.price;
  IF NEW.fiat_amount < v_offer.min_amount OR NEW.fiat_amount > v_offer.max_amount THEN
    RAISE EXCEPTION 'Amount outside offer limits';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_orders_before_insert
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.fn_orders_before_insert();

CREATE OR REPLACE FUNCTION public.fn_order_messages_before_insert()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = NEW.order_id AND (o.buyer_id = NEW.sender_id OR o.seller_id = NEW.sender_id)
  ) THEN RAISE EXCEPTION 'Sender is not a participant of this order'; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_order_messages_before_insert
BEFORE INSERT ON public.order_messages
FOR EACH ROW EXECUTE FUNCTION public.fn_order_messages_before_insert();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
