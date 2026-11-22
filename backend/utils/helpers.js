const supabase = require('../supabaseClient');
const v4Store = require('./v4Store');

const DEFAULT_PAYMENT_CONFIG = {
  cod_enabled: true,
  qris_enabled: true,
  qris_image_url: '',
  qris_label: 'QRIS KampusLoop',
  bank_enabled: true,
  bank_name: 'BCA / BNI / BRI',
  bank_account_number: '',
  bank_account_name: '',
  cod_locations: 'Perpustakaan Pusat, Kantin Fakultas, Lobi Gedung Utama Kampus',
};

const DEFAULT_SITE_SETTINGS = {
  nama_toko: 'KampusLoop',
  tagline: 'Student Circular Marketplace',
  email_support: 'hello@kampusloop.id',
  no_telp: '@kampusloop',
  no_wa: '+62 812-3456-7890',
  alamat: 'Universitas Negeri Makassar & Universitas Indonesia Hub',
  status_toko: 'ONLINE',
  banner_pengumuman: 'Selamat datang di KampusLoop! Platform circular marketplace kampus.',
  instagram_handle: '@kampusloop',
  instagram_url: 'https://instagram.com',
  tiktok_url: 'https://tiktok.com',
  telegram_handle: '@kampusloop',
  footer_deskripsi: 'Marketplace barang preloved khusus mahasiswa. Temukan barang yang kamu butuhkan, jual yang tak lagi digunakan, dan biarkan semuanya terus berputar.',
  footer_copyright: '© 2026 KampusLoop. Reuse more, waste less.',
  footer_tagline_bawah: 'Made with care for campus communities ♡',
  kebijakan_privasi_judul: 'Kebijakan Privasi',
  kebijakan_privasi_isi: `1. Pengumpulan Data Mahasiswa
KampusLoop mengumpulkan data identitas dasar (nama, email, kampus, nomor telepon/WhatsApp, NIM, dan dokumen verifikasi penjual seperti KTM dan surat perjanjian) semata-mata untuk memastikan keamanan transaksi antar mahasiswa.

2. Penggunaan & Keamanan Informasi
Data pribadi Anda hanya digunakan untuk keperluan verifikasi akun, komunikasi transaksi COD, dan pencegahan penipuan. Kata sandi akun selalu dienkripsi dan tidak pernah dipublikasikan.

3. Perlindungan Dokumen Verifikasi
Foto KTM, bukti mahasiswa, dan surat perjanjian penjual hanya dapat diakses oleh Admin Web resmi KampusLoop untuk proses validasi dan tidak dibagikan kepada pihak ketiga tanpa persetujuan hukum.

4. Hak Pengguna
Anda dapat memperbarui data profil kapan saja melalui halaman Dashboard Akun atau menghubungi tim support kami melalui halaman Contact.`,
  syarat_ketentuan_judul: 'Syarat & Ketentuan',
  syarat_ketentuan_isi: `1. Ketentuan Akun & Peran
Setiap pengguna wajib mendaftar dan masuk terlebih dahulu sebelum melakukan transaksi atau menyimpan wishlist. Untuk menjual barang, pengguna wajib mengajukan verifikasi sebagai Penjual dan menyetujui Surat Perjanjian Penjual.

2. Kelayakan Barang yang Dijual
Penjual menjamin barang yang diunggah adalah barang legal, milik sendiri, layak pakai, serta mencantumkan kondisi, foto, dan harga yang jujur.

3. Transaksi & COD Kampus
Transaksi dilakukan secara langsung (Cash on Delivery / COD) di lokasi aman lingkungan kampus sesuai kesepakatan pembeli dan penjual. KampusLoop tidak memungut komisi transaksi (0%).

4. Sanksi Pelanggaran
Pelanggaran terhadap aturan kejujuran produk, pemalsuan identitas mahasiswa, atau indikasi penipuan dapat mengakibatkan penghapusan produk dan pemblokiran akun permanen.`,
  panduan_keamanan_judul: 'Panduan Keamanan Transaksi',
  panduan_keamanan_isi: `1. Selalu COD di Area Kampus Ramai
Lakukan pertemuan serah terima barang di area terbuka dan ramai seperti perpustakaan pusat, kantin fakultas, atau lobi gedung kampus pada jam aktif.

2. Cek Kondisi Barang Sebelum Membayar
Periksa fisik, kelengkapan, dan fungsi barang secara langsung sebelum menyerahkan pembayaran kepada penjual.

3. Pastikan Penjual Terverifikasi
KampusLoop memvalidasi berkas mahasiswa dan surat perjanjian penjual. Jika menemukan kejanggalan atau indikasi penipuan, segera laporkan melalui halaman Contact.`,
  surat_perjanjian_file_url: '',
  payment_config: DEFAULT_PAYMENT_CONFIG,
  shipping_config: v4Store.DEFAULT_SHIPPING_CONFIG,
};

