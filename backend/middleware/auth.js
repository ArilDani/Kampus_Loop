const supabase = require('../supabaseClient');
const { checkAdmin } = require('../utils/helpers');

function isAuthenticated(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Anda harus login terlebih dahulu.' });
  }
  next();
}

async function isAdmin(req, res, next) {
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

    if (!checkAdmin(user, profile)) {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }

    req.currentUser = user;
    req.currentProfile = profile;
    next();
  } catch (err) {
    console.error('Admin check error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
}

module.exports = { isAuthenticated, isAdmin };
