const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { isAdmin } = require('../middleware/auth');
const v4Store = require('../utils/v4Store');
const {
  buildUserProfileData,
  formatProducts,
  formatProduct,
  getAgreementTemplate,
  getSiteSettings,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_PAYMENT_CONFIG,
  normalizePaymentConfig,
} = require('../utils/helpers');

const STATUS_DISPLAY = {
  pending: 'Menunggu Konfirmasi',
  confirmed: 'Dikonfirmasi',
  cod_waiting: 'Menunggu COD',
  processing: 'Sedang Diproses',
  shipped: 'Sedang Dikirim',
  delivered: 'Telah Sampai',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const PAYMENT_STATUS_DISPLAY = {
  unpaid: 'Menunggu Pembayaran',
  paid: 'Lunas',
  failed: 'Pembayaran Gagal',
  expired: 'Kedaluwarsa',
  refunded: 'Dikembalikan (Refund)',
};

const SHIPPING_STATUS_DISPLAY = {
  pending: 'Menunggu Pengiriman',
  processing: 'Sedang Dikemas / Diproses',
  shipped: 'Dalam Perjalanan (Dikirim)',
  delivered: 'Telah Diterima',
  cancelled: 'Pengiriman Dibatalkan',
  returned: 'Diretur ke Penjual',
};

function formatCompactRupiah(amount) {
  const num = Number(amount || 0);
  if (num >= 1000000) {
    const jt = (num / 1000000).toFixed(1).replace('.', ',');
    return `Rp${jt.endsWith(',0') ? jt.slice(0, -2) : jt} jt`;
  }
  return `Rp${num.toLocaleString('id-ID')}`;
}

// GET /api/admin/stats/
router.get('/stats/', isAdmin, async (req, res) => {
  try {
    const [
      { data: allProducts },
      { data: allUsers },
      { data: allProfiles },
      { data: allOrders },
    ] = await Promise.all([
      supabase.from('products').select('id, status, kategori, harga, harga_asli, tanggal_dibuat'),
      supabase.from('users').select('id, is_staff, is_superuser'),
      supabase.from('user_profiles').select('user_id, role, status_pengajuan_penjual'),
      supabase.from('orders').select('id, status, harga_bayar, tanggal_pesan'),
    ]);

    const products = allProducts || [];
    const users = allUsers || [];
    const profiles = allProfiles || [];
    const orders = allOrders || [];

    const profileMap = {};
    profiles.forEach(p => { profileMap[p.user_id] = p; });

    let totalSellers = 0;
    let totalAdmins = 0;
    let totalRegularUsers = 0;
    users.forEach(u => {
      const pr = profileMap[u.id];
      if (u.is_superuser || u.is_staff || (pr && pr.role === 'admin')) totalAdmins++;
      else if (pr && pr.role === 'seller') totalSellers++;
      else totalRegularUsers++;
    });

    const pendingSellerApps = profiles.filter(p => p.status_pengajuan_penjual === 'pending').length;

    const totalProduk = products.length;
    const totalProdukAktif = products.filter(p => p.status === 'approved').length;
    const pendingProducts = products.filter(p => p.status === 'pending').length;
    const soldProducts = products.filter(p => p.status === 'sold').length;
    const totalPengguna = users.length;
    const totalPesanan = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed');
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    const totalTransaksi = completedOrders.reduce((sum, o) => sum + (o.harga_bayar || 0), 0);
    const totalOrderVolume = validOrders.reduce((sum, o) => sum + (o.harga_bayar || 0), 0);

    // Savings from preloved (harga_asli - harga) across sold/approved products
    const totalSavings = products.reduce((sum, p) => {
      if (p.harga_asli && p.harga_asli > p.harga) {
        return sum + (p.harga_asli - p.harga);
      }
      return sum;
    }, 0);

    const reuseCount = soldProducts + completedOrders.length;

    // Kategori breakdown with percentage
    const kategoriMap = {};
    products.forEach(p => {
      kategoriMap[p.kategori] = (kategoriMap[p.kategori] || 0) + 1;
    });
    const kategoriBreakdown = Object.entries(kategoriMap)
      .map(([kategori, count]) => ({
        kategori,
        count,
        percentage: totalProduk > 0 ? Math.round((count / totalProduk) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Weekly activity (Mon..Sun based on orders & product listings)
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const orderedLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const dayCounts = { Sen: 0, Sel: 0, Rab: 0, Kam: 0, Jum: 0, Sab: 0, Min: 0 };

    orders.forEach(o => {
      if (o.tanggal_pesan) {
        const d = new Date(o.tanggal_pesan);
        const label = days[d.getDay()];
        if (label) dayCounts[label] += 1;
      }
    });
    products.forEach(p => {
      if (p.tanggal_dibuat) {
        const d = new Date(p.tanggal_dibuat);
        const label = days[d.getDay()];
        if (label) dayCounts[label] += 1;
      }
    });

    const maxDayCount = Math.max(1, ...Object.values(dayCounts));
    const weeklyActivity = orderedLabels.map(day => ({
      day,
      count: dayCounts[day],
      pct: dayCounts[day] > 0 ? Math.max(18, Math.round((dayCounts[day] / maxDayCount) * 100)) : 8,
    }));

    const activeRate = totalProduk > 0
      ? Math.round(((totalProdukAktif + soldProducts) / totalProduk) * 100)
      : 0;

    // Platform Revenue Breakdown (Transaction Fee 2%, Tripay Fee, Net Revenue, Shipping Volume, COD Receivables)
    const store = v4Store.readStore();
    let grossPlatformRevenue = 0;
    let totalTripayFee = 0;
    let totalShippingVolume = 0;
    let totalCodFeePending = 0;
    let totalCodFeeCollected = 0;

    orders.forEach(o => {
      const extras = store.orderExtras[String(o.id)] || {};
      const subtotal = Number(o.subtotal_produk ?? extras.subtotal_produk ?? o.harga_bayar ?? 0);
      const serviceFee = Number(o.service_fee ?? extras.service_fee ?? Math.round(subtotal * 0.02));
      const shippingCost = Number(o.shipping_cost ?? extras.shipping_cost ?? 0);
      const tripayFee = Number(o.tripay_fee ?? extras.tripay_fee ?? 0);
      const paymentStatus = o.payment_status || extras.payment_status || (o.status === 'completed' ? 'paid' : 'unpaid');
      const codFeeStatus = o.cod_fee_status || extras.cod_fee_status || 'none';
      const codFeeAmount = Number(o.cod_fee_amount ?? extras.cod_fee_amount ?? (o.delivery_type === 'cod' ? serviceFee : 0));

      // Rule: Failed, cancelled, or returned transactions generate NO revenue
      const isSuccessful = o.status === 'completed' || (paymentStatus === 'paid' && o.status !== 'cancelled' && o.status !== 'failed');

      if (isSuccessful) {
        grossPlatformRevenue += serviceFee;
        totalTripayFee += tripayFee;
      }

      if (o.status !== 'cancelled' && o.status !== 'returned') {
        totalShippingVolume += shippingCost;
      }

      if (codFeeStatus === 'unpaid') {
        totalCodFeePending += codFeeAmount;
      } else if (codFeeStatus === 'paid') {
        totalCodFeeCollected += codFeeAmount;
      }
    });

    const netPlatformRevenue = Math.max(0, grossPlatformRevenue - totalTripayFee);

    res.json({
      total_produk: totalProduk,
      total_pengguna: totalPengguna,
      total_pesanan: totalPesanan,
      produk_pending: pendingProducts,
      total_transaksi: totalTransaksi,
      total_order_volume: totalOrderVolume,
      gross_platform_revenue: grossPlatformRevenue,
      gross_platform_revenue_formatted: formatCompactRupiah(grossPlatformRevenue),
      total_tripay_fee: totalTripayFee,
      total_tripay_fee_formatted: formatCompactRupiah(totalTripayFee),
      total_midtrans_fee: totalTripayFee,
      total_midtrans_fee_formatted: formatCompactRupiah(totalTripayFee),
      total_gateway_fee: totalTripayFee,
      total_gateway_fee_formatted: formatCompactRupiah(totalTripayFee),
      net_platform_revenue: netPlatformRevenue,
      net_platform_revenue_formatted: formatCompactRupiah(netPlatformRevenue),
      total_shipping_volume: totalShippingVolume,
      total_shipping_volume_formatted: formatCompactRupiah(totalShippingVolume),
      total_cod_fee_pending: totalCodFeePending,
      total_cod_fee_pending_formatted: formatCompactRupiah(totalCodFeePending),
      total_cod_fee_collected: totalCodFeeCollected,
      total_cod_fee_collected_formatted: formatCompactRupiah(totalCodFeeCollected),
      kategori_breakdown: kategoriBreakdown,
      total_users: totalPengguna,
      total_sellers: totalSellers,
      total_admins: totalAdmins,
      total_regular_users: totalRegularUsers,
      pending_seller_applications: pendingSellerApps,
      active_products: totalProdukAktif,
      pending_products: pendingProducts,
      sold_products: soldProducts,
      completed_orders: completedOrders.length,
      reuse_count: reuseCount,
      total_savings: totalSavings,
      total_savings_formatted: formatCompactRupiah(totalSavings),
      gmv: formatCompactRupiah(totalTransaksi || totalOrderVolume),
      gmv_completed: formatCompactRupiah(totalTransaksi),
      activity_rate: activeRate,
      weekly_activity: weeklyActivity,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/admin/produk/ — all products
router.get('/produk/', isAdmin, async (req, res) => {
  try {
    const statusFilter = (req.query.status || '').trim();
    const userId = req.session.userId;

    let query = supabase.from('products').select('*').order('tanggal_dibuat', { ascending: false });
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data: products, error } = await query;
    if (error) {
      console.error('Admin produk error:', error);
      return res.status(500).json({ error: 'Server error.' });
    }

    const result = await formatProducts(products || [], userId);
    res.json(result);
  } catch (err) {
    console.error('Admin produk error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/admin/produk/create/ — Admin Web adds product directly (immediately approved, no verification needed)
router.post('/produk/create/', isAdmin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = req.currentUser;
    const profile = req.currentProfile;
    const { nama, kategori, kondisi, harga, harga_asli, deskripsi, foto_url, lokasi, cod_lokasi, status, stok, quantity } = req.body;

    if (!nama || !kategori || !harga) {
      return res.status(400).json({ error: 'Nama, kategori, dan harga produk wajib diisi.' });
    }

    const initialStok = stok !== undefined ? parseInt(stok, 10) : (quantity !== undefined ? parseInt(quantity, 10) : 1);
    const initialStatus = initialStok <= 0 ? 'sold' : (status || 'approved');

    const baseInsert = {
      seller_id: userId,
      seller_nama: user.first_name || user.username,
      seller_email: user.email,
      seller_kampus: (profile && profile.kampus) || 'KampusLoop',
      nama: String(nama).trim(),
      kategori,
      kondisi: kondisi || 'Good',
      harga: parseInt(harga, 10),
      harga_asli: harga_asli ? parseInt(harga_asli, 10) : null,
      deskripsi: String(deskripsi || '').trim(),
      foto_url: String(foto_url || '').trim(),
      lokasi: String(lokasi || (profile && profile.kampus) || 'KampusLoop').trim(),
      status: initialStatus,
    };
    const codStr = String(cod_lokasi || '').trim();

    let { data: newProduct, error } = await supabase
      .from('products')
      .insert({ ...baseInsert, cod_lokasi: codStr, stok: initialStok })
      .select()
      .single();

    if (error && v4Store.isMissingColumnError(error)) {
      const retry = await supabase.from('products').insert(baseInsert).select().single();
      newProduct = retry.data;
      error = retry.error;
      if (!error && newProduct) {
        if (codStr) v4Store.setProductCod(newProduct.id, codStr);
        v4Store.setProductStok(newProduct.id, initialStok);
      }
    } else if (!error && newProduct) {
      v4Store.setProductStok(newProduct.id, initialStok);
    }

    if (error) {
      console.error('Admin create product error:', error);
      return res.status(400).json({ error: 'Gagal menambahkan produk.' });
    }

    const formatted = await formatProduct(newProduct, userId);
    res.status(201).json(formatted);
  } catch (err) {
    console.error('Admin create product error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT & POST /api/admin/produk/:id/update/ — Admin Web edits any product detail (stok, foto, harga, dll)
async function adminUpdateProduct(req, res) {
  try {
    const { id } = req.params;
    const { nama, kategori, kondisi, harga, harga_asli, deskripsi, foto_url, lokasi, cod_lokasi, status, stok, quantity } = req.body;

    const { data: existing, error: findErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (findErr || !existing) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    const updates = { tanggal_diperbarui: new Date().toISOString() };
    if (nama !== undefined) updates.nama = String(nama).trim();
    if (kategori !== undefined) updates.kategori = kategori;
    if (kondisi !== undefined) updates.kondisi = kondisi;
    if (harga !== undefined && harga !== '') updates.harga = parseInt(harga, 10);
    if (harga_asli !== undefined) updates.harga_asli = harga_asli === '' || harga_asli === null ? null : parseInt(harga_asli, 10);
    if (deskripsi !== undefined) updates.deskripsi = String(deskripsi).trim();
    if (foto_url !== undefined) updates.foto_url = String(foto_url).trim();
    if (lokasi !== undefined) updates.lokasi = String(lokasi).trim();
    if (cod_lokasi !== undefined) updates.cod_lokasi = String(cod_lokasi).trim();

    // Stok / Quantity update logic
    const nextStokVal = stok !== undefined ? parseInt(stok, 10) : (quantity !== undefined ? parseInt(quantity, 10) : undefined);
    if (nextStokVal !== undefined) {
      const parsedStok = Math.max(0, nextStokVal);
      updates.stok = parsedStok;
      v4Store.setProductStok(id, parsedStok);

      // Otomatis ubah status: jika stok 0 -> keterangan sold/habis
      // Jika stok ditambah kembali (>0) dan sebelumnya sold -> otomatis approved/tersedia lagi!
      if (parsedStok <= 0 && status === undefined) {
        updates.status = 'sold';
      } else if (parsedStok > 0 && existing.status === 'sold' && status === undefined) {
        updates.status = 'approved';
      }
    }

    if (status !== undefined) {
      updates.status = status;
      // If manually set to sold and stok was not provided, set stok to 0
      if (status === 'sold' && nextStokVal === undefined) {
        v4Store.setProductStok(id, 0);
      }
    }

    let { data: updated, error: upErr } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (upErr && v4Store.isMissingColumnError(upErr)) {
      const { cod_lokasi: codVal, stok: stokVal, ...baseUpdates } = updates;
      const retry = await supabase.from('products').update(baseUpdates).eq('id', id).select().single();
      updated = retry.data;
      upErr = retry.error;
      if (!upErr && codVal !== undefined) {
        v4Store.setProductCod(id, codVal);
      }
      if (stokVal !== undefined) {
        v4Store.setProductStok(id, stokVal);
      }
    }

    if (upErr) {
      console.error('Admin update product error:', upErr);
      return res.status(400).json({ error: 'Gagal memperbarui produk.' });
    }

    const formatted = await formatProduct(updated || { ...existing, ...updates }, req.session.userId);
    res.json({ message: `Produk "${formatted.nama}" berhasil diperbarui.`, product: formatted });
  } catch (err) {
    console.error('Admin update product error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

router.put('/produk/:id/update/', isAdmin, adminUpdateProduct);
router.post('/produk/:id/update/', isAdmin, adminUpdateProduct);

// POST /api/admin/produk/:id/approve/
router.post('/produk/:id/approve/', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: produk, error } = await supabase
      .from('products')
      .select('nama')
      .eq('id', id)
      .single();

    if (error || !produk) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    await supabase.from('products').update({ status: 'approved' }).eq('id', id);
    res.json({ message: `Produk "${produk.nama}" disetujui.` });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/admin/produk/:id/reject/
router.post('/produk/:id/reject/', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: produk, error } = await supabase
      .from('products')
      .select('nama')
      .eq('id', id)
      .single();

    if (error || !produk) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    await supabase.from('products').update({ status: 'rejected' }).eq('id', id);
    res.json({ message: `Produk "${produk.nama}" ditolak.` });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/admin/produk/:id/delete/
router.delete('/produk/:id/delete/', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: produk, error } = await supabase
      .from('products')
      .select('nama')
      .eq('id', id)
      .single();

    if (error || !produk) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    await supabase.from('products').delete().eq('id', id);
    res.json({ message: `Produk "${produk.nama}" berhasil dihapus.` });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/admin/users/
router.get('/users/', isAdmin, async (req, res) => {
  try {
    const [{ data: users, error }, { data: profiles }, { data: allProducts }] = await Promise.all([
      supabase.from('users').select('*').order('date_joined', { ascending: false }),
      supabase.from('user_profiles').select('*'),
      supabase.from('products').select('id, seller_id'),
    ]);

    if (error) {
      console.error('Admin users error:', error);
      return res.status(500).json({ error: 'Server error.' });
    }

    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.user_id] = p; });

    const prodCountMap = {};
    (allProducts || []).forEach(p => {
      if (p.seller_id) prodCountMap[p.seller_id] = (prodCountMap[p.seller_id] || 0) + 1;
    });

    const result = (users || []).map(u => {
      const profile = profileMap[u.id] || null;
      return {
        ...buildUserProfileData(u, profile),
        date_joined: u.date_joined,
        produk_count: prodCountMap[u.id] || 0,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST & PUT /api/admin/users/:id/role/ — Admin Web manages user roles directly (user, seller, admin)
async function updateUserRole(req, res) {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (!['user', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role harus salah satu dari: user, seller, admin.' });
    }

    const { data: targetUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetId)
      .single();

    if (error || !targetUser) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    if (targetUser.is_superuser && role !== 'admin') {
      return res.status(400).json({ error: 'Role Super Admin utama tidak dapat diturunkan.' });
    }

    const isStaff = role === 'admin';
    await supabase.from('users').update({ is_staff: isStaff }).eq('id', targetId);

    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', targetId)
      .single();

    const profileUpdates = {
      role,
      is_verified: role === 'seller' || role === 'admin',
    };
    if (role === 'seller') {
      profileUpdates.pengajuan_penjual = true;
      profileUpdates.status_pengajuan_penjual = 'approved';
    } else if (role === 'admin') {
      profileUpdates.pengajuan_admin = true;
      profileUpdates.status_pengajuan_admin = 'approved';
    }

    if (existingProfile) {
      await supabase.from('user_profiles').update(profileUpdates).eq('user_id', targetId);
    } else {
      await supabase.from('user_profiles').insert({ user_id: targetId, ...profileUpdates });
    }

    const roleLabel = role === 'admin' ? 'Admin Web' : role === 'seller' ? 'Penjual' : 'User';
    res.json({
      message: `Role ${targetUser.first_name || targetUser.username} berhasil diubah menjadi ${roleLabel}.`,
    });
  } catch (err) {
    console.error('Update user role error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

router.post('/users/:id/role/', isAdmin, updateUserRole);
router.put('/users/:id/role/', isAdmin, updateUserRole);

// POST /api/admin/users/:id/approve-seller/ — validate & approve seller application
router.post('/users/:id/approve-seller/', isAdmin, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const catatan = (req.body.catatan || 'Berkas mahasiswa & surat perjanjian telah divalidasi.').trim();

    const { data: targetUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetId)
      .single();

    if (error || !targetUser) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', targetId)
      .single();

    const updates = {
      role: targetUser.is_staff || targetUser.is_superuser ? 'admin' : 'seller',
      is_verified: true,
      pengajuan_penjual: true,
      status_pengajuan_penjual: 'approved',
      catatan_admin_penjual: catatan,
    };

    if (profile) {
      await supabase.from('user_profiles').update(updates).eq('user_id', targetId);
    } else {
      await supabase.from('user_profiles').insert({ user_id: targetId, ...updates });
    }

    res.json({
      message: `${targetUser.first_name || targetUser.username} berhasil disetujui sebagai Penjual Terverifikasi.`,
    });
  } catch (err) {
    console.error('Approve seller error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/admin/users/:id/reject-seller/ — reject seller application with reason
router.post('/users/:id/reject-seller/', isAdmin, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const catatan = (req.body.catatan || 'Berkas belum lengkap atau surat perjanjian belum sesuai.').trim();

    const { data: targetUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetId)
      .single();

    if (error || !targetUser) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    await supabase
      .from('user_profiles')
      .update({
        status_pengajuan_penjual: 'rejected',
        catatan_admin_penjual: catatan,
      })
      .eq('user_id', targetId);

    res.json({
      message: `Pengajuan penjual untuk ${targetUser.first_name || targetUser.username} ditolak.`,
    });
  } catch (err) {
    console.error('Reject seller error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/admin/users/:id/make-admin/
router.post('/users/:id/make-admin/', isAdmin, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { data: targetUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetId)
      .single();

    if (error || !targetUser) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    await supabase.from('users').update({ is_staff: true }).eq('id', targetId);

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', targetId)
      .single();

    if (profile) {
      await supabase.from('user_profiles').update({
        role: 'admin',
        is_verified: true,
        pengajuan_admin: true,
        status_pengajuan_admin: 'approved',
      }).eq('user_id', targetId);
    } else {
      await supabase.from('user_profiles').insert({
        user_id: targetId,
        role: 'admin',
        is_verified: true,
        pengajuan_admin: true,
        status_pengajuan_admin: 'approved',
      });
    }

    res.json({
      message: `Pengguna ${targetUser.first_name || targetUser.username} berhasil diangkat sebagai Admin Web.`,
    });
  } catch (err) {
    console.error('Make admin error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/admin/users/:id/reject-admin/
router.post('/users/:id/reject-admin/', isAdmin, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { data: targetUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetId)
      .single();

    if (error || !targetUser) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    await supabase.from('user_profiles').update({
      status_pengajuan_admin: 'rejected',
    }).eq('user_id', targetId);

    res.json({
      message: `Pengajuan admin untuk ${targetUser.first_name || targetUser.username} telah ditolak.`,
    });
  } catch (err) {
    console.error('Reject admin error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/admin/users/:id/delete/
router.delete('/users/:id/delete/', isAdmin, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { data: targetUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetId)
      .eq('is_superuser', false)
      .single();

    if (error || !targetUser) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    await supabase.from('user_profiles').delete().eq('user_id', targetId);
    await supabase.from('users').delete().eq('id', targetId);

    res.json({ message: `Pengguna ${targetUser.first_name || ''} berhasil dihapus.` });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/admin/pesanan/
router.get('/pesanan/', isAdmin, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('tanggal_pesan', { ascending: false });

    if (error) {
      console.error('Admin orders error:', error);
      return res.status(500).json({ error: 'Server error.' });
    }

    const result = [];
    for (const order of (orders || [])) {
      let pembeli_nama = order.pembeli_nama || '';
      let seller_nama = order.seller_nama || '';
      let produk_nama = order.produk_nama || '';
      let produk_foto = order.produk_foto || '';

      if (order.pembeli_id) {
        const { data: buyer } = await supabase
          .from('users')
          .select('first_name, username')
          .eq('id', order.pembeli_id)
          .single();
        if (buyer) pembeli_nama = buyer.first_name || buyer.username;
      }

      if (order.produk_id) {
        const { data: produk } = await supabase
          .from('products')
          .select('*')
          .eq('id', order.produk_id)
          .single();
        if (produk) {
          produk_nama = produk.nama;
          produk_foto = produk.foto_url || '';
          if (produk.seller_nama) seller_nama = produk.seller_nama;
          if (produk.seller_id) {
            const { data: seller } = await supabase
              .from('users')
              .select('first_name, username')
              .eq('id', produk.seller_id)
              .single();
            if (seller) seller_nama = seller.first_name || seller.username;
          }
        }
      }

      const extras = v4Store.readStore().orderExtras[String(order.id)] || {};
      const subtotal = Number(order.subtotal_produk ?? extras.subtotal_produk ?? order.harga_bayar ?? 0);
      const serviceFee = Number(order.service_fee ?? extras.service_fee ?? Math.round(subtotal * 0.02));
      const shippingCost = Number(order.shipping_cost ?? extras.shipping_cost ?? Math.max(0, (order.harga_bayar || 0) - subtotal - serviceFee));
      const totalAmount = Number(order.harga_bayar || (subtotal + serviceFee + shippingCost));

      let paymentStatus = order.payment_status || extras.payment_status;
      if (!paymentStatus) {
        if (order.status === 'completed') paymentStatus = 'paid';
        else paymentStatus = 'unpaid';
      }

      let shippingStatus = order.shipping_status || extras.shipping_status;
      if (!shippingStatus) {
        if (order.status === 'completed') shippingStatus = 'delivered';
        else if (order.status === 'cancelled') shippingStatus = 'cancelled';
        else if (order.status === 'confirmed' || order.status === 'cod_waiting') shippingStatus = 'processing';
        else shippingStatus = 'pending';
      }

      const isCod = (order.delivery_type || extras.delivery_type) === 'cod';
      let codFeeStatus = order.cod_fee_status || extras.cod_fee_status;
      if (!codFeeStatus) {
        codFeeStatus = isCod ? (paymentStatus === 'paid' ? 'unpaid' : 'none') : 'none';
      }

      const history = Array.isArray(extras.history)
        ? extras.history
        : (Array.isArray(order.history) ? order.history : [
            {
              action: 'ORDER_CREATED',
              actor: 'buyer',
              notes: 'Pesanan dibuat',
              timestamp: order.tanggal_pesan || new Date().toISOString(),
            },
          ]);

      result.push({
        id: order.id,
        order_number: order.order_number,
        pembeli_nama,
        seller_nama,
        produk_nama,
        produk_foto,
        subtotal_produk: subtotal,
        service_fee: serviceFee,
        shipping_cost: shippingCost,
        harga_bayar: totalAmount,
        total_bayar: totalAmount,
        distance_km: Number(order.distance_km ?? extras.distance_km ?? 0),
        shipping_courier: order.shipping_courier || extras.shipping_courier || (isCod ? 'COD (Kampus)' : 'KampusLoop Express'),
        status: order.status,
        status_display: STATUS_DISPLAY[order.status] || order.status,
        payment_status: paymentStatus,
        payment_status_display: PAYMENT_STATUS_DISPLAY[paymentStatus] || paymentStatus,
        shipping_status: shippingStatus,
        shipping_status_display: SHIPPING_STATUS_DISPLAY[shippingStatus] || shippingStatus,
        cod_fee_status: codFeeStatus,
        cod_fee_amount: Number(order.cod_fee_amount ?? extras.cod_fee_amount ?? (isCod ? serviceFee : 0)),
        midtrans_transaction_id: order.midtrans_transaction_id || extras.midtrans_transaction_id || order.tripay_reference || extras.tripay_reference || '',
        midtrans_order_id: order.midtrans_order_id || extras.midtrans_order_id || order.order_number,
        midtrans_snap_token: order.midtrans_snap_token || extras.midtrans_snap_token || '',
        midtrans_redirect_url: order.midtrans_redirect_url || extras.midtrans_redirect_url || order.tripay_checkout_url || extras.tripay_checkout_url || '',
        midtrans_payment_type: order.midtrans_payment_type || extras.midtrans_payment_type || order.tripay_payment_method || extras.tripay_payment_method || order.payment_method || 'COD',
        midtrans_va_number: order.midtrans_va_number || extras.midtrans_va_number || order.tripay_pay_code || extras.tripay_pay_code || '',
        midtrans_qr_url: order.midtrans_qr_url || extras.midtrans_qr_url || order.tripay_qr_url || extras.tripay_qr_url || '',
        midtrans_qr_string: order.midtrans_qr_string || extras.midtrans_qr_string || order.tripay_qr_string || extras.tripay_qr_string || '',
        midtrans_expiry_time: order.midtrans_expiry_time || extras.midtrans_expiry_time || order.tripay_expired_time || extras.tripay_expired_time || null,
        midtrans_fee: Number(order.midtrans_fee ?? extras.midtrans_fee ?? order.tripay_fee ?? extras.tripay_fee ?? 0),
        tripay_reference: order.midtrans_transaction_id || extras.midtrans_transaction_id || order.tripay_reference || extras.tripay_reference || '',
        tripay_merchant_ref: order.midtrans_order_id || extras.midtrans_order_id || order.tripay_merchant_ref || extras.tripay_merchant_ref || order.order_number,
        tripay_payment_method: order.midtrans_payment_type || extras.midtrans_payment_type || order.tripay_payment_method || extras.tripay_payment_method || order.payment_method || 'COD',
        tripay_checkout_url: order.midtrans_redirect_url || extras.midtrans_redirect_url || order.tripay_checkout_url || extras.tripay_checkout_url || '',
        tripay_pay_code: order.midtrans_va_number || extras.midtrans_va_number || order.tripay_pay_code || extras.tripay_pay_code || '',
        tripay_qr_url: order.midtrans_qr_url || extras.midtrans_qr_url || order.tripay_qr_url || extras.tripay_qr_url || '',
        tripay_qr_string: order.midtrans_qr_string || extras.midtrans_qr_string || order.tripay_qr_string || extras.tripay_qr_string || '',
        tripay_expired_time: order.midtrans_expiry_time || extras.midtrans_expiry_time || order.tripay_expired_time || extras.tripay_expired_time || null,
        tripay_fee: Number(order.midtrans_fee ?? extras.midtrans_fee ?? order.tripay_fee ?? extras.tripay_fee ?? 0),
        delivery_type: order.delivery_type || extras.delivery_type || 'cod',
        payment_method: order.payment_method || extras.payment_method || 'COD',
        shipping_address: order.shipping_address || extras.shipping_address || '',
        kode_pos: order.kode_pos || extras.kode_pos || '',
        detail_alamat: order.detail_alamat || extras.detail_alamat || '',
        cod_location: order.cod_location || extras.cod_location || '',
        koordinat: order.koordinat || extras.koordinat || '',
        catatan: order.catatan || '',
        tanggal_pesan: order.tanggal_pesan,
        tanggal_selesai: order.tanggal_selesai,
        history,
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Admin orders error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT & POST /api/admin/pesanan/:id/status/ — update order status, payment status, shipping status, and COD fee status
async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, payment_status, shipping_status, cod_fee_status } = req.body;

    const updates = {};
    if (status) {
      if (!STATUS_DISPLAY[status]) {
        return res.status(400).json({ error: 'Status pesanan tidak valid.' });
      }
      updates.status = status;
      if (status === 'completed') {
        updates.tanggal_selesai = new Date().toISOString();
      }
    }
    if (payment_status) updates.payment_status = payment_status;
    if (shipping_status) updates.shipping_status = shipping_status;
    if (cod_fee_status) updates.cod_fee_status = cod_fee_status;

    // Log to order history
    v4Store.addOrderHistory(id, {
      action: 'ADMIN_UPDATE',
      actor: 'admin',
      notes: `Admin memperbarui status: ${Object.entries(updates).map(([k, v]) => `${k}=${v}`).join(', ')}`,
      timestamp: new Date().toISOString(),
    });

    // Save to fallback store
    v4Store.updateOrderExtras(id, updates);

    let updatedOrder = null;
    try {
      const { data: updated } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      updatedOrder = updated;
    } catch {
      // Fallback handled
    }

    if (!updatedOrder) {
      const { data: fallbackOrder } = await supabase.from('orders').select('*').eq('id', id).single();
      updatedOrder = fallbackOrder;
    }

    res.json({
      message: 'Status pesanan berhasil diperbarui.',
      order: {
        ...(updatedOrder || {}),
        ...updates,
        status_display: STATUS_DISPLAY[updates.status || updatedOrder?.status] || updates.status,
      },
    });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

router.put('/pesanan/:id/status/', isAdmin, updateOrderStatus);
router.post('/pesanan/:id/status/', isAdmin, updateOrderStatus);

// POST /api/admin/pesanan/:id/settle-cod-fee/ — Mark seller COD platform fee as settled
router.post('/pesanan/:id/settle-cod-fee/', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    v4Store.updateOrderExtras(id, { cod_fee_status: 'paid' });
    v4Store.addOrderHistory(id, {
      action: 'COD_FEE_SETTLED',
      actor: 'admin',
      notes: 'Tagihan biaya layanan COD telah lunas disetorkan ke platform.',
      timestamp: new Date().toISOString(),
    });

    try {
      await supabase.from('orders').update({ cod_fee_status: 'paid' }).eq('id', id);
    } catch {}

    res.json({ success: true, message: 'Tagihan Fee COD penjual berhasil ditandai LUNAS.' });
  } catch (err) {
    console.error('Settle COD fee error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST & PUT /api/admin/shipping-settings/ — Dedicated shipping rates update
router.post('/shipping-settings/', isAdmin, async (req, res) => {
  try {
    const { base_rate, rate_per_km, min_shipping_cost, courier_name, provider } = req.body;
    const newConfig = {
      base_rate: Number(base_rate || 5000),
      rate_per_km: Number(rate_per_km || 2000),
      min_shipping_cost: Number(min_shipping_cost || 8000),
      courier_name: String(courier_name || 'KampusLoop Express (Kurir Kampus)').trim(),
      provider: provider || 'distance_matrix',
      active: true,
    };

    v4Store.setShippingConfig(newConfig);

    try {
      await supabase.from('settings').update({ shipping_config: newConfig }).eq('id', 1);
    } catch {}

    res.json({ message: 'Tarif pengiriman berhasil diperbarui.', shipping_config: newConfig });
  } catch (err) {
    console.error('Save shipping settings error:', err);
    res.status(500).json({ error: 'Gagal menyimpan tarif pengiriman.' });
  }
});

// GET /api/admin/kontak/
router.get('/kontak/', isAdmin, async (req, res) => {
  try {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .order('tanggal', { ascending: false });

    if (error) {
      console.error('Admin contacts error:', error);
      return res.status(500).json({ error: 'Server error.' });
    }

    res.json((contacts || []).map(c => ({
      id: c.id,
      nama: c.nama,
      email: c.email,
      topik: c.topik,
      pesan: c.pesan,
      tanggal: c.tanggal,
    })));
  } catch (err) {
    console.error('Admin contacts error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/admin/agreement-template/
router.get('/agreement-template/', isAdmin, async (req, res) => {
  try {
    const template = await getAgreementTemplate();
    res.json(template);
  } catch (err) {
    console.error('Get agreement template error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST & PUT /api/admin/agreement-template/ — Admin Web configures Surat Perjanjian format
async function saveAgreementTemplate(req, res) {
  try {
    const { judul, isi, catatan, file_url } = req.body;
    const updates = {};
    if (judul !== undefined) updates.surat_perjanjian_judul = String(judul).trim();
    if (isi !== undefined) updates.surat_perjanjian_isi = String(isi);
    if (catatan !== undefined) updates.surat_perjanjian_catatan = String(catatan).trim();
    if (file_url !== undefined) updates.surat_perjanjian_file_url = String(file_url).trim();

    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('id', 1)
      .single();

    const performWrite = async (payload) => {
      if (!existing) {
        return supabase.from('settings').insert({
          id: 1,
          nama_toko: 'KampusLoop',
          tagline: 'Student Circular Marketplace',
          ...payload,
        });
      }
      return supabase.from('settings').update(payload).eq('id', 1);
    };

    let { error: saveErr } = await performWrite(updates);

    if (saveErr && v4Store.isMissingColumnError(saveErr)) {
      const { surat_perjanjian_file_url: fileUrlVal, ...baseUpdates } = updates;
      if (Object.keys(baseUpdates).length > 0) {
        const retry = await performWrite(baseUpdates);
        saveErr = retry.error;
      } else {
        saveErr = null;
      }
      if (!saveErr && fileUrlVal !== undefined) {
        v4Store.setAgreementFileUrl(fileUrlVal);
      }
    } else if (!saveErr && file_url !== undefined) {
      v4Store.setAgreementFileUrl(String(file_url).trim());
    }

    if (saveErr) {
      console.error('Save agreement template error:', saveErr);
      return res.status(400).json({ error: 'Gagal menyimpan format surat perjanjian.' });
    }

    const template = await getAgreementTemplate();
    res.json({ message: 'Format surat perjanjian berhasil disimpan.', template });
  } catch (err) {
    console.error('Save agreement template error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

router.post('/agreement-template/', isAdmin, saveAgreementTemplate);
router.put('/agreement-template/', isAdmin, saveAgreementTemplate);

// GET /api/admin/settings/
router.get('/settings/', isAdmin, async (req, res) => {
  try {
    const settings = await getSiteSettings();
    res.json(settings);
  } catch (err) {
    console.error('Admin settings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST & PUT /api/admin/settings/
async function saveAdminSettings(req, res) {
  try {
    const data = req.body;
    const updates = {};

    const fields = [
      ...Object.keys(DEFAULT_SITE_SETTINGS),
      'surat_perjanjian_judul',
      'surat_perjanjian_isi',
      'surat_perjanjian_catatan',
    ];
    fields.forEach(f => {
      if (f in data && data[f] !== undefined) {
        if (f === 'payment_config') {
          updates.payment_config = normalizePaymentConfig(data.payment_config, DEFAULT_PAYMENT_CONFIG);
        } else {
          updates[f] = data[f];
        }
      }
    });

    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('id', 1)
      .single();

    const performWrite = async (payload) => {
      if (!existing) {
        return supabase.from('settings').insert({
          id: 1,
          ...payload,
        });
      }
      return supabase.from('settings').update(payload).eq('id', 1);
    };

    let { error: saveErr } = await performWrite(updates);

    if (saveErr && v4Store.isMissingColumnError(saveErr)) {
      const {
        payment_config: paymentCfgVal,
        surat_perjanjian_file_url: fileUrlVal,
        ...baseUpdates
      } = updates;
      if (Object.keys(baseUpdates).length > 0) {
        const retry = await performWrite(baseUpdates);
        saveErr = retry.error;
      } else {
        saveErr = null;
      }
      if (!saveErr) {
        if (paymentCfgVal !== undefined) v4Store.setSitePaymentConfig(paymentCfgVal);
        if (fileUrlVal !== undefined) v4Store.setAgreementFileUrl(fileUrlVal);
      }
    } else if (!saveErr) {
      if (updates.payment_config !== undefined) v4Store.setSitePaymentConfig(null);
      if (updates.surat_perjanjian_file_url !== undefined) v4Store.setAgreementFileUrl(null);
    }

    if (saveErr) {
      console.error('Admin settings save error:', saveErr);
      return res.status(400).json({
        error: saveErr.message || 'Gagal menyimpan pengaturan web. Pastikan kolom tabel settings sudah diperbarui di Supabase.',
      });
    }

    // Apply COD locations to Admin-owned products when requested
    if (data.apply_cod_to_admin_products && updates.payment_config?.cod_locations !== undefined) {
      const adminCod = String(updates.payment_config.cod_locations || '').trim();
      const { data: adminProducts } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', req.session.userId);
      const ids = (adminProducts || []).map(p => p.id);
      if (ids.length > 0) {
        const { error: prodErr } = await supabase
          .from('products')
          .update({ cod_lokasi: adminCod })
          .eq('seller_id', req.session.userId);
        if (prodErr && v4Store.isMissingColumnError(prodErr)) {
          ids.forEach(pid => v4Store.setProductCod(pid, adminCod));
        }
      }
    }

    const latest = await getSiteSettings();
    res.json({ message: 'Pengaturan web berhasil disimpan ke database.', settings: latest });
  } catch (err) {
    console.error('Admin settings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

router.post('/settings/', isAdmin, saveAdminSettings);
router.put('/settings/', isAdmin, saveAdminSettings);

// ─── ARTICLES CRUD (ADMIN WEB ONLY) ───────────────────────────────────────────

function slugifyTitle(text) {
  return String(text || 'artikel')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'artikel';
}

// GET /api/admin/artikel/ — list all articles (published + draft)
router.get('/artikel/', isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('tanggal_dibuat', { ascending: false });

    if (error) {
      console.error('Admin articles list error:', error);
      return res.json([]);
    }

    res.json(data || []);
  } catch (err) {
    console.error('Admin articles list error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/admin/artikel/create/ — create article
router.post('/artikel/create/', isAdmin, async (req, res) => {
  try {
    const { judul, kategori, ringkasan, konten, gambar_url, status } = req.body;
    if (!judul || !konten) {
      return res.status(400).json({ error: 'Judul dan isi artikel wajib diisi.' });
    }

    const baseSlug = slugifyTitle(judul);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
    const authorNama = req.currentUser?.first_name || req.currentUser?.username || 'Admin Web';

    const { data: created, error } = await supabase
      .from('articles')
      .insert({
        author_id: req.session.userId,
        author_nama: authorNama,
        judul: String(judul).trim(),
        slug: uniqueSlug,
        kategori: (kategori || 'Berita ModuLab').trim(),
        ringkasan: String(ringkasan || '').trim() || String(konten).trim().slice(0, 180) + '...',
        konten: String(konten).trim(),
        gambar_url: String(gambar_url || '').trim(),
        status: status === 'draft' ? 'draft' : 'published',
      })
      .select()
      .single();

    if (error) {
      console.error('Admin create article error:', error);
      return res.status(400).json({
        error: error.message || 'Gagal membuat artikel. Pastikan tabel articles sudah dibuat di Supabase.',
      });
    }

    res.status(201).json({ message: 'Artikel berhasil diterbitkan!', article: created });
  } catch (err) {
    console.error('Admin create article error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT & POST /api/admin/artikel/:id/update/ — update article
async function adminUpdateArticle(req, res) {
  try {
    const { id } = req.params;
    const { judul, kategori, ringkasan, konten, gambar_url, status } = req.body;

    const { data: existing, error: findErr } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (findErr || !existing) {
      return res.status(404).json({ error: 'Artikel tidak ditemukan.' });
    }

    const updates = { tanggal_diperbarui: new Date().toISOString() };
    if (judul !== undefined) updates.judul = String(judul).trim();
    if (kategori !== undefined) updates.kategori = String(kategori).trim();
    if (ringkasan !== undefined) updates.ringkasan = String(ringkasan).trim();
    if (konten !== undefined) updates.konten = String(konten).trim();
    if (gambar_url !== undefined) updates.gambar_url = String(gambar_url).trim();
    if (status !== undefined) updates.status = status === 'draft' ? 'draft' : 'published';

    const { data: updated, error: upErr } = await supabase
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (upErr) {
      console.error('Admin update article error:', upErr);
      return res.status(400).json({ error: 'Gagal memperbarui artikel.' });
    }

    res.json({ message: 'Artikel berhasil diperbarui!', article: updated });
  } catch (err) {
    console.error('Admin update article error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

router.put('/artikel/:id/update/', isAdmin, adminUpdateArticle);
router.post('/artikel/:id/update/', isAdmin, adminUpdateArticle);

// DELETE /api/admin/artikel/:id/delete/ — delete article
router.delete('/artikel/:id/delete/', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: existing, error: findErr } = await supabase
      .from('articles')
      .select('id, judul')
      .eq('id', id)
      .single();

    if (findErr || !existing) {
      return res.status(404).json({ error: 'Artikel tidak ditemukan.' });
    }

    await supabase.from('articles').delete().eq('id', id);
    res.json({ message: `Artikel "${existing.judul}" berhasil dihapus.` });
  } catch (err) {
    console.error('Admin delete article error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
