-- KampusLoop Supabase PostgreSQL Schema
-- Run this in Supabase Dashboard > SQL Editor

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(150) DEFAULT '',
  last_name VARCHAR(150) DEFAULT '',
  is_staff BOOLEAN DEFAULT false,
  is_superuser BOOLEAN DEFAULT false,
  date_joined TIMESTAMPTZ DEFAULT now()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  uuid UUID DEFAULT gen_random_uuid(),
  kampus VARCHAR(150) DEFAULT '',
  telp VARCHAR(15) DEFAULT '',
  gender VARCHAR(15) DEFAULT '',
  alamat VARCHAR(200) DEFAULT '',
  provinsi VARCHAR(100) DEFAULT '',
  kota_kabupaten VARCHAR(100) DEFAULT '',
  kecamatan VARCHAR(100) DEFAULT '',
  kode_pos VARCHAR(20) DEFAULT '',
  detail_alamat TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  payment_config JSONB DEFAULT '{"cod_enabled":true,"qris_enabled":false,"qris_image_url":"","qris_label":"","bank_enabled":false,"bank_name":"","bank_account_number":"","bank_account_name":"","cod_locations":"Area Kampus & Perpustakaan Pusat"}'::jsonb,
  is_verified BOOLEAN DEFAULT false,
  role VARCHAR(20) DEFAULT 'user',
  nim VARCHAR(50) DEFAULT '',
  fakultas_prodi VARCHAR(150) DEFAULT '',
  pengajuan_admin BOOLEAN DEFAULT false,
  status_pengajuan_admin VARCHAR(20) DEFAULT 'none',
  alasan_pengajuan_admin TEXT DEFAULT '',
  pengajuan_penjual BOOLEAN DEFAULT false,
  status_pengajuan_penjual VARCHAR(20) DEFAULT 'none',
  alasan_pengajuan_penjual TEXT DEFAULT '',
  catatan_admin_penjual TEXT DEFAULT '',
  angkatan VARCHAR(20) DEFAULT '',
  ktm_url TEXT DEFAULT '',
  bukti_lain_url TEXT DEFAULT '',
  surat_perjanjian_url TEXT DEFAULT '',
  tanggal_pengajuan_penjual TIMESTAMPTZ,
  date_joined TIMESTAMPTZ DEFAULT now(),
  photo TEXT DEFAULT ''
);

-- Products table (seller_id nullable with fallback display columns for migrated data)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  seller_nama VARCHAR(150) DEFAULT '',
  seller_email VARCHAR(255) DEFAULT '',
  seller_kampus VARCHAR(150) DEFAULT '',
  nama VARCHAR(200) NOT NULL,
  kategori VARCHAR(50) NOT NULL,
  kondisi VARCHAR(20) DEFAULT 'Good',
  harga INTEGER NOT NULL,
  harga_asli INTEGER,
  deskripsi TEXT DEFAULT '',
  foto_url TEXT DEFAULT '',
  lokasi VARCHAR(100) DEFAULT '',
  cod_lokasi TEXT DEFAULT 'Perpustakaan Pusat, Kantin Fakultas, Gerbang Utama Kampus',
  status VARCHAR(20) DEFAULT 'pending',
  tanggal_dibuat TIMESTAMPTZ DEFAULT now(),
  tanggal_diperbarui TIMESTAMPTZ DEFAULT now(),
  dilihat INTEGER DEFAULT 0
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  produk_id UUID REFERENCES products(id) ON DELETE CASCADE,
  tanggal_ditambah TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, produk_id)
);

