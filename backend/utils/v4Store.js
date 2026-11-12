const os = require('os');
const fs = require('fs');
const path = require('path');

const BUNDLED_DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'kampusloop-data')
  : BUNDLED_DATA_DIR;
const BUNDLED_STORE_PATH = path.join(BUNDLED_DATA_DIR, 'v4_store.json');
const STORE_PATH = path.join(DATA_DIR, 'v4_store.json');

const EMPTY_STORE = {
  sitePaymentConfig: null,
  agreementFileUrl: null,
  sellerPayments: {},
  productCod: {},
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
      sellerPayments: parsed.sellerPayments || {},
      productCod: parsed.productCod || {},
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

module.exports = {
  readStore,
  isMissingColumnError,
  setSitePaymentConfig,
  setAgreementFileUrl,
  setSellerPayment,
  setProductCod,
  setUserAddress,
  setOrderExtras,
};