const DEFAULT_AGREEMENT_TEMPLATE = {
  judul: 'SURAT PERJANJIAN PENJUAL TERVERIFIKASI KAMPUSLOOP',
  isi: `Saya yang bertanda tangan di bawah ini:

Nama Lengkap       : {{NAMA}}
NIM                : {{NIM}}
Universitas/Kampus : {{KAMPUS}}
Fakultas / Prodi   : {{FAKULTAS_PRODI}}
No. WhatsApp / HP  : {{TELP}}
Alamat / Kos       : {{ALAMAT}}

Dengan ini menyatakan secara sadar, jujur, dan tanpa paksaan untuk mengajukan diri sebagai Penjual Terverifikasi pada platform KampusLoop dengan ketentuan sebagai berikut:

1. KEASLIAN IDENTITAS MAHASISWA
   Data diri, Kartu Tanda Mahasiswa (KTM), dan bukti pendukung lain yang saya unggah adalah benar milik saya sendiri dan masih berlaku.

2. KEJUJURAN PRODUK & ANTI-PENIPUAN
   Saya menjamin setiap barang yang saya tawarkan adalah milik sah saya, bukan barang curian/ilegal/berbahaya, serta kondisi, foto, harga, dan deskripsi barang sesuai dengan keadaan sebenarnya.

3. TRANSAKSI AMAN & BERTANGGUNG JAWAB
   Saya bersedia melakukan transaksi secara transparan (termasuk COD di area kampus yang aman), tidak melakukan penipuan dalam bentuk apa pun, dan bertanggung jawab penuh atas setiap keluhan atau sengketa transaksi.

4. SANKSI PELANGGARAN
   Apabila saya terbukti memalsukan dokumen, menjual barang fiktif, atau melakukan tindak penipuan, saya bersedia menerima pemblokiran akun permanen dan diproses sesuai peraturan kampus maupun hukum yang berlaku di Indonesia.

Demikian surat perjanjian ini saya buat dan tandatangani dengan penuh tanggung jawab pada tanggal {{TANGGAL}}.


Yang Menyatakan,


( {{NAMA}} )
NIM: {{NIM}}`,
  catatan: 'Unduh format surat ini, lengkapi dan tandatangani, lalu unggah kembali bersama foto KTM dan bukti pendukung mahasiswa lainnya.',
  file_url: '',
};

function checkAdmin(user, profile) {
  if (!user) return false;
  return Boolean(
    user.is_superuser ||
    user.is_staff ||
    user.last_name === 'Super Admin' ||
    (profile && profile.role === 'admin')
  );
}

function getUserRole(user, profile) {
  if (checkAdmin(user, profile)) return 'admin';
  if (profile && profile.role === 'seller') return 'seller';
  return 'user';
}

function normalizePaymentConfig(cfg, fallback = DEFAULT_PAYMENT_CONFIG) {
  if (!cfg || typeof cfg !== 'object') return { ...fallback };
  return { ...fallback, ...cfg };
}

