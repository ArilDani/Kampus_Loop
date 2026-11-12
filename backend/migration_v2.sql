-- KampusLoop Migration v2: 3 Roles (admin, seller, user), Seller Verification, Agreement Template & Web Settings
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS pengajuan_penjual BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS status_pengajuan_penjual VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS alasan_pengajuan_penjual TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS catatan_admin_penjual TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS angkatan VARCHAR(20) DEFAULT '',
  ADD COLUMN IF NOT EXISTS ktm_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS bukti_lain_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS surat_perjanjian_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tanggal_pengajuan_penjual TIMESTAMPTZ;

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS surat_perjanjian_judul VARCHAR(255) DEFAULT 'SURAT PERJANJIAN PENJUAL KAMPUSLOOP',
  ADD COLUMN IF NOT EXISTS surat_perjanjian_isi TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS surat_perjanjian_catatan TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS no_wa VARCHAR(30) DEFAULT '',
  ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(100) DEFAULT '@kampusloop',
  ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255) DEFAULT 'https://instagram.com',
  ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(255) DEFAULT 'https://tiktok.com',
  ADD COLUMN IF NOT EXISTS telegram_handle VARCHAR(100) DEFAULT '@kampusloop',
  ADD COLUMN IF NOT EXISTS footer_deskripsi TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS footer_copyright VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS footer_tagline_bawah VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS kebijakan_privasi_judul VARCHAR(255) DEFAULT 'Kebijakan Privasi',
  ADD COLUMN IF NOT EXISTS kebijakan_privasi_isi TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS syarat_ketentuan_judul VARCHAR(255) DEFAULT 'Syarat & Ketentuan',
  ADD COLUMN IF NOT EXISTS syarat_ketentuan_isi TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS panduan_keamanan_judul VARCHAR(255) DEFAULT 'Panduan Keamanan Transaksi',
  ADD COLUMN IF NOT EXISTS panduan_keamanan_isi TEXT DEFAULT '';

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
