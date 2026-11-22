const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { isAuthenticated } = require('../middleware/auth');
const v4Store = require('../utils/v4Store');
const { checkAdmin, getUserRole, formatProducts, formatProduct } = require('../utils/helpers');

// GET /api/produk/ — list approved products with filters
router.get('/', async (req, res) => {
  try {
    const { q, kategori, kondisi, harga, sort } = req.query;
    const userId = req.session ? req.session.userId : null;

    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'approved');

    if (kategori) {
      query = query.eq('kategori', kategori);
    }

    if (kondisi) {
      const kondisiArr = Array.isArray(kondisi) ? kondisi : [kondisi];
      query = query.in('kondisi', kondisiArr);
    }

    if (harga === 'under100') {
      query = query.lt('harga', 100000);
    } else if (harga === '100to500') {
      query = query.gte('harga', 100000).lte('harga', 500000);
    } else if (harga === 'over500') {
      query = query.gt('harga', 500000);
    }

    if (sort === 'low') {
      query = query.order('harga', { ascending: true });
    } else if (sort === 'high') {
      query = query.order('harga', { ascending: false });
    } else {
      query = query.order('tanggal_dibuat', { ascending: false });
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Products list error:', error);
      return res.status(500).json({ error: 'Server error.' });
    }

    let filtered = products || [];
    if (q) {
      const qLower = q.toLowerCase();
      filtered = filtered.filter(p =>
        (p.nama && p.nama.toLowerCase().includes(qLower)) ||
        (p.deskripsi && p.deskripsi.toLowerCase().includes(qLower)) ||
        (p.kategori && p.kategori.toLowerCase().includes(qLower))
      );
    }

    const result = await formatProducts(filtered, userId);
    res.json(result);
  } catch (err) {
    console.error('Products error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/produk/featured/ — top 8 approved products by date
router.get('/featured/', async (req, res) => {
  try {
    const userId = req.session ? req.session.userId : null;

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'approved')
      .order('tanggal_dibuat', { ascending: false })
      .limit(8);

    if (error) {
      console.error('Featured error:', error);
      return res.status(500).json({ error: 'Server error.' });
    }

    const result = await formatProducts(products || [], userId);
    res.json(result);
  } catch (err) {
    console.error('Featured error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/produk/:id/ — product detail (increment dilihat)
router.get('/:id/', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session ? req.session.userId : null;

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    const nextDilihat = (product.dilihat || 0) + 1;
    await supabase
      .from('products')
      .update({ dilihat: nextDilihat })
      .eq('id', id);

    const result = await formatProduct({ ...product, dilihat: nextDilihat }, userId);
    res.json(result);
  } catch (err) {
    console.error('Product detail error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/produk/create/ — create product (admin web -> approved immediately; seller -> pending)
router.post('/create/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const [{ data: user }, { data: profile }] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    ]);

    const role = getUserRole(user, profile);
    if (role === 'user') {
      return res.status(403).json({
        error: 'Untuk menjual barang, ajukan verifikasi menjadi Penjual terlebih dahulu melalui menu Ajukan Penjual.',
      });
    }

    const { nama, kategori, kondisi, harga, harga_asli, deskripsi, foto_url, lokasi, cod_lokasi, stok } = req.body;
    if (!nama || !kategori || !harga) {
      return res.status(400).json({ error: 'Nama, kategori, dan harga produk wajib diisi.' });
    }

    const stokNum = stok !== undefined && stok !== '' ? Math.max(0, parseInt(stok, 10)) : 1;
    // Admin web products go live immediately without waiting for verification
    const initialStatus = role === 'admin' ? (stokNum === 0 ? 'sold' : 'approved') : 'pending';

    const baseInsert = {
      seller_id: userId,
      seller_nama: user.first_name || user.username,
      seller_email: user.email,
      seller_kampus: (profile && profile.kampus) || '',
      nama: nama.trim(),
      kategori,
      kondisi: kondisi || 'Good',
      harga: parseInt(harga, 10),
      harga_asli: harga_asli ? parseInt(harga_asli, 10) : null,
      deskripsi: (deskripsi || '').trim(),
      foto_url: (foto_url || '').trim(),
      lokasi: (lokasi || (profile && profile.kampus) || '').trim(),
      status: initialStatus,
      stok: stokNum,
    };
    const codStr = (
      cod_lokasi ||
      (profile && profile.payment_config && profile.payment_config.cod_locations) ||
      ''
    ).trim();

    let { data: newProduct, error } = await supabase
      .from('products')
      .insert({ ...baseInsert, cod_lokasi: codStr })
      .select()
      .single();

    if (error && v4Store.isMissingColumnError(error)) {
      const { stok: _s, cod_lokasi: _c, ...legacyInsert } = baseInsert;
      const retry = await supabase.from('products').insert(legacyInsert).select().single();
      newProduct = retry.data;
      error = retry.error;
      if (!error && newProduct) {
        if (codStr) v4Store.setProductCod(newProduct.id, codStr);
        v4Store.setProductStok(newProduct.id, stokNum);
      }
    }

    if (error) {
      console.error('Create product error:', error);
      return res.status(400).json({ error: 'Gagal membuat produk.' });
    }

    const result = await formatProduct(newProduct, userId);
    res.status(201).json(result);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT & POST /api/produk/:id/update/ — edit product (seller owner or admin)
async function updateProductHandler(req, res) {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    const [{ data: user }, { data: profile }] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    ]);

    const admin = checkAdmin(user, profile);

    let query = supabase.from('products').select('*').eq('id', id);
    if (!admin) {
      query = query.eq('seller_id', userId);
    }

    const { data: product, error } = await query.single();
    if (error || !product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    const { nama, kategori, kondisi, harga, harga_asli, deskripsi, foto_url, lokasi, cod_lokasi, status, stok } = req.body;
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

    let newStok = undefined;
    if (stok !== undefined && stok !== '') {
      newStok = Math.max(0, parseInt(stok, 10));
      updates.stok = newStok;
      if (newStok === 0 && !status) {
        updates.status = 'sold';
      } else if (newStok > 0 && product.status === 'sold' && !status) {
        updates.status = 'approved';
      }
    }

    if (admin && status !== undefined) updates.status = status;

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
      if (!upErr && newStok !== undefined) {
        v4Store.setProductStok(id, newStok);
      }
    } else if (!upErr) {
      if (cod_lokasi !== undefined) v4Store.setProductCod(id, null);
      if (newStok !== undefined) v4Store.setProductStok(id, newStok);
    }

    if (upErr) {
      console.error('Update product error:', upErr);
      return res.status(400).json({ error: 'Gagal memperbarui produk.' });
    }

    const formatted = await formatProduct(updated, userId);
    res.json({ message: 'Produk berhasil diperbarui.', product: formatted });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

router.put('/:id/update/', isAuthenticated, updateProductHandler);
router.post('/:id/update/', isAuthenticated, updateProductHandler);

// DELETE /api/produk/:id/delete/ — delete product (owner or admin)
router.delete('/:id/delete/', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    const [{ data: user }, { data: profile }] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    ]);

    const admin = checkAdmin(user, profile);

    let query = supabase.from('products').select('*').eq('id', id);
    if (!admin) {
      query = query.eq('seller_id', userId);
    }

    const { data: product, error } = await query.single();

    if (error || !product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    await supabase.from('products').delete().eq('id', id);
    res.json({ message: 'Produk berhasil dihapus.' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
