require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const supabase = require('./supabaseClient');
const { getSiteSettings } = require('./utils/helpers');
const FileSessionStore = require('./utils/fileSessionStore');

const app = express();
const PORT = process.env.PORT || 8000;

// CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session (persisted to disk so sessions survive server restarts)
app.use(session({
  store: new FileSessionStore(),
  secret: process.env.SESSION_SECRET || 'kampusloop-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
}));

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

app.listen(PORT, () => {
  console.log(`KampusLoop backend running on port ${PORT}`);
});
