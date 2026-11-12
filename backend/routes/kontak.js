const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// POST /api/kontak/ — submit contact message
router.post('/', async (req, res) => {
  try {
    const { nama, email, topik, pesan } = req.body;

    if (!nama || !email || !topik || !pesan) {
      return res.status(400).json({ error: 'Semua field wajib diisi.' });
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert({ nama, email, topik, pesan })
      .select()
      .single();

    if (error) {
      console.error('Contact error:', error);
      return res.status(400).json({ error: 'Gagal mengirim pesan.' });
    }

    res.status(201).json({ message: 'Pesan berhasil dikirim! Kami akan menghubungi kamu segera.' });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
