const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const supabase = require('./supabaseClient');
const { getSiteSettings } = require('./utils/helpers');
const createStatelessSession = require('./utils/statelessSession');

const app = express();
const PORT = process.env.PORT || 8000;

app.set('trust proxy', 1);

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// CORS (localhost for dev, Vercel/production URLs, and same-host requests)
const STATIC_ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

app.use(cors((req, callback) => {
  const origin = req.header('Origin');
  if (!origin) {
    return callback(null, { origin: false });
  }

  const allowed = new Set(STATIC_ALLOWED_ORIGINS);
  if (process.env.FRONTEND_URL) allowed.add(process.env.FRONTEND_URL.replace(/\/$/, ''));
  if (process.env.VERCEL_URL) allowed.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    allowed.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }

  let isSameHost = false;
  try {
    isSameHost = Boolean(req.headers.host && new URL(origin).host === req.headers.host);
  } catch {
    isSameHost = false;
  }

  callback(null, {
    origin: allowed.has(origin) || isSameHost,
    credentials: true,
  });
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Stateless encrypted cookie session (compatible with serverless & local dev)
app.use(createStatelessSession());

// Local uploaded files static fallback
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/produk', require('./routes/produk'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/pesanan', require('./routes/pesanan'));
app.use('/api/kontak', require('./routes/kontak'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/artikel', require('./routes/artikel'));

// Public web settings (contact, footer, social media, privacy policy, terms)
app.get('/api/settings/public/', async (req, res) => {
  try {
    const settings = await getSiteSettings();
    res.json(settings);
  } catch (err) {
    console.error('Public settings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Public live stats for Home/About synchronization
app.get('/api/stats/public/', async (req, res) => {
  try {
    const [{ data: users }, { data: products }, { data: orders }] = await Promise.all([
      supabase.from('users').select('id'),
      supabase.from('products').select('id, kategori, status, harga, harga_asli'),
      supabase.from('orders').select('id, status, harga_bayar'),
    ]);

    const prodList = products || [];
    const orderList = orders || [];
    const approvedProducts = prodList.filter(p => p.status === 'approved');
    const soldProducts = prodList.filter(p => p.status === 'sold');
    const completedOrders = orderList.filter(o => o.status === 'completed');
    const validOrders = orderList.filter(o => o.status !== 'cancelled');
    const totalGmv = validOrders.reduce((sum, o) => sum + (o.harga_bayar || 0), 0);

    const categoryCounts = {};
    approvedProducts.forEach(p => {
      categoryCounts[p.kategori] = (categoryCounts[p.kategori] || 0) + 1;
    });

    res.json({
      total_users: (users || []).length,
      active_products: approvedProducts.length,
      sold_products: soldProducts.length,
      reuse_count: soldProducts.length + completedOrders.length,
      completed_orders: completedOrders.length,
      total_orders: validOrders.length,
      total_gmv: totalGmv,
      category_counts: categoryCounts,
    });
  } catch (err) {
    console.error('Public stats error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'KampusLoop API is running' });
});

if (!process.env.VERCEL && require.main === module) {
  app.listen(PORT, () => {
    console.log(`KampusLoop backend running on port ${PORT}`);
  });
}

module.exports = app;
