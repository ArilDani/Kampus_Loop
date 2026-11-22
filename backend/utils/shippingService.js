const supabase = require('../supabaseClient');
const v4Store = require('./v4Store');

// Known campus coordinate dictionary for Indonesian universities
const KNOWN_CAMPUS_COORDS = {
  'unm': { lat: -5.1887, lon: 119.4298, name: 'Universitas Negeri Makassar (Gunungsari)' },
  'unm gunungsari': { lat: -5.1887, lon: 119.4298, name: 'UNM Kampus Gunungsari' },
  'unm parangtambung': { lat: -5.1804, lon: 119.4891, name: 'UNM Kampus Parangtambung' },
  'unhas': { lat: -5.1328, lon: 119.4890, name: 'Universitas Hasanuddin (Tamalanrea)' },
  'uin alauddin': { lat: -5.2079, lon: 119.4939, name: 'UIN Alauddin Makassar' },
  'umi': { lat: -5.1384, lon: 119.4475, name: 'Universitas Muslim Indonesia' },
  'ui': { lat: -6.3653, lon: 106.8317, name: 'Universitas Indonesia (Depok)' },
  'itb': { lat: -6.8915, lon: 107.6107, name: 'Institut Teknologi Bandung' },
  'ugm': { lat: -7.7713, lon: 110.3776, name: 'Universitas Gadjah Mada' },
  'ipb': { lat: -6.5601, lon: 106.7262, name: 'IPB University (Dramaga)' },
  'undip': { lat: -7.0506, lon: 110.4398, name: 'Universitas Diponegoro' },
  'unair': { lat: -7.2683, lon: 112.7836, name: 'Universitas Airlangga' },
  'its': { lat: -7.2824, lon: 112.7949, name: 'Institut Teknologi Sepuluh Nopember' },
  'ub': { lat: -7.9525, lon: 112.6145, name: 'Universitas Brawijaya' },
  'makassar': { lat: -5.1477, lon: 119.4327, name: 'Kota Makassar Pusat' },
};

const DEFAULT_COORDS = { lat: -5.1887, lon: 119.4298 }; // UNM Gunungsari default

/**
 * Parses coordinate string into { lat, lon }
 * Supports format: "-5.1887, 119.4298" or "lat: -5.1887, lon: 119.4298" or object
 */
function parseCoordinates(coordInput) {
  if (!coordInput) return null;
  if (typeof coordInput === 'object' && coordInput.lat !== undefined && coordInput.lon !== undefined) {
    const lat = parseFloat(coordInput.lat);
    const lon = parseFloat(coordInput.lon);
    if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
  }
  if (typeof coordInput === 'string') {
    const match = coordInput.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
    }

    // Try lookup in known campus dict
    const clean = coordInput.toLowerCase().trim();
    for (const [key, coords] of Object.entries(KNOWN_CAMPUS_COORDS)) {
      if (clean.includes(key)) {
        return { lat: coords.lat, lon: coords.lon };
      }
    }
  }
  return null;
}

/**
 * Calculates Haversine distance between two coordinates in Kilometers
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  // Round to 1 decimal place, minimum realistic distance 0.5 km
  return Math.max(0.5, Math.round(distance * 10) / 10);
}

/**
 * Estimate distance when one or both coordinates are missing or provided as text
 */
function estimateDistanceByText(originText, destinationText) {
  const oClean = String(originText || '').toLowerCase();
  const dClean = String(destinationText || '').toLowerCase();

  // If identical campus or neighbourhood
  if (oClean && dClean && (oClean.includes(dClean) || dClean.includes(oClean))) {
    return 1.2;
  }
  // If mentions same city (e.g. Makassar)
  if (oClean.includes('makassar') && dClean.includes('makassar')) {
    return 3.5;
  }
  // Default inter-campus/nearby delivery
  return 2.5;
}

/**
 * Distance Calculation Provider
 */
class DistanceRateCalculator {
  static calculate(origin, destination) {
    const originCoords = parseCoordinates(origin) || DEFAULT_COORDS;
    const destCoords = parseCoordinates(destination) || parseCoordinates(origin) || DEFAULT_COORDS;

    if (originCoords && destCoords) {
      const dist = calculateHaversineDistance(
        originCoords.lat,
        originCoords.lon,
        destCoords.lat,
        destCoords.lon
      );
      return dist;
    }
    return estimateDistanceByText(origin, destination);
  }
}

/**
 * Modular Shipping Provider Interface
 * Allows seamless integration with third-party Logistics APIs (RajaOngkir, Biteship, Shipper) in future
 */
class BaseShippingProvider {
  async getRates(params) {
    throw new Error('getRates() must be implemented by provider');
  }
}