-- Orders table (pembeli_id nullable with fallback display columns for migrated data)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  pembeli_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  pembeli_nama VARCHAR(150) DEFAULT '',
  seller_nama VARCHAR(150) DEFAULT '',
  produk_id UUID REFERENCES products(id) ON DELETE SET NULL,
  produk_nama VARCHAR(200) DEFAULT '',
  produk_foto TEXT DEFAULT '',
  harga_bayar INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  delivery_type VARCHAR(20) DEFAULT 'cod',
  payment_method VARCHAR(30) DEFAULT 'COD',
  shipping_address TEXT DEFAULT '',
  kode_pos VARCHAR(20) DEFAULT '',
  detail_alamat TEXT DEFAULT '',
  cod_location TEXT DEFAULT '',
  koordinat VARCHAR(100) DEFAULT '',
  catatan TEXT DEFAULT '',
  tanggal_pesan TIMESTAMPTZ DEFAULT now(),
  tanggal_selesai TIMESTAMPTZ
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  topik VARCHAR(100) NOT NULL,
  pesan TEXT NOT NULL,
  tanggal TIMESTAMPTZ DEFAULT now(),
  sudah_dibaca BOOLEAN DEFAULT false
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  nama_toko VARCHAR(150) DEFAULT 'KampusLoop',
  tagline VARCHAR(255) DEFAULT '',
  email_support VARCHAR(255) DEFAULT '',
  no_telp VARCHAR(30) DEFAULT '',
  alamat TEXT DEFAULT '',
  status_toko VARCHAR(20) DEFAULT 'ONLINE',
  banner_pengumuman TEXT DEFAULT '',
  surat_perjanjian_judul VARCHAR(255) DEFAULT 'SURAT PERJANJIAN PENJUAL KAMPUSLOOP',
  surat_perjanjian_isi TEXT DEFAULT '',
  surat_perjanjian_catatan TEXT DEFAULT '',
  surat_perjanjian_file_url TEXT DEFAULT '',
  payment_config JSONB DEFAULT '{"cod_enabled":true,"qris_enabled":true,"qris_image_url":"","qris_label":"QRIS KampusLoop","bank_enabled":true,"bank_name":"BCA","bank_account_number":"","bank_account_name":"","cod_locations":"Perpustakaan Pusat, Kantin Fakultas, Lobi Gedung Utama"}'::jsonb,
  no_wa VARCHAR(30) DEFAULT '',
  instagram_handle VARCHAR(100) DEFAULT '@kampusloop',
  instagram_url VARCHAR(255) DEFAULT 'https://instagram.com',
  tiktok_url VARCHAR(255) DEFAULT 'https://tiktok.com',
  telegram_handle VARCHAR(100) DEFAULT '@kampusloop',
  footer_deskripsi TEXT DEFAULT '',
  footer_copyright VARCHAR(255) DEFAULT '',
  footer_tagline_bawah VARCHAR(255) DEFAULT '',
  kebijakan_privasi_judul VARCHAR(255) DEFAULT 'Kebijakan Privasi',
  kebijakan_privasi_isi TEXT DEFAULT '',
  syarat_ketentuan_judul VARCHAR(255) DEFAULT 'Syarat & Ketentuan',
  syarat_ketentuan_isi TEXT DEFAULT '',
  panduan_keamanan_judul VARCHAR(255) DEFAULT 'Panduan Keamanan Transaksi',
  panduan_keamanan_isi TEXT DEFAULT ''
);

-- Articles table (Berita & Edukasi ModuLab)
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  author_nama VARCHAR(150) DEFAULT 'Admin Web',
  judul VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  kategori VARCHAR(80) DEFAULT 'Berita ModuLab',
  ringkasan TEXT DEFAULT '',
  konten TEXT NOT NULL,
  gambar_url TEXT DEFAULT '',
  status VARCHAR(20) DEFAULT 'published',
  tanggal_dibuat TIMESTAMPTZ DEFAULT now(),
  tanggal_diperbarui TIMESTAMPTZ DEFAULT now(),
  dilihat INTEGER DEFAULT 0
);

-- Disable RLS so the Express backend using SUPABASE_KEY can read/write all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;

-- Grant privileges to service_role (used server-side by backend/.env sb_secret_ key)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
