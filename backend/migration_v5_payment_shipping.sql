-- KampusLoop Migration v5: Distance-based Shipping, Tripay Sandbox Integration, Separated Payment & Shipping Statuses, Platform Revenue Tracking
-- Run this in Supabase Dashboard > SQL Editor (https://supabase.com/dashboard/project/dcxzkqkcfspnxbrjmhea/sql)

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS shipping_config JSONB DEFAULT '{"base_rate":5000,"rate_per_km":2000,"min_shipping_cost":8000,"courier_name":"KampusLoop Express (Kurir Kampus)","provider":"distance_matrix","active":true}'::jsonb;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal_produk INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_fee INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_cost INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS distance_km NUMERIC(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_courier VARCHAR(100) DEFAULT 'KampusLoop Express',
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS shipping_status VARCHAR(30) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS tripay_reference VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS tripay_merchant_ref VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS tripay_payment_method VARCHAR(50) DEFAULT '',
  ADD COLUMN IF NOT EXISTS tripay_checkout_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tripay_pay_code VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS tripay_qr_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tripay_qr_string TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tripay_expired_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tripay_fee INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cod_fee_status VARCHAR(30) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS cod_fee_amount INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb;

-- Populate default values from existing orders
UPDATE orders SET subtotal_produk = harga_bayar WHERE subtotal_produk = 0 OR subtotal_produk IS NULL;
UPDATE orders SET payment_status = 'paid' WHERE status = 'completed' AND (payment_status IS NULL OR payment_status = 'unpaid');
UPDATE orders SET shipping_status = 'delivered' WHERE status = 'completed' AND (shipping_status IS NULL OR shipping_status = 'pending');

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
