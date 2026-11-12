const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { isAuthenticated } = require('../middleware/auth');
const v4Store = require('../utils/v4Store');
const { checkAdmin } = require('../utils/helpers');

const STATUS_DISPLAY = {
  pending: 'Menunggu Konfirmasi',
  confirmed: 'Dikonfirmasi',
  cod_waiting: 'Menunggu COD',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

// GET /api/pesanan/ — user's orders
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('pembeli_id', userId)
      .order('tanggal_pesan', { ascending: false });

    if (error) {
      console.error('Orders error:', error);
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
      result.push({
        id: order.id,
        order_number: order.order_number,
        pembeli_nama,
        seller_nama,
        produk_nama,
        produk_foto,
        status_display: STATUS_DISPLAY[order.status] || order.status,
        harga_bayar: order.harga_bayar,
        status: order.status,
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
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Orders error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/pesanan/create/ — create order (user/seller only, non-admin; marks product as sold)
router.post('/create/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;

    const [{ data: user }, { data: profile }] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    ]);

    if (checkAdmin(user, profile)) {
      return res.status(403).json({
        error: 'Hanya akun user/penjual (bukan admin web) yang dapat memesan produk.',
      });
    }

    const {
      produk_id,
      catatan,
      delivery_type,
      payment_method,
      shipping_address,
      kode_pos,
      detail_alamat,
      cod_location,
      koordinat,
    } = req.body;

    const { data: produk, error: pErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', produk_id)
      .eq('status', 'approved')
      .single();

    if (pErr || !produk) {
      return res.status(404).json({ error: 'Produk tidak ditemukan atau sudah terjual.' });
    }

    if (produk.seller_id === userId) {
      return res.status(400).json({ error: 'Kamu tidak bisa membeli produk milikmu sendiri.' });
    }

    let seller_nama = produk.seller_nama || '';
    if (produk.seller_id) {
      const { data: seller } = await supabase
        .from('users')
        .select('first_name, username')
        .eq('id', produk.seller_id)
        .single();
      if (seller) seller_nama = seller.first_name || seller.username;
    }

    const orderNumber = 'KL-' + String(Math.floor(1000 + Math.random() * 9000));
    const chosenDelivery = delivery_type === 'delivery' ? 'delivery' : 'cod';
    const chosenPayment = payment_method || 'COD';
    const orderExtrasPayload = {
      delivery_type: chosenDelivery,
      payment_method: chosenPayment,
      shipping_address: String(shipping_address || '').trim(),
      kode_pos: String(kode_pos || '').trim(),
      detail_alamat: String(detail_alamat || '').trim(),
      cod_location: String(cod_location || '').trim(),
      koordinat: String(koordinat || '').trim(),
    };
    const baseInsert = {
      order_number: orderNumber,
      pembeli_id: userId,
      pembeli_nama: user.first_name || user.username,
      seller_nama,
      produk_id: produk.id,
      produk_nama: produk.nama,
      produk_foto: produk.foto_url || '',
      harga_bayar: produk.harga,
      status: chosenDelivery === 'cod' ? 'cod_waiting' : 'confirmed',
      catatan: catatan || '',
    };

    let { data: newOrder, error: oErr } = await supabase
      .from('orders')
      .insert({ ...baseInsert, ...orderExtrasPayload })
      .select()
      .single();

    if (oErr && v4Store.isMissingColumnError(oErr)) {
      const retry = await supabase.from('orders').insert(baseInsert).select().single();
      newOrder = retry.data;
      oErr = retry.error;
      if (!oErr && newOrder) {
        v4Store.setOrderExtras(newOrder.id, orderExtrasPayload);
      }
    }

    if (oErr) {
      console.error('Create order error:', oErr);
      return res.status(400).json({ error: 'Gagal membuat pesanan.' });
    }

    await supabase
      .from('products')
      .update({ status: 'sold' })
      .eq('id', produk.id);

    res.status(201).json({
      id: newOrder.id,
      order_number: newOrder.order_number,
      pembeli_nama: user.first_name || user.username,
      seller_nama,
      produk_nama: produk.nama,
      produk_foto: produk.foto_url || '',
      status_display: STATUS_DISPLAY[newOrder.status] || newOrder.status,
      harga_bayar: newOrder.harga_bayar,
      status: newOrder.status,
      delivery_type: newOrder.delivery_type || orderExtrasPayload.delivery_type,
      payment_method: newOrder.payment_method || orderExtrasPayload.payment_method,
      shipping_address: newOrder.shipping_address || orderExtrasPayload.shipping_address,
      kode_pos: newOrder.kode_pos || orderExtrasPayload.kode_pos,
      detail_alamat: newOrder.detail_alamat || orderExtrasPayload.detail_alamat,
      cod_location: newOrder.cod_location || orderExtrasPayload.cod_location,
      koordinat: newOrder.koordinat || orderExtrasPayload.koordinat,
      catatan: newOrder.catatan || '',
      tanggal_pesan: newOrder.tanggal_pesan,
      tanggal_selesai: newOrder.tanggal_selesai,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
