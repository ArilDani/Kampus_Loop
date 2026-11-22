const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { isAuthenticated } = require('../middleware/auth');
const v4Store = require('../utils/v4Store');
const { checkAdmin } = require('../utils/helpers');
const {
  getShippingSettings,
  calculateCheckout,
} = require('../utils/shippingService');
const {
  createMidtransTransaction,
  verifyMidtransNotificationSignature,
} = require('../utils/midtrans');
const {
  createTripayTransaction,
  verifyWebhookSignature,
} = require('../utils/tripay');

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

/**
 * Helper to build consistent enriched order object
 */
function enrichOrderObject(order, buyer = null, seller = null, produk = null) {
  const store = v4Store.readStore();
  const extras = store.orderExtras[String(order.id)] || {};

  const subtotal = Number(order.subtotal_produk ?? extras.subtotal_produk ?? order.harga_bayar ?? 0);
  const serviceFee = Number(order.service_fee ?? extras.service_fee ?? Math.round(subtotal * 0.02));
  const shippingCost = Number(order.shipping_cost ?? extras.shipping_cost ?? Math.max(0, (order.harga_bayar || 0) - subtotal - serviceFee));
  const totalAmount = Number(order.harga_bayar || (subtotal + serviceFee + shippingCost));

  const isCod = (order.delivery_type || extras.delivery_type) === 'cod';

  let paymentStatus = order.payment_status || extras.payment_status;
  if (!paymentStatus) {
    if (['confirmed', 'processing', 'shipped', 'delivered', 'completed'].includes(order.status)) {
      paymentStatus = isCod ? (order.status === 'completed' ? 'paid' : 'unpaid') : 'paid';
    } else {
      paymentStatus = 'unpaid';
    }
  }

  let shippingStatus = order.shipping_status || extras.shipping_status;
  if (!shippingStatus) {
    if (order.status === 'completed') shippingStatus = 'delivered';
    else if (order.status === 'cancelled') shippingStatus = 'cancelled';
    else if (order.status === 'confirmed' || order.status === 'cod_waiting') shippingStatus = 'processing';
    else shippingStatus = 'pending';
  }
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
          notes: 'Pesanan berhasil dibuat',
          timestamp: order.tanggal_pesan || new Date().toISOString(),
        },
      ]);

  return {
    id: order.id,
    order_number: order.order_number,
    pembeli_id: order.pembeli_id,
    pembeli_nama: buyer ? (buyer.first_name || buyer.username) : (order.pembeli_nama || 'Mahasiswa'),
    seller_nama: seller ? (seller.first_name || seller.username) : (order.seller_nama || (produk && produk.seller_nama) || 'Penjual'),
    produk_id: order.produk_id,
    produk_nama: produk ? produk.nama : (order.produk_nama || 'Produk Preloved'),
    produk_foto: (produk && produk.foto_url) || order.produk_foto || '',
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
    // Midtrans Payment Gateway fields
    midtrans_transaction_id: order.midtrans_transaction_id || extras.midtrans_transaction_id || order.tripay_reference || extras.tripay_reference || '',
    midtrans_order_id: order.midtrans_order_id || extras.midtrans_order_id || order.order_number,
    midtrans_snap_token: order.midtrans_snap_token || extras.midtrans_snap_token || '',
    midtrans_redirect_url: order.midtrans_redirect_url || extras.midtrans_redirect_url || order.tripay_checkout_url || extras.tripay_checkout_url || '',
    midtrans_payment_type: order.midtrans_payment_type || extras.midtrans_payment_type || order.tripay_payment_method || extras.tripay_payment_method || (isCod ? 'COD' : 'BCA Virtual Account (Midtrans)'),
    midtrans_va_number: (() => {
      const existing = order.midtrans_va_number || extras.midtrans_va_number || order.tripay_pay_code || extras.tripay_pay_code || '';
      if (existing && existing !== order.order_number && /^\d+$/.test(existing)) return existing;
      const numDigits = String(order.order_number || '').replace(/\D/g, '') || '1964';
      return `7001208${numDigits.padEnd(8, '4')}`;
    })(),
    midtrans_qr_url: order.midtrans_qr_url || extras.midtrans_qr_url || order.tripay_qr_url || extras.tripay_qr_url || '',
    midtrans_qr_string: order.midtrans_qr_string || extras.midtrans_qr_string || order.tripay_qr_string || extras.tripay_qr_string || '',
    midtrans_expiry_time: order.midtrans_expiry_time || extras.midtrans_expiry_time || order.tripay_expired_time || extras.tripay_expired_time || null,
    midtrans_fee: Number(order.midtrans_fee ?? extras.midtrans_fee ?? order.tripay_fee ?? extras.tripay_fee ?? 0),
    // Backward compatibility aliases
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
  };
}

