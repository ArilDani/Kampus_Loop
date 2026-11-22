-- KampusLoop Migration v6: Menambahkan kolom 'stok' di tabel products
-- Jalankan query ini di Supabase Dashboard > SQL Editor (https://supabase.com/dashboard/project/dcxzkqkcfspnxbrjmhea/sql)

ALTER TABLE products ADD COLUMN IF NOT EXISTS stok INTEGER DEFAULT 1;

-- Sinkronkan data produk yang aktif agar memiliki stok minimal 1
UPDATE products SET stok = 1 WHERE status = 'approved' AND (stok IS NULL OR stok <= 0);

-- Sinkronkan data produk yang sudah terjual
UPDATE products SET stok = 0 WHERE status = 'sold';

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

