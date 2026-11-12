const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../supabaseClient');
const { buildUserProfileData } = require('../utils/helpers');

// POST /api/auth/login/
router.post('/login/', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    req.session.userId = user.id;
    req.session.save(() => {
      res.json({
        message: `Selamat datang, ${user.first_name}!`,
        user: buildUserProfileData(user, profile),
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/auth/register/
router.post('/register/', async (req, res) => {
  try {
    const { nama, email, password, kampus } = req.body;

    if (!nama || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter.' });
    }

    const emailLower = email.trim().toLowerCase();

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', emailLower)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Email ini sudah terdaftar.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data: newUser, error: userErr } = await supabase
      .from('users')
      .insert({
        email: emailLower,
        username: emailLower,
        password_hash,
        first_name: nama.trim(),
        last_name: 'Pengguna',
      })
      .select()
      .single();

    if (userErr) {
      console.error('Register user error:', userErr);
      return res.status(400).json({ error: 'Gagal membuat akun.' });
    }

    const { data: profile, error: profErr } = await supabase
      .from('user_profiles')
      .insert({
        user_id: newUser.id,
        kampus: (kampus || '').trim(),
        telp: '',
        alamat: '',
        role: 'user',
      })
      .select()
      .single();

    if (profErr) {
      console.error('Register profile error:', profErr);
    }

    req.session.userId = newUser.id;
    req.session.save(() => {
      res.status(201).json({
        message: 'Akun berhasil dibuat!',
        user: buildUserProfileData(newUser, profile),
      });
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/auth/logout/
router.post('/logout/', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Berhasil logout.' });
  });
});

// GET /api/auth/me/
router.get('/me/', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Anda harus login terlebih dahulu.' });
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.session.userId)
      .single();

    if (!user) {
      return res.status(401).json({ error: 'User tidak ditemukan.' });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    res.json(buildUserProfileData(user, profile));
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
