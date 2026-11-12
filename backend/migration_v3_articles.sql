-- KampusLoop Migration v3: Articles / Berita ModuLab CRUD Table + Initial Article
-- Run this in Supabase Dashboard > SQL Editor

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

ALTER TABLE articles DISABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Seed 1 initial article about student preloved items with high resale value & ModuLab
INSERT INTO articles (
  id,
  author_nama,
  judul,
  slug,
  kategori,
  ringkasan,
  konten,
  gambar_url,
  status
) VALUES (
  'a1b2c3d4-1111-4444-8888-1234567890ab',
  'M. Aril Ardani (Admin Web)',
  'Jangan Dibuang! 7 Barang Bekas Mahasiswa Ini Masih Bernilai Tinggi & Berpotensi Dijual Kembali di ModuLab KampusLoop',
  'barang-bekas-mahasiswa-bernilai-dan-berpotensi-dijual-kembali-modulab',
  'Berita ModuLab',
  'Banyak perlengkapan kuliah dan barang kos yang menumpuk saat pergantian semester ternyata masih bernilai tinggi. Simak daftar barang yang paling dicari mahasiswa dan cara mengubahnya jadi cuan di ekosistem ModuLab KampusLoop.',
  E'Setiap akhir semester atau menjelang kelulusan, kamar kos dan rumah mahasiswa hampir selalu dipenuhi barang-barang yang sudah jarang terpakai. Padahal, di lingkungan kampus yang dinamis, kebutuhan mahasiswa baru dan adik tingkat terhadap perlengkapan kuliah yang hemat namun berkualitas justru selalu tinggi.\n\nMelalui inisiatif ekosistem digital ModuLab bersama KampusLoop, barang-barang preloved mahasiswa tidak lagi sekadar menumpuk di gudang kos, melainkan dapat terus berputar dan memberi nilai ekonomi nyata bagi sesama mahasiswa.\n\nBerikut 7 barang bekas mahasiswa yang terbukti masih bernilai tinggi dan sangat berpotensi untuk dijual kembali:\n\n1. Buku Referensi, Modul & Diktat Kuliah\nBuku teks mata kuliah wajib, modul praktikum, hingga buku persiapan TOEFL/IELTS selalu dicari oleh mahasiswa semester awal. Selama halaman bersih dan masih terbaca jelas, buku bekas dapat terjual cepat di kisaran 40%–70% dari harga barunya.\n\n2. Laptop, Tablet & Aksesori Produktivitas\nPerangkat seperti MacBook, laptop kuliah, keyboard mechanical, mouse wireless, dan drawing tablet memiliki permintaan paling stabil di kalangan mahasiswa teknik, desain, maupun bisnis.\n\n3. Kalkulator Scientific & Alat Praktikum\nKalkulator scientific (seperti seri Casio FX), jas lab, penggaris skala teknik, hingga multimeter adalah barang wajib yang biasanya hanya dipakai beberapa semester, sehingga kondisi bekasnya hampir selalu masih prima.\n\n4. Peralatan Kamar Kos & Meja Belajar\nKursi kerja minimalis, lampu belajar adjustable, rak buku portabel, hingga kipas meja menjadi incaran utama mahasiswa baru yang baru pindah ke kos sekitar kampus karena lebih praktis dan bebas ongkir lewat COD.\n\n5. Headphone & Perangkat Audio Belajar\nHeadphone wireless atau earphone berkualitas sangat diminati untuk kebutuhan belajar mandiri di perpustakaan maupun rapat organisasi daring.\n\n6. Kamera & Perlengkapan Dokumentasi Organisasi\nKamera mirrorless entry-level, tripod, dan ring light sering dibutuhkan oleh pengurus BEM, himpunan mahasiswa, UKM media, serta mahasiswa komunikasi.\n\n7. Jaket, Tas Kuliah & Sneakers Harian\nBackpack dengan kompartemen laptop, jaket varsity/organisasi yang terawat, serta sneakers kasual tetap memiliki pasar kuat di kalangan mahasiswa yang mengutamakan fungsi dan gaya hemat.\n\nTips Agar Barang Cepat Terjual di ModuLab KampusLoop:\n- Bersihkan barang dan ambil foto yang terang serta jujur menunjukkan kondisi asli.\n- Cantumkan detail kelengkapan dan lokasi COD kampus (misalnya perpustakaan pusat atau kantin fakultas).\n- Tetapkan harga wajar (sekitar 40%–75% dari harga baru tergantung kondisi).\n\nDengan menjual kembali barang bekas yang masih layak pakai, mahasiswa tidak hanya mendapatkan uang saku tambahan, tetapi juga membantu teman sekampus berhemat sekaligus mengurangi limbah barang di lingkungan kampus.',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=85',
  'published'
) ON CONFLICT (slug) DO NOTHING;