function buildUserProfileData(user, profile) {
  const adminFlag = checkAdmin(user, profile);
  const role = getUserRole(user, profile);
  const store = v4Store.readStore();
  const extraAddr = store.userAddresses[String(user.id)] || {};
  const fallbackPayment = store.sellerPayments[String(user.id)] || null;
  const rawPayment = (profile && profile.payment_config) || fallbackPayment;

  return {
    id: user.id,
    name: user.first_name || user.username,
    nama: user.first_name || user.username,
    email: user.email,
    role,
    is_staff: Boolean(user.is_staff || adminFlag),
    is_superuser: Boolean(user.is_superuser),
    kampus: (profile && profile.kampus) || '',
    campus: (profile && profile.kampus) || '',
    telp: (profile && profile.telp) || '',
    gender: (profile && profile.gender) || '',
    alamat: (profile && profile.alamat) || extraAddr.alamat || '',
    provinsi: (profile && profile.provinsi) || extraAddr.provinsi || '',
    kota_kabupaten: (profile && profile.kota_kabupaten) || extraAddr.kota_kabupaten || '',
    kecamatan: (profile && profile.kecamatan) || extraAddr.kecamatan || '',
    kode_pos: (profile && profile.kode_pos) || extraAddr.kode_pos || '',
    detail_alamat: (profile && profile.detail_alamat) || extraAddr.detail_alamat || '',
    bio: (profile && profile.bio) || '',
    nim: (profile && profile.nim) || '',
    fakultas_prodi: (profile && profile.fakultas_prodi) || '',
    angkatan: (profile && profile.angkatan) || '',
    is_verified: Boolean(profile && profile.is_verified),
    pengajuan_admin: Boolean(profile && profile.pengajuan_admin),
    status_pengajuan_admin: (profile && profile.status_pengajuan_admin) || 'none',
    alasan_pengajuan_admin: (profile && profile.alasan_pengajuan_admin) || '',
    pengajuan_penjual: Boolean(profile && profile.pengajuan_penjual),
    status_pengajuan_penjual: (profile && profile.status_pengajuan_penjual) || 'none',
    alasan_pengajuan_penjual: (profile && profile.alasan_pengajuan_penjual) || '',
    catatan_admin_penjual: (profile && profile.catatan_admin_penjual) || '',
    ktm_url: (profile && profile.ktm_url) || '',
    bukti_lain_url: (profile && profile.bukti_lain_url) || '',
    surat_perjanjian_url: (profile && profile.surat_perjanjian_url) || '',
    tanggal_pengajuan_penjual: (profile && profile.tanggal_pengajuan_penjual) || null,
    payment_config: normalizePaymentConfig(rawPayment, DEFAULT_PAYMENT_CONFIG),
  };
}

let cachedSiteSettings = null;
let siteSettingsCacheTime = 0;
const SITE_SETTINGS_TTL_MS = 60000; // 60 seconds

function clearSiteSettingsCache() {
  cachedSiteSettings = null;
  siteSettingsCacheTime = 0;
}

async function getSiteSettings(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedSiteSettings && (now - siteSettingsCacheTime < SITE_SETTINGS_TTL_MS)) {
    return cachedSiteSettings;
  }

  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single();

  const store = v4Store.readStore();
  const merged = { ...DEFAULT_SITE_SETTINGS };
  if (settings) {
    Object.keys(DEFAULT_SITE_SETTINGS).forEach((key) => {
      if (key === 'payment_config') {
        const rawCfg = settings.payment_config || store.sitePaymentConfig;
        merged.payment_config = normalizePaymentConfig(rawCfg, DEFAULT_PAYMENT_CONFIG);
      } else if (key === 'shipping_config') {
        const rawShip = settings.shipping_config || store.shippingConfig;
        merged.shipping_config = { ...v4Store.DEFAULT_SHIPPING_CONFIG, ...(rawShip || {}) };
      } else if (settings[key] !== undefined && settings[key] !== null && settings[key] !== '') {
        merged[key] = settings[key];
      }
    });
    merged.id = settings.id;
  } else if (store.sitePaymentConfig || store.shippingConfig) {
    if (store.sitePaymentConfig) {
      merged.payment_config = normalizePaymentConfig(store.sitePaymentConfig, DEFAULT_PAYMENT_CONFIG);
    }
    if (store.shippingConfig) {
      merged.shipping_config = { ...v4Store.DEFAULT_SHIPPING_CONFIG, ...store.shippingConfig };
    }
  }
  if (!merged.surat_perjanjian_file_url && store.agreementFileUrl) {
    merged.surat_perjanjian_file_url = store.agreementFileUrl;
  }

  cachedSiteSettings = merged;
  siteSettingsCacheTime = now;
  return merged;
}

