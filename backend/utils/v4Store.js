const os = require('os');
const fs = require('fs');
const path = require('path');

const BUNDLED_DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'kampusloop-data')
  : BUNDLED_DATA_DIR;
const BUNDLED_STORE_PATH = path.join(BUNDLED_DATA_DIR, 'v4_store.json');
const STORE_PATH = path.join(DATA_DIR, 'v4_store.json');

const DEFAULT_SHIPPING_CONFIG = {
  base_rate: 5000,
  rate_per_km: 2000,
  min_shipping_cost: 8000,
  courier_name: 'KampusLoop Express (Kurir Kampus)',
  provider: 'distance_matrix',
  active: true,
};

const EMPTY_STORE = {
  sitePaymentConfig: null,
  agreementFileUrl: null,
  shippingConfig: null,
  sellerPayments: {},
  productCod: {},
  productStok: {},
  userAddresses: {},
  orderExtras: {},
};

function readStore() {
  try {
    const readPath = fs.existsSync(STORE_PATH)
      ? STORE_PATH
      : (fs.existsSync(BUNDLED_STORE_PATH) ? BUNDLED_STORE_PATH : null);
    if (!readPath) {
      return { ...EMPTY_STORE };
    }
    const raw = fs.readFileSync(readPath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      sitePaymentConfig: parsed.sitePaymentConfig || null,
      agreementFileUrl: parsed.agreementFileUrl ?? null,
      shippingConfig: parsed.shippingConfig || null,
      sellerPayments: parsed.sellerPayments || {},
      productCod: parsed.productCod || {},
      productStok: parsed.productStok || {},
      userAddresses: parsed.userAddresses || {},
      orderExtras: parsed.orderExtras || {},
    };
  } catch {
    return { ...EMPTY_STORE };
  }
}

function writeStore(nextStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(nextStore, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed writing v4Store fallback:', err);
  }
}

function isMissingColumnError(err) {
  if (!err) return false;
  const code = String(err.code || '');
  const msg = String(err.message || err.details || '');
  return (
    code === 'PGRST204' ||
    code === '42703' ||
    /column .* does not exist/i.test(msg) ||
    /Could not find the '.*' column/i.test(msg)
  );
}

function setSitePaymentConfig(cfg) {
  const store = readStore();
  store.sitePaymentConfig = cfg;
  writeStore(store);
}

function setShippingConfig(cfg) {
  const store = readStore();
  store.shippingConfig = { ...DEFAULT_SHIPPING_CONFIG, ...(store.shippingConfig || {}), ...cfg };
  writeStore(store);
}

function getShippingConfig() {
  const store = readStore();
  return { ...DEFAULT_SHIPPING_CONFIG, ...(store.shippingConfig || {}) };
}

function setAgreementFileUrl(url) {
  const store = readStore();
  store.agreementFileUrl = url;
  writeStore(store);
}

function setSellerPayment(userId, cfg) {
  const store = readStore();
  if (cfg === null) {
    delete store.sellerPayments[String(userId)];
  } else {
    store.sellerPayments[String(userId)] = cfg;
  }
  writeStore(store);
}

function setProductCod(productId, codLokasi) {
  const store = readStore();
  if (codLokasi === null) {
    delete store.productCod[String(productId)];
  } else {
    store.productCod[String(productId)] = String(codLokasi || '').trim();
  }
  writeStore(store);
}

function setProductStok(productId, stok) {
  const store = readStore();
  if (stok === null || stok === undefined) {
    delete store.productStok[String(productId)];
  } else {
    store.productStok[String(productId)] = Math.max(0, parseInt(stok, 10) || 0);
  }
  writeStore(store);
}

function getProductStok(productId, defaultVal = 1) {
  const store = readStore();
  const val = store.productStok[String(productId)];
  return val !== undefined ? val : defaultVal;
}

function setUserAddress(userId, addr) {
  const store = readStore();
  if (addr === null) {
    delete store.userAddresses[String(userId)];
  } else {
    store.userAddresses[String(userId)] = addr;
  }
  writeStore(store);
}

function setOrderExtras(orderId, extras) {
  const store = readStore();
  store.orderExtras[String(orderId)] = extras;
  writeStore(store);
}

function updateOrderExtras(orderId, partial) {
  const store = readStore();
  const existing = store.orderExtras[String(orderId)] || {};
  store.orderExtras[String(orderId)] = { ...existing, ...partial };
  writeStore(store);
  return store.orderExtras[String(orderId)];
}

function addOrderHistory(orderId, entry) {
  const store = readStore();
  const key = String(orderId);
  const existing = store.orderExtras[key] || {};
  const history = Array.isArray(existing.history) ? [...existing.history] : [];
  history.push({
    action: entry.action || 'STATUS_UPDATE',
    actor: entry.actor || 'system',
    notes: entry.notes || '',
    timestamp: new Date().toISOString(),
    ...entry,
  });
  store.orderExtras[key] = { ...existing, history };
  writeStore(store);
  return history;
}

module.exports = {
  DEFAULT_SHIPPING_CONFIG,
  readStore,
  isMissingColumnError,
  setSitePaymentConfig,
  setShippingConfig,
  getShippingConfig,
  setAgreementFileUrl,
  setSellerPayment,
  setProductCod,
  setProductStok,
  getProductStok,
  setUserAddress,
  setOrderExtras,
  updateOrderExtras,
  addOrderHistory,
};
