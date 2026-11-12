const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// GET /api/artikel/ — public list of published articles
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    const kategori = (req.query.kategori || '').trim();
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;

    let query = supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('tanggal_dibuat', { ascending: false });

    if (kategori && kategori !== 'Semua') {
      query = query.eq('kategori', kategori);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Public articles list error:', error);
      return res.json([]);
    }

    let list = data || [];
    if (q) {
      list = list.filter(a =>
        (a.judul && a.judul.toLowerCase().includes(q)) ||
        (a.ringkasan && a.ringkasan.toLowerCase().includes(q)) ||
        (a.konten && a.konten.toLowerCase().includes(q)) ||
        (a.kategori && a.kategori.toLowerCase().includes(q))
      );
    }

    if (limit && limit > 0) {
      list = list.slice(0, limit);
    }

    res.json(list);
  } catch (err) {
    console.error('Public articles error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/artikel/:idOrSlug/ — get single published article & increment views
router.get('/:idOrSlug/', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let query = supabase
      .from('articles')
      .select('*')
      .eq('status', 'published');

    query = isUuid ? query.eq('id', idOrSlug) : query.eq('slug', idOrSlug);

    const { data: article, error } = await query.single();
    if (error || !article) {
      return res.status(404).json({ error: 'Artikel tidak ditemukan.' });
    }

    const nextViews = (article.dilihat || 0) + 1;
    await supabase
      .from('articles')
      .update({ dilihat: nextViews })
      .eq('id', article.id);

    res.json({ ...article, dilihat: nextViews });
  } catch (err) {
    console.error('Public article detail error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;

