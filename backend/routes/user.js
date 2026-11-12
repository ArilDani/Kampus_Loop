const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { isAuthenticated } = require('../middleware/auth');
const v4Store = require('../utils/v4Store');
const {
  buildUserProfileData,
  formatProducts,
  getAgreementTemplate,
  DEFAULT_PAYMENT_CONFIG,
  normalizePaymentConfig,
} = require('../utils/helpers');

const STATUS_DISPLAY = {
  pending: 'Menunggu Konfirmasi',
  confirmed: 'Dikonfirmasi',
  cod_waiting: 'Menunggu COD',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

// GET /api/user/listings/ — user's own products (for seller)
router.get('/listings/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', userId)
      .order('tanggal_dibuat', { ascending: false });

    if (error) {
      console.error('Listings error:', error);
      return res.status(500).json({ error: 'Server error.' });
    }

    const result = await formatProducts(products || [], userId);
    res.json(result);
  } catch (err) {
    console.error('Listings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/user/seller-orders/ — orders on products owned by this seller
router.get('/seller-orders/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { data: myProducts } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', userId);

    const productIds = (myProducts || []).map(p => p.id);
    if (productIds.length === 0) {
      return res.json([]);
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .in('produk_id', productIds)
      .order('tanggal_pesan', { ascending: false });

    if (error) {
      console.error('Seller orders error:', error);
      return res.status(500).json({ error: 'Server error.' });
    }

    const store = v4Store.readStore();
    res.json((orders || []).map(o => {
      const extras = store.orderExtras[String(o.id)] || {};
      return {
        ...extras,
        ...o,
        status_display: STATUS_DISPLAY[o.status] || o.status,
      };
    }));
  } catch (err) {
    console.error('Seller orders error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/user/stats/ — user stats
router.get('/stats/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const [{ data: allProducts }, { data: allOrders }, { data: wishlistItems }] = await Promise.all([
      supabase.from('products').select('id, status').eq('seller_id', userId),
      supabase.from('orders').select('id, status, harga_bayar').eq('pembeli_id', userId),
      supabase.from('wishlist').select('id').eq('user_id', userId),
    ]);

    const totalListings = (allProducts || []).length;
    const totalOrders = (allOrders || []).length;
    const totalTransaksi = (allOrders || [])
      .filter(o => o.status === 'completed' || o.status === 'confirmed')
      .reduce((sum, o) => sum + (o.harga_bayar || 0), 0);
    const wishlistCount = (wishlistItems || []).length;
    const impactScore = (allProducts || []).filter(p => p.status === 'sold').length;

    res.json({
      total_listings: totalListings,
      total_orders: totalOrders,
      total_transaksi: totalTransaksi,
      wishlist_count: wishlistCount,
      impact_score: impactScore,
      listings_count: totalListings,
      orders_count: totalOrders,
      total_spent: totalTransaksi,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT & POST /api/user/profile/update/ — update profile
async function updateProfile(req, res) {
  try {
    const userId = req.session.userId;
    const data = req.body;

    const { data: user, error: uErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (uErr || !user) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    const nama = (data.nama || '').trim() || (data.name || '').trim();
    const email = (data.email || '').trim().toLowerCase();

    const userUpdates = {};
    if (nama) userUpdates.first_name = nama;
    if (email && email !== user.email) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', userId)
        .single();
      if (existing) {
        return res.status(400).json({ error: 'Email sudah digunakan oleh pengguna lain.' });
      }
      userUpdates.email = email;
      userUpdates.username = email;
    }

    if (Object.keys(userUpdates).length > 0) {
      await supabase.from('users').update(userUpdates).eq('id', userId);
    }

    let { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      const { data: newProfile } = await supabase
        .from('user_profiles')
        .insert({ user_id: userId })
        .select()
        .single();
      profile = newProfile;
    }

    const profileUpdates = {};
    if ('kampus' in data || 'campus' in data) profileUpdates.kampus = (data.kampus || data.campus || '').trim();
    if ('telp' in data) profileUpdates.telp = (data.telp || '').trim();
    if ('gender' in data) profileUpdates.gender = (data.gender || '').trim();
    if ('alamat' in data) profileUpdates.alamat = (data.alamat || '').trim();
    if ('provinsi' in data) profileUpdates.provinsi = (data.provinsi || '').trim();
    if ('kota_kabupaten' in data) profileUpdates.kota_kabupaten = (data.kota_kabupaten || '').trim();
    if ('kecamatan' in data) profileUpdates.kecamatan = (data.kecamatan || '').trim();
    if ('kode_pos' in data) profileUpdates.kode_pos = (data.kode_pos || '').trim();
    if ('detail_alamat' in data) profileUpdates.detail_alamat = (data.detail_alamat || '').trim();
    if ('bio' in data) profileUpdates.bio = (data.bio || '').trim();
    if ('nim' in data) profileUpdates.nim = (data.nim || '').trim();
    if ('fakultas_prodi' in data) profileUpdates.fakultas_prodi = (data.fakultas_prodi || '').trim();
    if ('angkatan' in data) profileUpdates.angkatan = (data.angkatan || '').trim();

    if (Object.keys(profileUpdates).length > 0) {
      const { error: upErr } = await supabase
        .from('user_profiles')
        .update(profileUpdates)
        .eq('user_id', userId);

      if (upErr && v4Store.isMissingColumnError(upErr)) {
        const {
          provinsi,
          kota_kabupaten,
          kecamatan,
          kode_pos,
          detail_alamat,
          ...baseProfileUpdates
        } = profileUpdates;
        if (Object.keys(baseProfileUpdates).length > 0) {
          await supabase.from('user_profiles').update(baseProfileUpdates).eq('user_id', userId);
        }
        v4Store.setUserAddress(userId, {
          provinsi: provinsi || '',
          kota_kabupaten: kota_kabupaten || '',
          kecamatan: kecamatan || '',
          kode_pos: kode_pos || '',
          detail_alamat: detail_alamat || '',
          alamat: profileUpdates.alamat || '',
        });
      }
    }

    const [{ data: updatedUser }, { data: updatedProfile }] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    ]);

    res.json({
      message: 'Profil berhasil diperbarui dan tersimpan di database.',
      user: buildUserProfileData(updatedUser, updatedProfile),
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

router.put('/profile/update/', isAuthenticated, updateProfile);
router.post('/profile/update/', isAuthenticated, updateProfile);

// GET /api/user/payment-settings/ & POST/PUT /api/user/payment-settings/ — Seller configures payment methods (QRIS, Bank, COD)
router.get('/payment-settings/', isAuthenticated, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', req.session.userId)
      .single();
    const store = v4Store.readStore();
    const rawCfg = (profile && profile.payment_config) || store.sellerPayments[String(req.session.userId)] || {};
    res.json(normalizePaymentConfig(rawCfg, DEFAULT_PAYMENT_CONFIG));
  } catch (err) {
    console.error('Get seller payment settings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

async function saveSellerPaymentSettings(req, res) {
  try {
    const userId = req.session.userId;
    const cfg = req.body.payment_config || req.body;
    const cleanConfig = {
      cod_enabled: Boolean(cfg.cod_enabled ?? true),
      qris_enabled: Boolean(cfg.qris_enabled ?? false),
      qris_image_url: String(cfg.qris_image_url || '').trim(),
      qris_label: String(cfg.qris_label || '').trim(),
      bank_enabled: Boolean(cfg.bank_enabled ?? false),
      bank_name: String(cfg.bank_name || '').trim(),
      bank_account_number: String(cfg.bank_account_number || '').trim(),
      bank_account_name: String(cfg.bank_account_name || '').trim(),
      cod_locations: String(cfg.cod_locations || '').trim(),
    };

    const { data: existingProf } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!existingProf) {
      await supabase.from('user_profiles').insert({ user_id: userId });
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ payment_config: cleanConfig })
      .eq('user_id', userId);

    if (error && v4Store.isMissingColumnError(error)) {
      v4Store.setSellerPayment(userId, cleanConfig);
    } else if (error) {
      console.error('Save seller payment error:', error);
      return res.status(400).json({ error: 'Gagal menyimpan pengaturan pembayaran penjual.' });
    } else {
      v4Store.setSellerPayment(userId, null);
    }

    // Apply COD locations to seller's products when requested or when they haven't set custom ones
    if (req.body.apply_to_products !== false && cleanConfig.cod_locations) {
      const { data: myProducts } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', userId);
      const ids = (myProducts || []).map((p) => p.id);
      if (ids.length > 0) {
        const { error: prodErr } = await supabase
          .from('products')
          .update({ cod_lokasi: cleanConfig.cod_locations })
          .eq('seller_id', userId);
        if (prodErr && v4Store.isMissingColumnError(prodErr)) {
          ids.forEach((pid) => v4Store.setProductCod(pid, cleanConfig.cod_locations));
        }
      }
    }

    const [{ data: updatedUser }, { data: updatedProfile }] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    ]);

    res.json({
      message: 'Metode pembayaran & lokasi COD penjual berhasil disimpan!',
      payment_config: cleanConfig,
      user: buildUserProfileData(updatedUser, updatedProfile),
    });
  } catch (err) {
    console.error('Save seller payment error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

router.post('/payment-settings/', isAuthenticated, saveSellerPaymentSettings);
router.put('/payment-settings/', isAuthenticated, saveSellerPaymentSettings);

// GET /api/user/agreement-template/ — fetch current agreement letter template (set by admin web)
router.get('/agreement-template/', isAuthenticated, async (req, res) => {
  try {
    const template = await getAgreementTemplate();
    res.json(template);
  } catch (err) {
    console.error('Agreement template error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/user/agreement-download/ — download pre-filled agreement letter (.doc)
router.get('/agreement-download/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const [{ data: user }, { data: profile }, template] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
      getAgreementTemplate(),
    ]);

    // If Admin Web uploaded a Word template file, redirect/download that file directly
    if (template.file_url) {
      return res.redirect(template.file_url);
    }

    const today = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const filledBody = (template.isi || '')
      .replace(/\{\{NAMA\}\}/g, (user && user.first_name) || '______________________')
      .replace(/\{\{NIM\}\}/g, (profile && profile.nim) || '______________________')
      .replace(/\{\{KAMPUS\}\}/g, (profile && profile.kampus) || '______________________')
      .replace(/\{\{FAKULTAS_PRODI\}\}/g, (profile && profile.fakultas_prodi) || '______________________')
      .replace(/\{\{TELP\}\}/g, (profile && profile.telp) || '______________________')
      .replace(/\{\{ALAMAT\}\}/g, (profile && profile.alamat) || '______________________')
      .replace(/\{\{TANGGAL\}\}/g, today);

    const escapeHtml = (s) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const docHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(template.judul)}</title>
<style>
  body { font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.6; color: #111; }
  h1 { text-align: center; font-size: 16pt; margin-bottom: 24px; text-transform: uppercase; border-bottom: 2px solid #111; padding-bottom: 8px; }
  pre { font-family: 'Times New Roman', serif; white-space: pre-wrap; font-size: 12pt; }
</style>
</head>
<body>
  <h1>${escapeHtml(template.judul)}</h1>
  <pre>${escapeHtml(filledBody)}</pre>
</body>
</html>`;

    res.setHeader('Content-Type', 'application/msword; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="Surat_Perjanjian_Penjual_KampusLoop.doc"');
    res.send(docHtml);
  } catch (err) {
    console.error('Agreement download error:', err);
    res.status(500).json({ error: 'Gagal mengunduh format surat perjanjian.' });
  }
});

// POST /api/user/ajukan-penjual/ — submit seller verification documents + signed agreement
router.post('/ajukan-penjual/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const {
      nama,
      nim,
      kampus,
      fakultas_prodi,
      angkatan,
      telp,
      alamat,
      alasan,
      ktm_url,
      bukti_lain_url,
      surat_perjanjian_url,
    } = req.body;

    if (!nim || !kampus || !fakultas_prodi || !telp) {
      return res.status(400).json({
        error: 'Data validasi mahasiswa (NIM, Kampus, Fakultas/Prodi, dan No. WA/Telp) wajib diisi.',
      });
    }

    if (!ktm_url || !bukti_lain_url || !surat_perjanjian_url) {
      return res.status(400).json({
        error: 'Wajib mengunggah KTM, bukti mahasiswa lainnya, dan surat perjanjian yang telah ditandatangani.',
      });
    }

    if (nama && nama.trim()) {
      await supabase.from('users').update({ first_name: nama.trim() }).eq('id', userId);
    }

    let { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      const { data: newProfile } = await supabase
        .from('user_profiles')
        .insert({ user_id: userId })
        .select()
        .single();
      profile = newProfile;
    }

    const { error: upErr } = await supabase
      .from('user_profiles')
      .update({
        nim: nim.trim(),
        kampus: kampus.trim(),
        fakultas_prodi: fakultas_prodi.trim(),
        angkatan: (angkatan || '').trim(),
        telp: telp.trim(),
        alamat: (alamat || '').trim(),
        pengajuan_penjual: true,
        status_pengajuan_penjual: 'pending',
        alasan_pengajuan_penjual: (alasan || '').trim(),
        catatan_admin_penjual: '',
        ktm_url: ktm_url.trim(),
        bukti_lain_url: bukti_lain_url.trim(),
        surat_perjanjian_url: surat_perjanjian_url.trim(),
        tanggal_pengajuan_penjual: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (upErr) {
      console.error('Ajukan penjual error:', upErr);
      return res.status(400).json({ error: 'Gagal menyimpan pengajuan penjual.' });
    }

    const [{ data: updatedUser }, { data: updatedProfile }] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    ]);

    res.json({
      message: 'Pengajuan menjadi Penjual berhasil dikirim! Menunggu validasi Admin Web.',
      user: buildUserProfileData(updatedUser, updatedProfile),
    });
  } catch (err) {
    console.error('Ajukan penjual error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/user/ajukan-admin/ — request admin role (kept for backward compatibility)
router.post('/ajukan-admin/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const alasan = (req.body.alasan || '').trim();

    let { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      const { data: newProfile } = await supabase
        .from('user_profiles')
        .insert({ user_id: userId })
        .select()
        .single();
      profile = newProfile;
    }

    const updates = {
      pengajuan_admin: true,
      status_pengajuan_admin: 'pending',
    };
    if (alasan) updates.alasan_pengajuan_admin = alasan;

    await supabase.from('user_profiles').update(updates).eq('user_id', userId);

    const [{ data: user }, { data: updatedProfile }] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    ]);

    res.json({
      message: 'Pengajuan sebagai admin berhasil dikirim! Menunggu persetujuan admin platform.',
      status_pengajuan_admin: 'pending',
      pengajuan_admin: true,
      alasan_pengajuan_admin: updatedProfile.alasan_pengajuan_admin || '',
      user: buildUserProfileData(user, updatedProfile),
    });
  } catch (err) {
    console.error('Ajukan admin error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
