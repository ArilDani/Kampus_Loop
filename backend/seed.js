require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./supabaseClient');
const { DEFAULT_AGREEMENT_TEMPLATE } = require('./utils/helpers');

async function seed() {
  console.log('[*] Migrating KampusLoop data to Supabase...');

  // 1. Delete ALL existing users so ONLY arildani60@gmail.com remains
  console.log('[*] Clearing existing users...');
  await supabase.from('user_profiles').delete().neq('user_id', -1);
  await supabase.from('users').delete().neq('id', -1);

  // 2. Create Admin Super User ONLY (never store plaintext password)
  console.log('[*] Creating super admin user: arildani60@gmail.com...');
  const adminPasswordHash = await bcrypt.hash('@GitGut#11', 10);

  const { data: adminUser, error: adminErr } = await supabase
    .from('users')
    .insert({
      email: 'arildani60@gmail.com',
      username: 'arildani60@gmail.com',
      password_hash: adminPasswordHash,
      first_name: 'M. Aril Ardani',
      last_name: 'Super Admin',
      is_staff: true,
      is_superuser: true,
    })
    .select()
    .single();

  if (adminErr) {
    console.error('[ERROR] Failed to create admin user:', adminErr.message);
    process.exit(1);
  }

  const { error: adminProfErr } = await supabase
    .from('user_profiles')
    .insert({
      user_id: adminUser.id,
      kampus: 'Universitas Negeri Makassar',
      telp: '',
      gender: 'Laki-laki',
      role: 'admin',
      is_verified: true,
    });

  if (adminProfErr) {
    console.error('[ERROR] Failed to create admin profile:', adminProfErr.message);
    process.exit(1);
  }
  console.log('[OK] Super admin user created (only user in database).');

  // 3. Platform Settings (from db.sqlite3 app_pengaturantoko)
  console.log('[*] Seeding platform settings...');
  await supabase.from('settings').upsert({
    id: 1,
    nama_toko: 'KampusLoop',
    tagline: 'Student Circular Marketplace',
    email_support: 'hello@kampusloop.id',
    no_telp: '@kampusloop',
    alamat: 'Campus-based marketplace',
    status_toko: 'ONLINE',
    banner_pengumuman: 'Selamat datang di KampusLoop! Platform circular marketplace kampus.',
    surat_perjanjian_judul: DEFAULT_AGREEMENT_TEMPLATE.judul,
    surat_perjanjian_isi: DEFAULT_AGREEMENT_TEMPLATE.isi,
    surat_perjanjian_catatan: DEFAULT_AGREEMENT_TEMPLATE.catatan,
  }, { onConflict: 'id' });
  console.log('[OK] Settings seeded.');

  // 4. All 15 real products from db.sqlite3 (app_produk)
  // Original sellers in db.sqlite3 (now deleted) are preserved in seller_nama/seller_email/seller_kampus
  console.log('[*] Migrating all 15 products from db.sqlite3...');
  const productsData = [
    {
      id: 'bfbaa17a-8b1f-4418-91f5-6a4bfdaae5a2',
      seller_id: null,
      seller_nama: 'Nadia',
      seller_email: 'nadia@kampusloop.id',
      seller_kampus: 'Universitas Indonesia',
      nama: 'MacBook Air M1 2020',
      kategori: 'Elektronik',
      kondisi: 'Good',
      harga: 6850000,
      harga_asli: 8500000,
      deskripsi: 'Laptop untuk kebutuhan kuliah, desain ringan, dan produktivitas harian. Kondisi terawat, fungsi utama normal, charger termasuk.',
      foto_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85',
      lokasi: 'Depok',
      status: 'sold',
      tanggal_dibuat: '2026-11-02T16:59:11.717664Z',
      tanggal_diperbarui: '2026-11-02T16:59:11.717691Z',
      dilihat: 0,
    },
    {
      id: 'fdb96982-7dc7-4137-be8a-cacdddd4bf77',
      seller_id: null,
      seller_nama: 'Rizky Pratama',
      seller_email: 'mahasiswa@kampusloop.id',
      seller_kampus: 'Universitas Negeri Makassar (UNM)',
      nama: 'Buku Dasar-Dasar Manajemen',
      kategori: 'Buku & Akademik',
      kondisi: 'Like New',
      harga: 65000,
      harga_asli: 110000,
      deskripsi: 'Buku referensi perkuliahan dengan halaman bersih dan sampul terawat. Cocok untuk mahasiswa bisnis dan manajemen.',
      foto_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=85',
      lokasi: 'Makassar',
      status: 'approved',
      tanggal_dibuat: '2026-11-02T16:59:11.724188Z',
      tanggal_diperbarui: '2026-11-02T16:59:11.724215Z',
      dilihat: 0,
    },
    {
      id: '77c4e45f-efa1-457a-af79-c791f26dcc87',
      seller_id: null,
      seller_nama: 'Rizky Pratama',
      seller_email: 'mahasiswa@kampusloop.id',
      seller_kampus: 'Universitas Negeri Makassar (UNM)',
      nama: 'Sony Wireless Headphones',
      kategori: 'Elektronik',
      kondisi: 'Good',
      harga: 725000,
      harga_asli: 1100000,
      deskripsi: 'Headphone wireless dengan suara jernih. Bantalan masih nyaman dan semua tombol berfungsi dengan baik.',
      foto_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
      lokasi: 'Makassar',
      status: 'approved',
      tanggal_dibuat: '2026-11-02T16:59:11.730784Z',
      tanggal_diperbarui: '2026-11-02T16:59:11.730810Z',
      dilihat: 0,
    },
    {
      id: '4e276ccf-131a-4130-95cf-64a8a15c9a7a',
      seller_id: null,
      seller_nama: 'Nadia',
      seller_email: 'nadia@kampusloop.id',
      seller_kampus: 'Universitas Indonesia',
      nama: 'Backpack Urban Daily',
      kategori: 'Fashion',
      kondisi: 'Like New',
      harga: 185000,
      harga_asli: 320000,
      deskripsi: 'Tas harian dengan kompartemen laptop dan ruang penyimpanan luas. Cocok untuk kuliah maupun aktivitas luar kampus.',
      foto_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85',
      lokasi: 'Bandung',
      status: 'approved',
      tanggal_dibuat: '2026-11-02T16:59:11.736591Z',
      tanggal_diperbarui: '2026-11-02T16:59:11.736616Z',
      dilihat: 0,
    },
    {
      id: '111994e1-550b-43f8-834d-fb26ec8079df',
      seller_id: null,
      seller_nama: 'Rizky Pratama',
      seller_email: 'mahasiswa@kampusloop.id',
      seller_kampus: 'Universitas Negeri Makassar (UNM)',
      nama: 'Kalkulator Casio Scientific',
      kategori: 'Buku & Akademik',
      kondisi: 'Good',
      harga: 95000,
      harga_asli: 155000,
      deskripsi: 'Kalkulator scientific untuk kebutuhan matematika, statistik, dan mata kuliah hitungan. Tombol responsif.',
      foto_url: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=900&q=85',
      lokasi: 'Yogyakarta',
      status: 'approved',
      tanggal_dibuat: '2026-11-02T16:59:11.742747Z',
      tanggal_diperbarui: '2026-11-02T16:59:11.742783Z',
      dilihat: 0,
    },
    {
      id: '7e8c8ce0-1c42-4700-b684-cdb8239f1028',
      seller_id: null,
      seller_nama: 'Nadia',
      seller_email: 'nadia@kampusloop.id',
      seller_kampus: 'Universitas Indonesia',
      nama: 'Kursi Kerja Minimalis',
      kategori: 'Kos & Living',
      kondisi: 'Good',
      harga: 275000,
      harga_asli: 450000,
      deskripsi: 'Kursi kerja minimalis untuk ruang belajar atau kamar kos. Struktur kokoh dengan pemakaian wajar.',
      foto_url: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=85',
      lokasi: 'Malang',
      status: 'approved',
      tanggal_dibuat: '2026-11-02T16:59:11.749276Z',
      tanggal_diperbarui: '2026-11-02T16:59:11.749302Z',
      dilihat: 0,
    },
    {
      id: 'dceb8d6d-59fa-4d10-9b89-dc0cd92f3cb3',
      seller_id: null,
      seller_nama: 'Rizky Pratama',
      seller_email: 'mahasiswa@kampusloop.id',
      seller_kampus: 'Universitas Negeri Makassar (UNM)',
      nama: 'Jaket Varsity Campus',
      kategori: 'Fashion',
      kondisi: 'Like New',
      harga: 125000,
      harga_asli: 250000,
      deskripsi: 'Jaket varsity dengan desain timeless. Kondisi sangat baik, cocok untuk aktivitas kampus sehari-hari.',
      foto_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85',
      lokasi: 'Makassar',
      status: 'approved',
      tanggal_dibuat: '2026-11-02T16:59:11.755348Z',
      tanggal_diperbarui: '2026-11-02T16:59:11.755492Z',
      dilihat: 0,
    },
    {
      id: 'ff5b5aeb-e17c-40bf-a0c6-25259b2f446b',
      seller_id: null,
      seller_nama: 'Nadia',
      seller_email: 'nadia@kampusloop.id',
      seller_kampus: 'Universitas Indonesia',
      nama: 'Kamera Mirrorless Compact',
      kategori: 'Hobi & Organisasi',
      kondisi: 'Good',
      harga: 2950000,
      harga_asli: 3900000,
      deskripsi: 'Kamera untuk dokumentasi kegiatan kampus dan fotografi. Kondisi fungsi normal, dapat dicek langsung saat COD.',
      foto_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=85',
      lokasi: 'Semarang',
      status: 'approved',
      tanggal_dibuat: '2026-11-02T16:59:11.763302Z',
      tanggal_diperbarui: '2026-11-02T16:59:11.763328Z',
      dilihat: 0,
    },
    {
      id: '9efdf900-f128-4137-b3e6-76222ff15098',
      seller_id: null,
      seller_nama: 'Rizky Pratama',
      seller_email: 'mahasiswa@kampusloop.id',
      seller_kampus: 'Universitas Negeri Makassar (UNM)',
      nama: 'Lampu Belajar Adjustable',
      kategori: 'Kos & Living',
      kondisi: 'Like New',
      harga: 85000,
      harga_asli: 145000,
      deskripsi: 'Lampu meja belajar dengan posisi adjustable dan pencahayaan nyaman untuk belajar malam.',
      foto_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85',
      lokasi: 'Makassar',
      status: 'approved',
      tanggal_dibuat: '2026-11-02T16:59:11.769313Z',
      tanggal_diperbarui: '2026-11-02T16:59:11.769339Z',
      dilihat: 0,
    },
    {
      id: 'f01ca041-1b4a-4603-b13d-58ae96ad99ea',
      seller_id: null,
      seller_nama: 'Nadia',
      seller_email: 'nadia@kampusloop.id',
      seller_kampus: 'Universitas Indonesia',
      nama: 'Mechanical Keyboard 75%',
      kategori: 'Elektronik',
      kondisi: 'Good',
      harga: 390000,
      harga_asli: 620000,
      deskripsi: 'Keyboard compact untuk produktivitas dan mengetik. Seluruh tombol berfungsi, dilengkapi kabel.',
      foto_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85',
      lokasi: 'Makassar',
      status: 'approved',
      tanggal_dibuat: '2026-11-02T16:59:11.775981Z',
      tanggal_diperbarui: '2026-11-02T16:59:11.776010Z',
      dilihat: 0,
    },
    {
      id: '8acd1945-add3-4d69-b56f-cfbd1d92f1ca',
      seller_id: null,
      seller_nama: 'Rizky Pratama',
      seller_email: 'mahasiswa@kampusloop.id',
      seller_kampus: 'Universitas Negeri Makassar (UNM)',
      nama: 'Sneakers Everyday',
      kategori: 'Fashion',
      kondisi: 'Fair',
      harga: 210000,
      harga_asli: 390000,
      deskripsi: 'Sneakers untuk aktivitas harian. Ada tanda pemakaian pada bagian outsole, detail sesuai foto.',
      foto_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85',
      lokasi: 'Surabaya',
      status: 'approved',
      tanggal_dibuat: '2026-11-02T16:59:11.782207Z',
      tanggal_diperbarui: '2026-11-02T16:59:11.782237Z',
      dilihat: 0,
    },
    {
      id: 'cbabbdb9-3b69-4c27-ad17-a24d7021bdba',
      seller_id: null,
      seller_nama: 'Nadia',
      seller_email: 'nadia@kampusloop.id',
      seller_kampus: 'Universitas Indonesia',
      nama: 'Drawing Tablet Entry Level',
      kategori: 'Hobi & Organisasi',
      kondisi: 'Good',
      harga: 440000,
      harga_asli: 700000,
      deskripsi: 'Pen tablet untuk ilustrasi digital, desain, dan catatan visual. Stylus dan kabel termasuk.',
      foto_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=900&q=85',
      lokasi: 'Malang',
      status: 'sold',
      tanggal_dibuat: '2026-11-02T16:59:11.789256Z',
      tanggal_diperbarui: '2026-11-02T16:59:11.789314Z',
      dilihat: 0,
    },
    {
      id: '675e57d4-abfe-4306-88e4-94b3e5fc024e',
      seller_id: null,
      seller_nama: 'Rizky Pratama',
      seller_email: 'mahasiswa@kampusloop.id',
      seller_kampus: 'Universitas Negeri Makassar (UNM)',
      nama: 'Kalkulator Casio FX-991EX',
      kategori: 'Buku & Akademik',
      kondisi: 'Good',
      harga: 185000,
      harga_asli: 250000,
      deskripsi: 'Kalkulator scientific, fungsi normal dan lengkap.',
      foto_url: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=500',
      lokasi: 'Makassar',
      status: 'pending',
      tanggal_dibuat: '2026-11-02T16:59:11.796373Z',
      tanggal_diperbarui: '2026-11-02T16:59:11.796400Z',
      dilihat: 0,
    },
    {
      id: '65f4d482-fedf-4f72-88de-087fe4f1295b',
      seller_id: null,
      seller_nama: 'Nadia',
      seller_email: 'nadia@kampusloop.id',
      seller_kampus: 'Universitas Indonesia',
      nama: 'Jaket Organisasi Fakultas',
      kategori: 'Fashion',
      kondisi: 'Like New',
      harga: 90000,
      harga_asli: 150000,
      deskripsi: 'Jaket organisasi dengan kondisi sangat baik.',
      foto_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
      lokasi: 'Makassar',
      status: 'pending',
      tanggal_dibuat: '2026-11-02T16:59:11.802703Z',
      tanggal_diperbarui: '2026-11-02T16:59:11.802757Z',
      dilihat: 0,
    },
    {
      id: '3c1a2551-c6dd-44d2-a350-88ba61496eef',
      seller_id: null,
      seller_nama: 'Rizky Pratama',
      seller_email: 'mahasiswa@kampusloop.id',
      seller_kampus: 'Universitas Negeri Makassar (UNM)',
      nama: 'Keyboard',
      kategori: 'Elektronik',
      kondisi: 'Like New',
      harga: 250000,
      harga_asli: null,
      deskripsi: 'bagus',
      foto_url: 'https://i.pinimg.com/736x/77/92/a8/7792a8203df47dc4046e7989650bdfaa.jpg',
      lokasi: '',
      status: 'approved',
      tanggal_dibuat: '2026-11-03T05:35:56.211764Z',
      tanggal_diperbarui: '2026-11-03T05:35:56.211846Z',
      dilihat: 1,
    },
  ];

  const productsWithAdminOwner = productsData.map(p => ({
    ...p,
    seller_id: adminUser.id,
    seller_nama: adminUser.first_name,
    seller_email: adminUser.email,
    seller_kampus: 'Universitas Negeri Makassar',
  }));

  const { error: prodErr } = await supabase
    .from('products')
    .upsert(productsWithAdminOwner, { onConflict: 'id' });

  if (prodErr) {
    console.error('[ERROR] Failed to seed products:', prodErr.message);
    process.exit(1);
  }
  console.log(`[OK] ${productsData.length} products migrated.`);

  // 5. All 4 real orders from db.sqlite3 (app_pesanan)
  console.log('[*] Migrating all 4 orders from db.sqlite3...');
  const ordersData = [
    {
      id: '49838bd0-3288-4c16-a17d-a637e867cdee',
      order_number: 'KL-0241',
      pembeli_id: null,
      pembeli_nama: 'Rizky Pratama',
      seller_nama: 'Rizky Pratama',
      produk_id: 'fdb96982-7dc7-4137-be8a-cacdddd4bf77',
      produk_nama: 'Buku Dasar-Dasar Manajemen',
      produk_foto: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=85',
      harga_bayar: 65000,
      status: 'completed',
      catatan: 'COD di perpustakaan pusat',
      tanggal_pesan: '2026-11-02T16:59:11.812716Z',
      tanggal_selesai: null,
    },
    {
      id: '9e6b91cd-6f93-46aa-8dd9-bddb124850ce',
      order_number: 'KL-0238',
      pembeli_id: null,
      pembeli_nama: 'Rizky Pratama',
      seller_nama: 'Rizky Pratama',
      produk_id: '77c4e45f-efa1-457a-af79-c791f26dcc87',
      produk_nama: 'Sony Wireless Headphones',
      produk_foto: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
      harga_bayar: 725000,
      status: 'cod_waiting',
      catatan: 'COD depan fakultas teknik',
      tanggal_pesan: '2026-11-02T16:59:11.818946Z',
      tanggal_selesai: null,
    },
    {
      id: '84a0e02e-fb9f-4fbd-8e3d-6e3d06a09893',
      order_number: 'KL-0218',
      pembeli_id: null,
      pembeli_nama: 'Rizky Pratama',
      seller_nama: 'Nadia',
      produk_id: 'cbabbdb9-3b69-4c27-ad17-a24d7021bdba',
      produk_nama: 'Drawing Tablet Entry Level',
      produk_foto: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=900&q=85',
      harga_bayar: 440000,
      status: 'confirmed',
      catatan: 'Pesanan dibuat melalui KampusLoop checkout',
      tanggal_pesan: '2026-11-02T18:10:31.249188Z',
      tanggal_selesai: null,
    },
    {
      id: '53ebd0dc-2b54-40c1-8930-3dc7bc89a202',
      order_number: 'KL-6338',
      pembeli_id: null,
      pembeli_nama: 'Admin',
      seller_nama: 'Nadia',
      produk_id: 'bfbaa17a-8b1f-4418-91f5-6a4bfdaae5a2',
      produk_nama: 'MacBook Air M1 2020',
      produk_foto: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85',
      harga_bayar: 6850000,
      status: 'confirmed',
      catatan: 'Pesanan dibuat melalui KampusLoop checkout',
      tanggal_pesan: '2026-11-02T20:41:25.589872Z',
      tanggal_selesai: null,
    },
  ];

  const { error: ordErr } = await supabase
    .from('orders')
    .upsert(ordersData, { onConflict: 'id' });

  if (ordErr) {
    console.error('[ERROR] Failed to seed orders:', ordErr.message);
    process.exit(1);
  }
  console.log(`[OK] ${ordersData.length} orders migrated.`);

  // 6. All contact messages from db.sqlite3 (app_pesankontak)
  console.log('[*] Migrating contact messages from db.sqlite3...');
  const { data: existingContacts } = await supabase
    .from('contacts')
    .select('id')
    .eq('email', 'test@kampusloop.id')
    .eq('pesan', 'Halo KampusLoop');

  if (!existingContacts || existingContacts.length === 0) {
    const { error: contactErr } = await supabase.from('contacts').insert({
      nama: 'Test User',
      email: 'test@kampusloop.id',
      topik: 'Pertanyaan Umum',
      pesan: 'Halo KampusLoop',
      tanggal: '2026-11-08T19:48:16.022120Z',
      sudah_dibaca: false,
    });
    if (contactErr) {
      console.error('[ERROR] Failed to seed contact message:', contactErr.message);
    }
  }
  console.log('[OK] Contact messages migrated.');

  // 7. Initial ModuLab Article
  console.log('[*] Seeding initial ModuLab article...');
  const { error: artErr } = await supabase.from('articles').upsert({
    id: 'a1b2c3d4-1111-4444-8888-1234567890ab',
    author_id: adminUser.id,
    author_nama: adminUser.first_name,
    judul: 'Jangan Dibuang! 7 Barang Bekas Mahasiswa Ini Masih Bernilai Tinggi & Berpotensi Dijual Kembali di ModuLab KampusLoop',
    slug: 'barang-bekas-mahasiswa-bernilai-dan-berpotensi-dijual-kembali-modulab',
    kategori: 'Berita ModuLab',
    ringkasan: 'Banyak perlengkapan kuliah dan barang kos yang menumpuk saat pergantian semester ternyata masih bernilai tinggi. Simak daftar barang yang paling dicari mahasiswa dan cara mengubahnya jadi cuan di ekosistem ModuLab KampusLoop.',
    konten: `Setiap akhir semester atau menjelang kelulusan, kamar kos dan rumah mahasiswa hampir selalu dipenuhi barang-barang yang sudah jarang terpakai. Padahal, di lingkungan kampus yang dinamis, kebutuhan mahasiswa baru dan adik tingkat terhadap perlengkapan kuliah yang hemat namun berkualitas justru selalu tinggi.

Melalui inisiatif ekosistem digital ModuLab bersama KampusLoop, barang-barang preloved mahasiswa tidak lagi sekadar menumpuk di gudang kos, melainkan dapat terus berputar dan memberi nilai ekonomi nyata bagi sesama mahasiswa.

Berikut 7 barang bekas mahasiswa yang terbukti masih bernilai tinggi dan sangat berpotensi untuk dijual kembali:

1. Buku Referensi, Modul & Diktat Kuliah
Buku teks mata kuliah wajib, modul praktikum, hingga buku persiapan TOEFL/IELTS selalu dicari oleh mahasiswa semester awal. Selama halaman bersih dan masih terbaca jelas, buku bekas dapat terjual cepat di kisaran 40%–70% dari harga barunya.

2. Laptop, Tablet & Aksesori Produktivitas
Perangkat seperti MacBook, laptop kuliah, keyboard mechanical, mouse wireless, dan drawing tablet memiliki permintaan paling stabil di kalangan mahasiswa teknik, desain, maupun bisnis.

3. Kalkulator Scientific & Alat Praktikum
Kalkulator scientific (seperti seri Casio FX), jas lab, penggaris skala teknik, hingga multimeter adalah barang wajib yang biasanya hanya dipakai beberapa semester, sehingga kondisi bekasnya hampir selalu masih prima.

4. Peralatan Kamar Kos & Meja Belajar
Kursi kerja minimalis, lampu belajar adjustable, rak buku portabel, hingga kipas meja menjadi incaran utama mahasiswa baru yang baru pindah ke kos sekitar kampus karena lebih praktis dan bebas ongkir lewat COD.

5. Headphone & Perangkat Audio Belajar
Headphone wireless atau earphone berkualitas sangat diminati untuk kebutuhan belajar mandiri di perpustakaan maupun rapat organisasi daring.

6. Kamera & Perlengkapan Dokumentasi Organisasi
Kamera mirrorless entry-level, tripod, dan ring light sering dibutuhkan oleh pengurus BEM, himpunan mahasiswa, UKM media, serta mahasiswa komunikasi.

7. Jaket, Tas Kuliah & Sneakers Harian
Backpack dengan kompartemen laptop, jaket varsity/organisasi yang terawat, serta sneakers kasual tetap memiliki pasar kuat di kalangan mahasiswa yang mengutamakan fungsi dan gaya hemat.

Tips Agar Barang Cepat Terjual di ModuLab KampusLoop:
- Bersihkan barang dan ambil foto yang terang serta jujur menunjukkan kondisi asli.
- Cantumkan detail kelengkapan dan lokasi COD kampus (misalnya perpustakaan pusat atau kantin fakultas).
- Tetapkan harga wajar (sekitar 40%–75% dari harga baru tergantung kondisi).

Dengan menjual kembali barang bekas yang masih layak pakai, mahasiswa tidak hanya mendapatkan uang saku tambahan, tetapi juga membantu teman sekampus berhemat sekaligus mengurangi limbah barang di lingkungan kampus.`,
    gambar_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=85',
    status: 'published',
  }, { onConflict: 'id' });
  if (artErr) {
    console.error('[WARN] Article seed skipped/error:', artErr.message);
  } else {
    console.log('[OK] Initial ModuLab article seeded.');
  }

  console.log('[OK] Supabase migration & seed complete!');
}

seed().catch((err) => {
  console.error('[FATAL] Seed error:', err);
  process.exit(1);
});
