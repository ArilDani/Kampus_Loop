-- KampusLoop Migration v4: Word Agreement File, Product COD Locations, Shopee-style Address, Payment Methods (QRIS, Transfer Bank, COD)
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS surat_perjanjian_file_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_config JSONB DEFAULT '{"cod_enabled":true,"qris_enabled":true,"qris_image_url":"","qris_label":"QRIS KampusLoop","bank_enabled":true,"bank_name":"BCA","bank_account_number":"","bank_account_name":"","cod_locations":"Perpustakaan Pusat, Kantin Fakultas, Lobi Gedung Utama"}'::jsonb;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS provinsi VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS kota_kabupaten VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS kecamatan VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS kode_pos VARCHAR(20) DEFAULT '',
  ADD COLUMN IF NOT EXISTS detail_alamat TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_config JSONB DEFAULT '{"cod_enabled":true,"qris_enabled":false,"qris_image_url":"","qris_label":"","bank_enabled":false,"bank_name":"","bank_account_number":"","bank_account_name":"","cod_locations":"Area Kampus & Perpustakaan Pusat"}'::jsonb;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cod_lokasi TEXT DEFAULT 'Perpustakaan Pusat, Kantin Fakultas, Gerbang Utama Kampus';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(20) DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) DEFAULT 'COD',
  ADD COLUMN IF NOT EXISTS shipping_address TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS kode_pos VARCHAR(20) DEFAULT '',
  ADD COLUMN IF NOT EXISTS detail_alamat TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cod_location TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS koordinat VARCHAR(100) DEFAULT '';

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

