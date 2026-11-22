const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { isAuthenticated } = require('../middleware/auth');

// GET /api/wishlist/ — user's wishlist
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const { data: wishlists, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)
      .order('tanggal_ditambah', { ascending: false });

    if (error) {
      console.error('Wishlist error:', error);
      return res.status(500).json({ error: 'Server error.' });
    }

    const wlList = wishlists || [];
    if (wlList.length === 0) {
      return res.json([]);
    }

    // Bulk query products to eliminate N+1 latency
    const productIds = [...new Set(wlList.map(w => w.produk_id).filter(Boolean))];
    const { data: products } = productIds.length > 0
      ? await supabase.from('products').select('*').in('id', productIds)
      : { data: [] };

    const productMap = {};
    (products || []).forEach(p => { productMap[p.id] = p; });

    const result = wlList.map(wl => {
      const produk = productMap[wl.produk_id];
      return {
        id: wl.id,
        produk_nama: produk ? produk.nama : '',
        produk_foto: produk ? (produk.foto_url || '') : '',
        produk_kategori: produk ? produk.kategori : '',
        produk_kondisi: produk ? produk.kondisi : '',
        produk_harga: produk ? produk.harga : 0,
        tanggal_ditambah: wl.tanggal_ditambah,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Wishlist error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/wishlist/toggle/:produk_id/ — toggle wishlist
router.post('/toggle/:produk_id/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { produk_id } = req.params;

    // Check product exists
    const { data: produk, error: pErr } = await supabase
      .from('products')
      .select('id')
      .eq('id', produk_id)
      .single();

    if (pErr || !produk) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    // Check if already wishlisted
    const { data: existing } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('produk_id', produk_id)
      .single();

    if (existing) {
      await supabase.from('wishlist').delete().eq('id', existing.id);
      return res.json({ wishlisted: false, message: 'Produk dihapus dari wishlist.' });
    }

    await supabase.from('wishlist').insert({
      user_id: userId,
      produk_id: produk_id,
    });

    res.json({ wishlisted: true, message: 'Produk ditambahkan ke wishlist.' });
  } catch (err) {
    console.error('Wishlist toggle error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