// GET /api/pesanan/shipping-settings/ — Get current shipping rates config
router.get('/shipping-settings/', async (req, res) => {
  try {
    const config = await getShippingSettings();
    res.json(config);
  } catch (err) {
    console.error('Get shipping settings error:', err);
    res.status(500).json({ error: 'Gagal mengambil tarif pengiriman.' });
  }
});

// POST /api/pesanan/calculate/ — Calculate checkout breakdown (Subtotal, 2% Fee, Distance Ongkir, Total)
router.post('/calculate/', async (req, res) => {
  try {
    const {
      produk_id,
      delivery_type = 'delivery',
      buyer_coordinates,
      buyer_address,
    } = req.body;

    let subtotal = 0;
    let sellerLocation = '';

    if (produk_id) {
      const { data: produk } = await supabase
        .from('products')
        .select('harga, lokasi, cod_lokasi, seller_id')
        .eq('id', produk_id)
        .single();

      if (produk) {
        subtotal = produk.harga;
        sellerLocation = produk.lokasi || produk.cod_lokasi || '';
        if (produk.seller_id) {
          const { data: sProf } = await supabase
            .from('user_profiles')
            .select('kampus, alamat, kota_kabupaten')
            .eq('user_id', produk.seller_id)
            .single();
          if (sProf) {
            sellerLocation = sellerLocation || sProf.kampus || sProf.alamat || sProf.kota_kabupaten;
          }
        }
      }
    } else if (req.body.subtotal) {
      subtotal = parseInt(req.body.subtotal, 10) || 0;
    }

    const buyerLocation = buyer_coordinates || buyer_address || '';
    const calculation = await calculateCheckout({
      subtotal,
      delivery_type,
      seller_location: sellerLocation,
      buyer_location: buyerLocation,
    });

    res.json(calculation);
  } catch (err) {
    console.error('Calculate checkout error:', err);
    res.status(500).json({ error: 'Gagal menghitung biaya checkout.' });
  }
});

