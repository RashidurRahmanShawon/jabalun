-- ==============================================================================
-- Jabalun Site — 100% Standalone Supabase PostgreSQL Schema
-- Replaces WordPress & WooCommerce completely
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.categories (slug, name, description)
VALUES
    ('instant-ready-hijab', 'ইনস্ট্যান্ট রেডি হিজাব', 'পিন বা ঝামেলা ছাড়াই মুহূর্তেই পরে নিন — আরামদায়ক কাপড়ে তৈরি রেডি হিজাব।'),
    ('khimar-plazu-set', 'খিমার প্লাজু সেট', 'খিমার ও প্লাজুর মানানসই সেট — একসাথে পরুন, পূর্ণ পর্দা ও আরামে।')
ON CONFLICT (slug) DO NOTHING;

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    design_number TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    regular_price NUMERIC(10, 2),
    image_url TEXT,
    description TEXT DEFAULT '',
    short_description TEXT DEFAULT '',
    category_slug TEXT NOT NULL REFERENCES public.categories(slug) ON UPDATE CASCADE,
    stock INT NOT NULL DEFAULT 50,
    status TEXT NOT NULL DEFAULT 'publish', -- 'publish' | 'draft'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- Seed initial products
INSERT INTO public.products (id, slug, name, design_number, price, regular_price, description, category_slug, stock, status)
VALUES
    (401, 'instant-ready-hijab-401', 'ইনস্ট্যান্ট রেডি হিজাব - 401', '401', 790.00, 890.00, 'ভিসকস কটন ফেব্রিক — প্রিমিয়াম ইনস্ট্যান্ট রেডি হিজাব। আরামদায়ক ও টেকসই।', 'instant-ready-hijab', 35, 'publish'),
    (402, 'instant-ready-hijab-402', 'ইনস্ট্যান্ট রেডি হিজাব - 402', '402', 790.00, 890.00, 'ভিসকস কটন ফেব্রিক — প্রিমিয়াম ইনস্ট্যান্ট রেডি হিজাব। আরামদায়ক ও টেকসই।', 'instant-ready-hijab', 28, 'publish'),
    (403, 'instant-ready-hijab-403', 'ইনস্ট্যান্ট রেডি হিজাব - 403', '403', 790.00, 890.00, 'ভিসকস কটন ফেব্রিক — প্রিমিয়াম ইনস্ট্যান্ট রেডি হিজাব। আরামদায়ক ও টেকসই।', 'instant-ready-hijab', 40, 'publish'),
    (404, 'instant-ready-hijab-404', 'ইনস্ট্যান্ট রেডি হিজাব - 404', '404', 790.00, 890.00, 'ভিসকস কটন ফেব্রিক — প্রিমিয়াম ইনস্ট্যান্ট রেডি হিজাব। আরামদায়ক ও টেকসই।', 'instant-ready-hijab', 22, 'publish'),
    (405, 'instant-ready-hijab-405', 'ইনস্ট্যান্ট রেডি হিজাব - 405', '405', 790.00, 890.00, 'ভিসকস কটন ফেব্রিক — প্রিমিয়াম ইনস্ট্যান্ট রেডি হিজাব। আরামদায়ক ও টেকসই।', 'instant-ready-hijab', 50, 'publish'),
    (406, 'instant-ready-hijab-406', 'ইনস্ট্যান্ট রেডি হিজাব - 406', '406', 790.00, 890.00, 'ভিসকস কটন ফেব্রিক — প্রিমিয়াম ইনস্ট্যান্ট রেডি হিজাব। আরামদায়ক ও টেকসই।', 'instant-ready-hijab', 18, 'publish'),
    (407, 'instant-ready-hijab-407', 'ইনস্ট্যান্ট রেডি হিজাব - 407', '407', 790.00, 890.00, 'ভিসকস কটন ফেব্রিক — প্রিমিয়াম ইনস্ট্যান্ট রেডি হিজাব। আরামদায়ক ও টেকসই।', 'instant-ready-hijab', 30, 'publish'),
    (408, 'instant-ready-hijab-408', 'ইনস্ট্যান্ট রেডি হিজাব - 408', '408', 790.00, 890.00, 'ভিসকস কটন ফেব্রিক — প্রিমিয়াম ইনস্ট্যান্ট রেডি হিজাব। আরামদায়ক ও টেকসই।', 'instant-ready-hijab', 25, 'publish'),
    (409, 'instant-ready-hijab-409', 'ইনস্ট্যান্ট রেডি হিজাব - 409', '409', 790.00, 890.00, 'ভিসকস কটন ফেব্রিক — প্রিমিয়াম ইনস্ট্যান্ট রেডি হিজাব। আরামদায়ক ও টেকসই।', 'instant-ready-hijab', 45, 'publish'),
    (410, 'instant-ready-hijab-410', 'ইনস্ট্যান্ট রেডি হিজাব - 410', '410', 790.00, 890.00, 'ভিসকস কটন ফেব্রিক — প্রিমিয়াম ইনস্ট্যান্ট রেডি হিজাব। আরামদায়ক ও টেকসই।', 'instant-ready-hijab', 15, 'publish'),
    (226, 'khimar-plazu-set-226', 'খিমার প্লাজু সেট - 226', '226', 1090.00, 1250.00, 'প্রিমিয়াম দুবাই চেরি ফেব্রিকের খিমার ও প্লাজুর মানানসই সেট।', 'khimar-plazu-set', 20, 'publish'),
    (227, 'khimar-plazu-set-227', 'খিমার প্লাজু সেট - 227', '227', 1090.00, 1250.00, 'প্রিমিয়াম দুবাই চেরি ফেব্রিকের খিমার ও প্লাজুর মানানসই সেট।', 'khimar-plazu-set', 14, 'publish'),
    (228, 'khimar-plazu-set-228', 'খিমার প্লাজু সেট - 228', '228', 1090.00, 1250.00, 'প্রিমিয়াম দুবাই চেরি ফেব্রিকের খিমার ও প্লাজুর মানানসই সেট।', 'khimar-plazu-set', 25, 'publish'),
    (229, 'khimar-plazu-set-229', 'খিমার প্লাজু সেট - 229', '229', 1090.00, 1250.00, 'প্রিমিয়াম দুবাই চেরি ফেব্রিকের খিমার ও প্লাজুর মানানসই সেট।', 'khimar-plazu-set', 8, 'publish')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price;