async function formatProducts(products, userId) {
  const list = products || [];
  if (list.length === 0) return [];

  const sellerIds = [...new Set(list.map(p => p.seller_id).filter(Boolean))];
  const sellersMap = {};
  const profilesMap = {};

  const [{ data: sellers }, { data: profiles }, siteSettings] = await Promise.all([
    sellerIds.length > 0
      ? supabase.from('users').select('id, email, username, first_name, is_staff, is_superuser').in('id', sellerIds)
      : Promise.resolve({ data: [] }),
    sellerIds.length > 0
      ? supabase.from('user_profiles').select('*').in('user_id', sellerIds)
      : Promise.resolve({ data: [] }),
    getSiteSettings(),
  ]);

  const store = v4Store.readStore();

  (sellers || []).forEach(u => { sellersMap[u.id] = u; });
  (profiles || []).forEach(pr => { profilesMap[pr.user_id] = pr; });

  let wishlistedSet = new Set();
  if (userId) {
    const productIds = list.map(p => p.id);
    const { data: wlRows } = await supabase
      .from('wishlist')
      .select('produk_id')
      .eq('user_id', userId)
      .in('produk_id', productIds);
    wishlistedSet = new Set((wlRows || []).map(w => w.produk_id));
  }

  return list.map(product => {
    const seller = product.seller_id ? sellersMap[product.seller_id] : null;
    const sellerProfile = product.seller_id ? profilesMap[product.seller_id] : null;

    const seller_nama = seller ? (seller.first_name || seller.username) : (product.seller_nama || '');
    const seller_email = seller ? seller.email : (product.seller_email || '');
    const seller_kampus = (sellerProfile && sellerProfile.kampus) || product.seller_kampus || '';

    const isAdminOwned = !seller || checkAdmin(seller, sellerProfile);
    const sellerStoredPayment =
      (sellerProfile && sellerProfile.payment_config) ||
      (product.seller_id ? store.sellerPayments[String(product.seller_id)] : null);

    const paymentOptions = isAdminOwned
      ? siteSettings.payment_config
      : normalizePaymentConfig(sellerStoredPayment, siteSettings.payment_config);

    const customCod =
      (product.cod_lokasi && String(product.cod_lokasi).trim()) ||
      store.productCod[String(product.id)] ||
      '';

    const codLokasi =
      customCod ||
      paymentOptions.cod_locations ||
      DEFAULT_PAYMENT_CONFIG.cod_locations;

    const defaultStok = product.status === 'sold' ? 0 : 1;
    const stok = product.stok !== undefined ? product.stok : v4Store.getProductStok(product.id, defaultStok);

    return {
      id: product.id,
      seller_id: product.seller_id || null,
      seller_nama,
      seller_email,
      seller_kampus,
      nama: product.nama,
      kategori: product.kategori,
      kondisi: product.kondisi,
      harga: product.harga,
      harga_asli: product.harga_asli,
      deskripsi: product.deskripsi,
      foto_url: product.foto_url,
      foto_display: product.foto_url || '',
      lokasi: product.lokasi,
      cod_lokasi: codLokasi,
      cod_lokasi_custom: customCod,
      payment_options: paymentOptions,
      stok: Number(stok),
      quantity: Number(stok),
      status: Number(stok) <= 0 && product.status !== 'pending' ? 'sold' : product.status,
      tanggal_dibuat: product.tanggal_dibuat,
      tanggal_diperbarui: product.tanggal_diperbarui,
      dilihat: product.dilihat,
      is_wishlisted: wishlistedSet.has(product.id),
    };
  });
}

async function formatProduct(product, userId) {
  const [formatted] = await formatProducts([product], userId);
  return formatted;
}

async function getAgreementTemplate() {
  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single();
  const store = v4Store.readStore();

  return {
    judul: (settings && settings.surat_perjanjian_judul) || DEFAULT_AGREEMENT_TEMPLATE.judul,
    isi: (settings && settings.surat_perjanjian_isi) || DEFAULT_AGREEMENT_TEMPLATE.isi,
    catatan: (settings && settings.surat_perjanjian_catatan) || DEFAULT_AGREEMENT_TEMPLATE.catatan,
    file_url: (settings && settings.surat_perjanjian_file_url) || store.agreementFileUrl || '',
  };
}

module.exports = {
  DEFAULT_PAYMENT_CONFIG,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_AGREEMENT_TEMPLATE,
  checkAdmin,
  getUserRole,
  normalizePaymentConfig,
  buildUserProfileData,
  formatProducts,
  formatProduct,
  getAgreementTemplate,
  getSiteSettings,
  clearSiteSettingsCache,
};