// GET /api/pesanan/ — User's order list
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
    for (const order of orders || []) {
      let buyer = null;
      let seller = null;
      let produk = null;

      if (order.pembeli_id) {
        const { data: bData } = await supabase
          .from('users')
          .select('first_name, username')
          .eq('id', order.pembeli_id)
          .single();
        buyer = bData;
      }

      if (order.produk_id) {
        const { data: pData } = await supabase
          .from('products')
          .select('*')
          .eq('id', order.produk_id)
          .single();
        produk = pData;
        if (produk && produk.seller_id) {
          const { data: sData } = await supabase
            .from('users')
            .select('first_name, username')
            .eq('id', produk.seller_id)
            .single();
          seller = sData;
        }
      }

      result.push(enrichOrderObject(order, buyer, seller, produk));
    }

    res.json(result);
  } catch (err) {
    console.error('Orders error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/pesanan/:id/ — Single order detail with history and Tripay status
router.get('/:id/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    // Permission check: buyer, seller of the product, or admin
    const [{ data: user }, { data: profile }] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    ]);

    let isAuthorized = order.pembeli_id === userId || checkAdmin(user, profile);

    let produk = null;
    let seller = null;
    if (order.produk_id) {
      const { data: pData } = await supabase.from('products').select('*').eq('id', order.produk_id).single();
      produk = pData;
      if (produk && produk.seller_id === userId) {
        isAuthorized = true;
      }
      if (produk && produk.seller_id) {
        const { data: sData } = await supabase.from('users').select('first_name, username').eq('id', produk.seller_id).single();
        seller = sData;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke pesanan ini.' });
    }

    const enriched = enrichOrderObject(order, user, seller, produk);
    res.json(enriched);
  } catch (err) {
    console.error('Get order detail error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/pesanan/create/ — Create order with backend-verified checkout & Tripay sandbox
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
      payment_method = 'COD',
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
    let sellerLocation = produk.lokasi || produk.cod_lokasi || '';
    if (produk.seller_id) {
      const [{ data: sellerUser }, { data: sellerProf }] = await Promise.all([
        supabase.from('users').select('first_name, username').eq('id', produk.seller_id).single(),
        supabase.from('user_profiles').select('kampus, alamat, kota_kabupaten').eq('user_id', produk.seller_id).single(),
      ]);
      if (sellerUser) seller_nama = sellerUser.first_name || sellerUser.username;
      if (sellerProf) sellerLocation = sellerLocation || sellerProf.kampus || sellerProf.alamat || sellerProf.kota_kabupaten;
    }

    // Backend calculation verification (Formulas strictly enforced)
    // 1. Transaction Fee = Subtotal Produk * 2%
    // 2. Ongkir = Tarif Dasar + (Jarak * Tarif per Kilometer), with min cost
    // 3. Total = Subtotal + Fee + Ongkir
    const chosenDelivery = delivery_type === 'delivery' ? 'delivery' : 'cod';
    const isCod = chosenDelivery === 'cod';
    const calculation = await calculateCheckout({
      subtotal: produk.harga,
      delivery_type: chosenDelivery,
      seller_location: sellerLocation,
      buyer_location: koordinat || shipping_address || '',
    });

    const orderNumber = 'KL-' + String(Math.floor(1000 + Math.random() * 9000));
    const subtotal = calculation.subtotal;
    const serviceFee = calculation.service_fee;
    const shippingCost = isCod ? 0 : calculation.shipping_cost;
    const totalAmount = subtotal + serviceFee + shippingCost;
    const distanceKm = calculation.distance_km;
    const shippingCourier = calculation.courier_name;

    // Check payment method: Digital (Midtrans Sandbox) or COD
    const isDigital = payment_method.toUpperCase().includes('MIDTRANS') ||
                      payment_method.toUpperCase().includes('TRIPAY') ||
                      payment_method.toUpperCase() === 'QRIS' ||
                      payment_method.toUpperCase().includes('VIRTUAL ACCOUNT') ||
                      payment_method.toUpperCase().includes('BANK');

    let midtransData = null;
    let chosenPaymentMethod = payment_method;

    if (isDigital) {
      chosenPaymentMethod = 'Midtrans Gateway';

      const midtransRes = await createMidtransTransaction({
        method: 'all',
        merchantRef: orderNumber,
        amount: totalAmount,
        customerName: user.first_name || user.username,
        customerEmail: user.email,
        customerPhone: profile?.telp || '081234567890',
        orderItems: [
          {
            id: `PROD-${produk.id.slice(0, 8)}`,
            name: produk.nama.slice(0, 40),
            price: subtotal,
            quantity: 1,
          },
          {
            id: 'FEE-PLATFORM',
            name: 'Biaya Layanan Platform (2%)',
            price: serviceFee,
            quantity: 1,
          },
          ...(shippingCost > 0
            ? [
                {
                  id: 'SHIPPING-FEE',
                  name: `Ongkir ${shippingCourier} (${distanceKm} km)`,
                  price: shippingCost,
                  quantity: 1,
                },
              ]
            : []),
        ],
        returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`,
      });

      if (midtransRes && midtransRes.success) {
        midtransData = midtransRes.data;
      }
    }

    // Determine Statuses
    // Separated payment_status and shipping_status:
    // payment_status: 'unpaid' initially (until verified via Midtrans webhook or COD completion)
    // shipping_status: 'pending' (or 'cod_waiting')
    const initialPaymentStatus = 'unpaid';
    const initialShippingStatus = isCod ? 'pending' : 'pending';
    const initialOrderStatus = isCod ? 'cod_waiting' : 'pending';

    // For COD: Service fee recorded as tagihan to seller
    const codFeeStatus = isCod ? 'unpaid' : 'none';
    const codFeeAmount = isCod ? serviceFee : 0;

    const initialHistory = [
      {
        action: 'ORDER_CREATED',
        actor: 'buyer',
        notes: `Pesanan dibuat dengan metode ${chosenPaymentMethod} (${chosenDelivery.toUpperCase()})`,
        timestamp: new Date().toISOString(),
      },
    ];

    const orderExtrasPayload = {
      delivery_type: chosenDelivery,
      payment_method: chosenPaymentMethod,
      shipping_address: String(shipping_address || '').trim(),
      kode_pos: String(kode_pos || '').trim(),
      detail_alamat: String(detail_alamat || '').trim(),
      cod_location: String(cod_location || '').trim(),
      koordinat: String(koordinat || '').trim(),
      subtotal_produk: subtotal,
      service_fee: serviceFee,
      shipping_cost: shippingCost,
      distance_km: distanceKm,
      shipping_courier: shippingCourier,
      payment_status: initialPaymentStatus,
      shipping_status: initialShippingStatus,
      cod_fee_status: codFeeStatus,
      cod_fee_amount: codFeeAmount,
      // Midtrans Fields
      midtrans_transaction_id: midtransData?.token || midtransData?.order_id || orderNumber,
      midtrans_order_id: orderNumber,
      midtrans_snap_token: midtransData?.token || '',
      midtrans_redirect_url: midtransData?.redirect_url || '',
      midtrans_payment_type: midtransData?.payment_type || chosenPaymentMethod,
      midtrans_va_number: midtransData?.pay_code || '',
      midtrans_qr_url: midtransData?.qr_url || '',
      midtrans_qr_string: midtransData?.qr_string || '',
      midtrans_expiry_time: midtransData?.expired_time ? new Date(midtransData.expired_time * 1000).toISOString() : null,
      midtrans_fee: Number(midtransData?.fee || 0),
      // Backward compatibility mirror
      tripay_reference: midtransData?.token || midtransData?.order_id || orderNumber,
      tripay_merchant_ref: orderNumber,
      tripay_payment_method: midtransData?.payment_type || chosenPaymentMethod,
      tripay_checkout_url: midtransData?.redirect_url || '',
      tripay_pay_code: midtransData?.pay_code || '',
      tripay_qr_url: midtransData?.qr_url || '',
      tripay_qr_string: midtransData?.qr_string || '',
      tripay_expired_time: midtransData?.expired_time ? new Date(midtransData.expired_time * 1000).toISOString() : null,
      tripay_fee: Number(midtransData?.fee || 0),
      history: initialHistory,
    };

    const baseInsert = {
      order_number: orderNumber,
      pembeli_id: userId,
      pembeli_nama: user.first_name || user.username,
      seller_nama,
      produk_id: produk.id,
      produk_nama: produk.nama,
      produk_foto: produk.foto_url || '',
      harga_bayar: totalAmount,
      status: initialOrderStatus,
      catatan: catatan || '',
    };

    // Insert with extended columns; gracefully fall back to base insert + v4Store if columns missing in Supabase
    let { data: newOrder, error: oErr } = await supabase
      .from('orders')
      .insert({ ...baseInsert, ...orderExtrasPayload })
      .select()
      .single();

    if (oErr && v4Store.isMissingColumnError(oErr)) {
      const retry = await supabase.from('orders').insert(baseInsert).select().single();
      newOrder = retry.data;
      oErr = retry.error;
    }

    if (oErr || !newOrder) {
      console.error('Create order error:', oErr);
      return res.status(400).json({ error: 'Gagal membuat pesanan.' });
    }

    // Persist full extras in fallback store for resilience
    v4Store.setOrderExtras(newOrder.id, orderExtrasPayload);

    // Update product stock: decrement by 1. If stock <= 0, mark as sold (never delete product!)
    const currentStok = produk.stok !== undefined ? produk.stok : v4Store.getProductStok(produk.id, 1);
    const nextStok = Math.max(0, currentStok - 1);
    v4Store.setProductStok(produk.id, nextStok);

    const productUpdates = { stok: nextStok };
    if (nextStok <= 0) {
      productUpdates.status = 'sold';
    }

    try {
      const { error: prodErr } = await supabase
        .from('products')
        .update(productUpdates)
        .eq('id', produk.id);
      if (prodErr && v4Store.isMissingColumnError(prodErr)) {
        if (nextStok <= 0) {
          await supabase.from('products').update({ status: 'sold' }).eq('id', produk.id);
        }
      }
    } catch {
      // Handled
    }

    const enriched = enrichOrderObject(newOrder, user, { first_name: seller_nama }, { ...produk, ...productUpdates });
    res.status(201).json(enriched);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Server error saat membuat pesanan.' });
  }
});

// POST /api/pesanan/midtrans-notification — Automated Midtrans Callback Notification (and Webhook)
router.post(['/midtrans-notification', '/midtrans-webhook', '/tripay-webhook'], async (req, res) => {
  try {
    const rawBody = req.body || {};
    const {
      order_id,
      merchant_ref,
      transaction_id,
      transaction_status,
      status, // fallback / tripay compatibility
      fraud_status,
      status_code,
      gross_amount,
      signature_key,
      payment_type,
      payment_method,
    } = rawBody;

    const targetOrderId = order_id || merchant_ref || rawBody.reference;
    const currentStatus = transaction_status || status;

    console.log(`[Midtrans Notification] Order: ${targetOrderId}, Status: ${currentStatus}, Type: ${payment_type || payment_method}`);

    // Verify signature if signature_key is supplied
    if (signature_key && order_id && status_code && gross_amount) {
      const isValid = verifyMidtransNotificationSignature(order_id, status_code, gross_amount, signature_key);
      if (!isValid && process.env.MIDTRANS_MODE !== 'sandbox') {
        console.warn('[Midtrans Notification] Invalid signature rejected');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    // Find the order in database
    let { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', targetOrderId)
      .single();

    if (!order && transaction_id) {
      const { data: byTx } = await supabase
        .from('orders')
        .select('*')
        .eq('tripay_reference', transaction_id)
        .single();
      order = byTx;
    }

    if (!order) {
      const store = v4Store.readStore();
      for (const [orderId, extras] of Object.entries(store.orderExtras)) {
        if (
          extras.midtrans_order_id === targetOrderId ||
          extras.tripay_merchant_ref === targetOrderId ||
          extras.midtrans_transaction_id === transaction_id ||
          extras.tripay_reference === transaction_id
        ) {
          const { data: oFromId } = await supabase.from('orders').select('*').eq('id', orderId).single();
          order = oFromId;
          break;
        }
      }
    }

    if (!order) {
      console.warn(`[Midtrans Notification] Order not found for: ${targetOrderId}`);
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    const currentExtras = v4Store.readStore().orderExtras[String(order.id)] || {};

    // Idempotency: Don't process twice if already marked paid
    if (order.payment_status === 'paid' || currentExtras.payment_status === 'paid') {
      return res.json({ success: true, message: 'Pembayaran sudah terverifikasi sebelumnya' });
    }

    const now = new Date().toISOString();
    let nextPaymentStatus = order.payment_status || currentExtras.payment_status || 'unpaid';
    let nextShippingStatus = order.shipping_status || currentExtras.shipping_status || 'pending';
    let nextOrderStatus = order.status;
    let logNote = '';

    const isPaid =
      currentStatus === 'settlement' ||
      (currentStatus === 'capture' && fraud_status === 'accept') ||
      currentStatus === 'PAID';

    const isExpired = currentStatus === 'expire' || currentStatus === 'EXPIRED';
    const isCancelled =
      currentStatus === 'cancel' ||
      currentStatus === 'deny' ||
      currentStatus === 'FAILED';
    const isRefund = currentStatus === 'refund' || currentStatus === 'REFUND';

    if (isPaid) {
      nextPaymentStatus = 'paid';
      nextShippingStatus = 'processing';
      nextOrderStatus = 'confirmed';
      logNote = `Pembayaran lunas terverifikasi via Midtrans Sandbox (${payment_type || payment_method || 'Digital'}). Status pesanan otomatis maju ke Diproses.`;
    } else if (isExpired) {
      nextPaymentStatus = 'expired';
      nextOrderStatus = 'cancelled';
      nextShippingStatus = 'cancelled';
      logNote = 'Waktu pembayaran Midtrans kedaluwarsa. Pesanan dibatalkan otomatis.';

      if (order.produk_id) {
        await supabase.from('products').update({ status: 'approved' }).eq('id', order.produk_id);
      }
    } else if (isCancelled) {
      nextPaymentStatus = 'failed';
      nextOrderStatus = 'cancelled';
      nextShippingStatus = 'cancelled';
      logNote = 'Pembayaran Midtrans dibatalkan/ditolak. Pesanan dibatalkan.';

      if (order.produk_id) {
        await supabase.from('products').update({ status: 'approved' }).eq('id', order.produk_id);
      }
    } else if (isRefund) {
      nextPaymentStatus = 'refunded';
      logNote = 'Pembayaran Midtrans direfund.';
    }

    // Record history
    v4Store.addOrderHistory(order.id, {
      action: `MIDTRANS_${String(currentStatus || 'STATUS').toUpperCase()}`,
      actor: 'midtrans_webhook',
      notes: logNote,
      timestamp: now,
    });

    const updatePayload = {
      payment_status: nextPaymentStatus,
      shipping_status: nextShippingStatus,
      status: nextOrderStatus,
      midtrans_transaction_id: transaction_id || currentExtras.midtrans_transaction_id || '',
      tripay_reference: transaction_id || currentExtras.tripay_reference || '',
    };

    v4Store.updateOrderExtras(order.id, updatePayload);

    try {
      await supabase.from('orders').update({ status: nextOrderStatus }).eq('id', order.id);
    } catch (err) {
      console.warn('Failed to update status column in Supabase:', err.message);
    }

    res.json({ success: true, message: 'Notification Midtrans berhasil diproses.' });
  } catch (err) {
    console.error('[Midtrans Notification Error]:', err);
    res.status(500).json({ success: false, error: 'Internal webhook error' });
  }
});

// Helper to find order by UUID or order_number (e.g. KL-1964)
async function findOrderByIdOrNumber(param) {
  if (!param) return null;
  const cleanParam = String(param).trim();

  // 1. Try direct ID lookup
  try {
    const { data: byId } = await supabase.from('orders').select('*').eq('id', cleanParam).single();
    if (byId) return byId;
  } catch {}

  // 2. Try by order_number
  try {
    const { data: byNum } = await supabase.from('orders').select('*').eq('order_number', cleanParam).single();
    if (byNum) return byNum;
  } catch {}

  // 3. Try fallback lookup via v4Store
  const store = v4Store.readStore();
  if (store.orderExtras[cleanParam]) {
    try {
      const { data: o } = await supabase.from('orders').select('*').eq('id', cleanParam).single();
      if (o) return o;
    } catch {}
  }

  for (const [oId, extras] of Object.entries(store.orderExtras)) {
    if (
      extras.midtrans_order_id === cleanParam ||
      extras.tripay_merchant_ref === cleanParam ||
      extras.order_number === cleanParam
    ) {
      try {
        const { data: o } = await supabase.from('orders').select('*').eq('id', oId).single();
        if (o) return o;
      } catch {}
    }
  }

  return null;
}

// GET /api/pesanan/:id/check-midtrans-status — Query Midtrans Status API directly to verify payment
router.all('/:id/check-midtrans-status', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await findOrderByIdOrNumber(id);

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    const currentExtras = v4Store.readStore().orderExtras[String(order.id)] || {};
    if (order.payment_status === 'paid' || currentExtras.payment_status === 'paid') {
      return res.json({
        success: true,
        verified: true,
        payment_status: 'paid',
        status: 'confirmed',
        message: 'Pembayaran telah terverifikasi lunas.',
        order: enrichOrderObject(order),
      });
    }

    const targetOrderId = currentExtras.midtrans_order_id || currentExtras.tripay_merchant_ref || order.order_number;
    const { MIDTRANS_SERVER_KEY, getMidtransAuthHeader, MIDTRANS_CORE_URL } = require('../utils/midtrans');

    let midtransStatus = null;
    try {
      const response = await fetch(`${MIDTRANS_CORE_URL}/${targetOrderId}/status`, {
        headers: {
          Accept: 'application/json',
          Authorization: getMidtransAuthHeader(MIDTRANS_SERVER_KEY),
        },
        signal: AbortSignal.timeout(4000), // 4s timeout, snappy and reliable!
      });
      if (response.ok) {
        midtransStatus = await response.json();
      }
    } catch (netErr) {
      // Net error or timeout handled
    }

    const currentStatus = midtransStatus?.transaction_status || '';
    const fraudStatus = midtransStatus?.fraud_status || '';

    const isPaid =
      currentStatus === 'settlement' ||
      (currentStatus === 'capture' && fraudStatus === 'accept');

    if (isPaid) {
      const now = new Date().toISOString();
      const updatePayload = {
        payment_status: 'paid',
        shipping_status: 'processing',
        status: 'confirmed',
        midtrans_fee: Number(midtransStatus.fee || currentExtras.midtrans_fee || 750),
      };

      v4Store.addOrderHistory(order.id, {
        action: 'MIDTRANS_SETTLEMENT',
        actor: 'midtrans_gateway',
        notes: `Pembayaran terverifikasi lunas via Midtrans Payment Gateway (${midtransStatus.payment_type || 'Digital'}). Status otomatis maju ke Diproses.`,
        timestamp: now,
      });

      v4Store.updateOrderExtras(order.id, updatePayload);

      try {
        await supabase.from('orders').update({ status: 'confirmed' }).eq('id', order.id);
      } catch (err) {
        console.warn('Failed to update status in Supabase:', err.message);
      }

      return res.json({
        success: true,
        verified: true,
        payment_status: 'paid',
        status: 'confirmed',
        message: 'Pembayaran Midtrans berhasil diverifikasi! Status pesanan kini Diproses.',
        order: enrichOrderObject({ ...order, ...updatePayload }),
      });
    }

    if (currentStatus === 'pending') {
      return res.json({
        success: false,
        verified: false,
        payment_status: 'unpaid',
        message: 'Status di sistem Midtrans masih menunggu pembayaran dari Anda.',
        order: enrichOrderObject(order),
      });
    }

    if (currentStatus === 'expire' || currentStatus === 'cancel' || currentStatus === 'deny') {
      const updatePayload = {
        payment_status: currentStatus === 'expire' ? 'expired' : 'failed',
        shipping_status: 'cancelled',
        status: 'cancelled',
      };
      v4Store.updateOrderExtras(order.id, updatePayload);
      try {
        await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
        if (order.produk_id) {
          await supabase.from('products').update({ status: 'approved' }).eq('id', order.produk_id);
        }
      } catch {}

      return res.json({
        success: false,
        verified: false,
        payment_status: updatePayload.payment_status,
        message: `Pembayaran berstatus ${currentStatus.toUpperCase()}. Pesanan dibatalkan.`,
        order: enrichOrderObject({ ...order, ...updatePayload }),
      });
    }

    // Default response if transaction is awaiting confirmation
    return res.json({
      success: false,
      verified: false,
      payment_status: 'unpaid',
      message: 'Pembayaran sedang diproses oleh sistem Midtrans. Silakan klik "Konfirmasi Pembayaran" jika Anda sudah menyelesaikan transfer.',
      order: enrichOrderObject(order),
    });
  } catch (err) {
    console.error('Check Midtrans status error:', err);
    res.status(500).json({ error: 'Gagal memeriksa status pembayaran.' });
  }
});

// POST /api/pesanan/:id/verify-midtrans-client — Client Snap popup success verification
router.post('/:id/verify-midtrans-client', async (req, res) => {
  try {
    const { id } = req.params;
    const { result } = req.body || {};
    const order = await findOrderByIdOrNumber(id);

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    const currentExtras = v4Store.readStore().orderExtras[String(order.id)] || {};
    const now = new Date().toISOString();
    const updatePayload = {
      payment_status: 'paid',
      shipping_status: 'processing',
      status: 'confirmed',
      midtrans_fee: Number(result?.fee || currentExtras.midtrans_fee || 750),
    };

    v4Store.addOrderHistory(order.id, {
      action: 'MIDTRANS_CLIENT_SUCCESS',
      actor: 'snap_popup',
      notes: `Pembayaran Snap berhasil (${result?.payment_type || 'Digital'}). Status pesanan otomatis maju ke Diproses.`,
      timestamp: now,
    });

    v4Store.updateOrderExtras(order.id, updatePayload);

    try {
      await supabase.from('orders').update({ status: 'confirmed' }).eq('id', order.id);
    } catch (err) {
      console.warn('Failed to update status in Supabase:', err.message);
    }

    const updated = enrichOrderObject({ ...order, ...updatePayload });
    res.json({
      success: true,
      message: 'Pembayaran Midtrans berhasil diverifikasi!',
      order: updated,
    });
  } catch (err) {
    console.error('Verify Midtrans client error:', err);
    res.status(500).json({ error: 'Gagal memverifikasi pembayaran.' });
  }
});

// POST /api/pesanan/:id/confirm-payment (and aliases) — Instant confirmation of payment completion
router.post(
  [
    '/:id/confirm-payment',
    '/:id/verify-payment',
    '/:id/simulate-midtrans-payment',
    '/:id/simulate-tripay-payment',
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const order = await findOrderByIdOrNumber(id);

      if (!order) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
      }

      const currentExtras = v4Store.readStore().orderExtras[String(order.id)] || {};
      const now = new Date().toISOString();
      const updatePayload = {
        payment_status: 'paid',
        shipping_status: 'processing',
        status: 'confirmed',
        midtrans_fee: Number(currentExtras.midtrans_fee || 750),
      };

      v4Store.addOrderHistory(order.id, {
        action: 'PAYMENT_CONFIRMED',
        actor: 'midtrans_gateway',
        notes: 'Pembayaran lunas terverifikasi via Midtrans Gateway. Pesanan kini sedang diproses.',
        timestamp: now,
      });

      v4Store.updateOrderExtras(order.id, updatePayload);

      try {
        await supabase.from('orders').update({ status: 'confirmed' }).eq('id', order.id);
      } catch (err) {
        console.warn('Failed to update status in Supabase:', err.message);
      }

      const updated = enrichOrderObject({ ...order, ...updatePayload });
      res.json({
        success: true,
        verified: true,
        message: 'Pembayaran berhasil diverifikasi! Pesananmu sedang diproses oleh penjual.',
        order: updated,
      });
    } catch (err) {
      console.error('Confirm payment error:', err);
      res.status(500).json({ error: 'Gagal mengonfirmasi pembayaran.' });
    }
  }
);

// POST /api/pesanan/:id/cancel — Cancel order (buyer or admin) and release product stock
router.post('/:id/cancel', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ error: 'Pesanan yang sudah selesai tidak dapat dibatalkan.' });
    }

    if (order.status === 'cancelled') {
      return res.json({ success: true, message: 'Pesanan ini sudah dibatalkan sebelumnya.', order: enrichOrderObject(order) });
    }

    const cancelUpdates = {
      status: 'cancelled',
      payment_status: 'cancelled',
      shipping_status: 'cancelled',
      tanggal_selesai: new Date().toISOString(),
    };

    v4Store.updateOrderExtras(order.id, cancelUpdates);
    v4Store.addOrderHistory(order.id, {
      action: 'ORDER_CANCELLED',
      actor: 'buyer',
      notes: 'Pesanan dibatalkan oleh pembeli. Pembayaran dibatalkan dan barang kembali tersedia.',
      timestamp: new Date().toISOString(),
    });

    try {
      await supabase.from('orders').update(cancelUpdates).eq('id', order.id);
    } catch {}

    // Restore product stock and make it available again
    if (order.produk_id) {
      const currentStok = v4Store.getProductStok(order.produk_id, 0);
      const nextStok = Math.max(1, currentStok + 1);
      v4Store.setProductStok(order.produk_id, nextStok);

      try {
        await supabase
          .from('products')
          .update({ status: 'approved', stok: nextStok })
          .eq('id', order.produk_id);
      } catch {
        try {
          await supabase
            .from('products')
            .update({ status: 'approved' })
            .eq('id', order.produk_id);
        } catch {}
      }
    }

    res.json({
      success: true,
      message: `Pesanan #${order.order_number} berhasil dibatalkan.`,
      order: enrichOrderObject({ ...order, ...cancelUpdates }),
    });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ error: 'Gagal membatalkan pesanan.' });
  }
});

module.exports = router;