SELECT setval('public.products_id_seq', (SELECT MAX(id) FROM public.products));

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    number TEXT UNIQUE NOT NULL,
    order_key TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    note TEXT DEFAULT '',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'cancelled', 'on-hold'
    payment_method TEXT DEFAULT 'cod',
    payment_method_title TEXT DEFAULT 'ক্যাশ অন ডেলিভারি',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(phone);

-- Order source (Facebook / TikTok / Google …). Safe to run again on an existing database.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source_detail JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders(source);

-- 4. Analytics & Behavior Events
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type TEXT NOT NULL,
    sid TEXT,
    path TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON public.analytics_events (type);

-- 5. Store Settings
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'general',
    site_name TEXT NOT NULL DEFAULT 'জাবালুন',
    email TEXT NOT NULL DEFAULT 'support@jabalun.com',
    contact_email TEXT NOT NULL DEFAULT 'Yasin503509@gmail.com',
    phone TEXT NOT NULL DEFAULT '+8801707406132',
    whatsapp TEXT DEFAULT '8801707406132',
    address TEXT NOT NULL DEFAULT '71 Gausul Azam Ave, Dhaka 1230',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.store_settings (id, site_name, email, contact_email, phone, whatsapp, address)
VALUES ('general', 'জাবালুন', 'support@jabalun.com', 'Yasin503509@gmail.com', '+8801707406132', '8801707406132', '71 Gausul Azam Ave, Dhaka 1230')
ON CONFLICT (id) DO NOTHING;

-- 6. Delivery Zones
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    charge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    estimated_days TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.delivery_zones (id, name, charge, estimated_days, is_active)
VALUES
    ('dhaka-inside', 'ঢাকার ভেতরে', 0.00, '১-২ কর্মদিবস', true),
    ('dhaka-suburb', 'ঢাকার আশপাশে (সাভার, গাজীপুর, কেরানীগঞ্জ)', 0.00, '২-৩ কর্মদিবস', true),
    ('dhaka-outside', 'ঢাকার বাইরে (সারা বাংলাদেশ)', 0.00, '৩-৫ কর্মদিবস', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Discount Rules
CREATE TABLE IF NOT EXISTS public.discount_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    min_quantity INT NOT NULL DEFAULT 3,
    discount_rate NUMERIC(4, 2) NOT NULL DEFAULT 0.10,
    label TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.discount_rules (id, name, category_slug, min_quantity, discount_rate, label, is_active)
VALUES ('ready-hijab-volume', 'রেডি হিজাব ভলিউম ছাড়', 'instant-ready-hijab', 3, 0.10, '৩টি বা তার বেশি নিলে ১০% ছাড়', true)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- Row Level Security (RLS) & Access Permissions
-- ==============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_rules ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public categories read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public products read" ON public.products FOR SELECT TO anon, authenticated USING (status = 'publish');
CREATE POLICY "Public store_settings read" ON public.store_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public delivery_zones read" ON public.delivery_zones FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public discount_rules read" ON public.discount_rules FOR SELECT TO anon, authenticated USING (true);

-- Public order creation & analytics insert
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public read own order" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert analytics" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);

-- API Role Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Customer profiles edited in the admin (see supabase/migrations/2026-11-17-customers.sql)
CREATE TABLE IF NOT EXISTS public.customers (
  phone       TEXT PRIMARY KEY,
  name        TEXT,
  address     TEXT,
  status      TEXT NOT NULL DEFAULT 'regular',
  note        TEXT,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