class InternalDistanceShippingProvider extends BaseShippingProvider {
  async getRates({ origin, destination, config }) {
    const distanceKm = DistanceRateCalculator.calculate(origin, destination);
    const baseRate = Number(config.base_rate || 5000);
    const ratePerKm = Number(config.rate_per_km || 2000);
    const minCost = Number(config.min_shipping_cost || 8000);

    const calculated = baseRate + distanceKm * ratePerKm;
    const finalCost = Math.max(minCost, Math.round(calculated));

    return {
      provider: 'distance_matrix',
      courier_name: config.courier_name || 'KampusLoop Express (Kurir Kampus)',
      distance_km: distanceKm,
      base_rate: baseRate,
      rate_per_km: ratePerKm,
      min_shipping_cost: minCost,
      shipping_cost: finalCost,
      estimated_delivery: 'Hari ini / 1-2 jam (Kurir Kampus)',
    };
  }
}

// Placeholder for future third-party logistics API integration (RajaOngkir / Biteship)
class RajaOngkirShippingProvider extends BaseShippingProvider {
  async getRates(params) {
    // When RAJAONGKIR_API_KEY is configured in .env, call RajaOngkir API
    // Fallback to internal distance calculator
    return new InternalDistanceShippingProvider().getRates(params);
  }
}

/**
 * Retrieves the current shipping config from Supabase or fallback store
 */
async function getShippingSettings() {
  try {
    const { data: settings } = await supabase
      .from('settings')
      .select('shipping_config')
      .eq('id', 1)
      .single();

    if (settings && settings.shipping_config && typeof settings.shipping_config === 'object') {
      return {
        ...v4Store.DEFAULT_SHIPPING_CONFIG,
        ...settings.shipping_config,
      };
    }
  } catch (err) {
    // Graceful fallback to local store
  }
  return v4Store.getShippingConfig();
}

/**
 * Saves shipping configuration to Supabase and fallback store
 */
async function saveShippingSettings(config) {
  const merged = {
    ...v4Store.DEFAULT_SHIPPING_CONFIG,
    ...config,
  };
  // Save to fallback store
  v4Store.setShippingConfig(merged);
  try {
    const { clearSiteSettingsCache } = require('./helpers');
    clearSiteSettingsCache();
  } catch {}

  try {
    const { error } = await supabase
      .from('settings')
      .update({ shipping_config: merged })
      .eq('id', 1);

    if (error && !v4Store.isMissingColumnError(error)) {
      console.error('Save shipping config error to Supabase:', error);
    }
  } catch (err) {
    // Handled
  }
  return merged;
}

/**
 * Main Checkout Calculation Engine
 * Formula:
 * - Transaction Fee = Subtotal Produk * 2%
 * - Ongkir = Tarif Dasar + (Jarak * Tarif per Kilometer), dengan Biaya Minimum
 * - Total Pembayaran = Subtotal Produk + Transaction Fee + Ongkir
 */
async function calculateCheckout({
  subtotal,
  delivery_type,
  seller_location,
  buyer_location,
  shipping_config,
}) {
  const safeSubtotal = Math.max(0, parseInt(subtotal, 10) || 0);
  const serviceFee = Math.round(safeSubtotal * 0.02); // 2% Transaction Fee

  const config = shipping_config || (await getShippingSettings());

  let distanceKm = 0;
  let shippingCost = 0;
  const isCod = delivery_type === 'cod';

  if (!isCod) {
    const provider = new InternalDistanceShippingProvider();
    const rateInfo = await provider.getRates({
      origin: seller_location || DEFAULT_COORDS,
      destination: buyer_location,
      config,
    });
    distanceKm = rateInfo.distance_km;
    shippingCost = rateInfo.shipping_cost;
  }

  const totalAmount = safeSubtotal + serviceFee + shippingCost;

  return {
    subtotal: safeSubtotal,
    service_fee: serviceFee,
    service_fee_rate: 0.02,
    service_fee_percent: '2%',
    distance_km: distanceKm,
    shipping_cost: shippingCost,
    total_amount: totalAmount,
    courier_name: isCod ? 'COD (Serah Terima Kampus)' : config.courier_name,
    is_cod: isCod,
    config: {
      base_rate: config.base_rate,
      rate_per_km: config.rate_per_km,
      min_shipping_cost: config.min_shipping_cost,
    },
  };
}

module.exports = {
  KNOWN_CAMPUS_COORDS,
  DEFAULT_COORDS,
  parseCoordinates,
  calculateHaversineDistance,
  getShippingSettings,
  saveShippingSettings,
  calculateCheckout,
  InternalDistanceShippingProvider,
  RajaOngkirShippingProvider,
};
