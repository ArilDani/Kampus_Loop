import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  MapPin,
  Handshake,
  Truck,
  Banknote,
  QrCode,
  Landmark,
  CheckCircle2,
  Sparkles,
  Info,
  CreditCard,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import MidtransPaymentModal from '../components/MidtransPaymentModal'
import api from '../api'

export default function Checkout() {
  const { user, setUser } = useAuth()
  const { cartItems, clearCart, showToast } = useCart()
  const location = useLocation()
  const navigate = useNavigate()

  const passedItems = location.state?.items
  const fromCart = Boolean(location.state?.fromCart)
  const items = useMemo(() => {
    if (Array.isArray(passedItems) && passedItems.length > 0) return passedItems
    return cartItems
  }, [passedItems, cartItems])

  const primaryItem = items[0] || null
  const [freshProduct, setFreshProduct] = useState(null)

  useEffect(() => {
    if (!primaryItem?.id) return
    let active = true
    api
      .get(`/produk/${primaryItem.id}/`)
      .then((res) => {
        if (active && res.data) setFreshProduct(res.data)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [primaryItem?.id])

  const primaryProduct = freshProduct || primaryItem
  const paymentOpts = useMemo(
    () =>
      primaryProduct?.payment_options || {
        cod_enabled: true,
        qris_enabled: true,
        qris_image_url: '',
        qris_label: 'QRIS KampusLoop',
        bank_enabled: true,
        bank_name: 'BCA / BRI / BNI',
        bank_account_number: '',
        bank_account_name: '',
        cod_locations: 'Perpustakaan Pusat, Kantin Fakultas, Gerbang Utama Kampus',
      },
    [primaryProduct]
  )

  const codSuggestions = useMemo(() => {
    const raw = primaryProduct?.cod_lokasi || paymentOpts.cod_locations || ''
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }, [primaryProduct, paymentOpts])

  const [deliveryType, setDeliveryType] = useState('cod') // 'cod' | 'delivery'
  const [codLocation, setCodLocation] = useState(codSuggestions[0] || '')
  const [codEditedByUser, setCodEditedByUser] = useState(false)

  useEffect(() => {
    if (!codEditedByUser && codSuggestions.length > 0) {
      setCodLocation(codSuggestions[0])
    }
  }, [codSuggestions, codEditedByUser])

  const [koordinat, setKoordinat] = useState('')
  const [locatingGps, setLocatingGps] = useState(false)

  // Full delivery address
  const [address, setAddress] = useState({
    nama_penerima: user?.nama || user?.name || '',
    telp: user?.telp || '',
    provinsi: user?.provinsi || '',
    kota_kabupaten: user?.kota_kabupaten || '',
    kecamatan: user?.kecamatan || '',
    kode_pos: user?.kode_pos || '',
    alamat: user?.alamat || '',
    detail_alamat: user?.detail_alamat || '',
  })
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true)

  // Payment method exclusively handled by Midtrans Sandbox Gateway
  const paymentMethod = 'MIDTRANS'
  const [catatan, setCatatan] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Real-time backend distance & shipping rate calculation
  const [calcData, setCalcData] = useState({
    distance_km: 0,
    shipping_cost: 0,
    service_fee: 0,
    courier_name: 'KampusLoop Express (Kurir Kampus)',
  })
  const [calculating, setCalculating] = useState(false)

  // Post-checkout modal for Midtrans
  const [createdMidtransOrder, setCreatedMidtransOrder] = useState(null)

  useEffect(() => {
    if (!user) {
      showToast('Silakan login terlebih dahulu untuk melanjutkan transaksi.')
      navigate('/auth?mode=login')
    }
  }, [user, navigate, showToast])

  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        nama_penerima: prev.nama_penerima || user.nama || user.name || '',
        telp: prev.telp || user.telp || '',
        provinsi: prev.provinsi || user.provinsi || '',
        kota_kabupaten: prev.kota_kabupaten || user.kota_kabupaten || '',
        kecamatan: prev.kecamatan || user.kecamatan || '',
        kode_pos: prev.kode_pos || user.kode_pos || '',
        alamat: prev.alamat || user.alamat || '',
        detail_alamat: prev.detail_alamat || user.detail_alamat || '',
      }))
    }
  }, [user])

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.harga || 0), 0),
    [items]
  )

  // Fetch verified calculation from backend
  const fetchCalculation = useCallback(async () => {
    if (items.length === 0) return
    setCalculating(true)
    try {
      const buyerAddr = [
        address.alamat,
        address.kecamatan,
        address.kota_kabupaten,
        address.provinsi,
      ]
        .filter(Boolean)
        .join(', ')

      const res = await api.post('/pesanan/calculate/', {
        produk_id: primaryProduct?.id,
        subtotal,
        delivery_type: deliveryType,
        buyer_coordinates: koordinat,
        buyer_address: buyerAddr,
      })

      if (res.data) {
        setCalcData({
          distance_km: res.data.distance_km || 0,
          shipping_cost: res.data.shipping_cost || 0,
          service_fee: res.data.service_fee || Math.round(subtotal * 0.02),
          courier_name: res.data.courier_name || 'KampusLoop Express (Kurir Kampus)',
        })
      }
    } catch (err) {
      // Fallback local formula if network fails
      const fallbackFee = Math.round(subtotal * 0.02)
      setCalcData((prev) => ({
        ...prev,
        service_fee: fallbackFee,
        shipping_cost: deliveryType === 'cod' ? 0 : 8000,
      }))
    } finally {
      setCalculating(false)
    }
  }, [primaryProduct?.id, subtotal, deliveryType, koordinat, address])

  useEffect(() => {
    fetchCalculation()
  }, [fetchCalculation])

  const serviceFee = calcData.service_fee || Math.round(subtotal * 0.02)
  const shippingCost = deliveryType === 'cod' ? 0 : calcData.shipping_cost
  const totalAmount = subtotal + serviceFee + shippingCost

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Browser Anda tidak mendukung deteksi lokasi GPS.')
      return
    }
    setLocatingGps(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const coordStr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        setKoordinat(coordStr)

        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await resp.json()
          const addr = data?.address || {}
          const display = data?.display_name || `Koordinat GPS: ${coordStr}`

          if (deliveryType === 'cod') {
            setCodLocation(display.slice(0, 140))
            setCodEditedByUser(true)
          } else {
            setAddress((prev) => ({
              ...prev,
              provinsi: addr.state || prev.provinsi,
              kota_kabupaten: addr.city || addr.town || addr.county || prev.kota_kabupaten,
              kecamatan: addr.suburb || addr.village || addr.city_district || prev.kecamatan,
              kode_pos: addr.postcode || prev.kode_pos,
              alamat: [addr.road, addr.neighbourhood].filter(Boolean).join(', ') || display.slice(0, 140),
            }))
          }
          showToast('Lokasi GPS & jarak pengiriman berhasil dihitung!')
        } catch {
          if (deliveryType === 'cod') {
            setCodLocation(`Lokasi GPS (${coordStr})`)
            setCodEditedByUser(true)
          } else {
            setAddress((prev) => ({
              ...prev,
              alamat: prev.alamat || `Lokasi GPS (${coordStr})`,
            }))
          }
          showToast('Koordinat GPS berhasil diperoleh!')
        } finally {
          setLocatingGps(false)
        }
      },
      () => {
        setLocatingGps(false)
        showToast('Izin lokasi ditolak atau GPS tidak aktif.')
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (!user) return
    if (items.length === 0) {
      showToast('Tidak ada produk untuk dibeli.')
      return
    }

    if (deliveryType === 'cod' && !codLocation.trim()) {
      showToast('Silakan pilih atau isi lokasi pertemuan COD.')
      return
    }

    if (deliveryType === 'delivery') {
      if (!address.nama_penerima || !address.telp || !address.alamat) {
        showToast('Lengkapi nama penerima, no. HP, dan alamat lengkap pengiriman.')
        return
      }
      if (saveAddressToProfile) {
        try {
          const profRes = await api.put('/user/profile/update/', {
            nama: address.nama_penerima,
            telp: address.telp,
            provinsi: address.provinsi,
            kota_kabupaten: address.kota_kabupaten,
            kecamatan: address.kecamatan,
            kode_pos: address.kode_pos,
            alamat: address.alamat,
            detail_alamat: address.detail_alamat,
          })
          if (profRes.data?.user && setUser) {
            setUser(profRes.data.user)
            localStorage.setItem('kampusloop_session', JSON.stringify(profRes.data.user))
          }
        } catch {
          // Non-blocking
        }
      }
    }

    const fullShippingAddress =
      deliveryType === 'delivery'
        ? `${address.nama_penerima} (${address.telp}) — ${address.alamat}, Kec. ${address.kecamatan || '-'}, ${address.kota_kabupaten || '-'}, ${address.provinsi || '-'}`
        : ''

    setSubmitting(true)
    try {
      let firstCreated = null
      let lastErr = ''

      for (const item of items) {
        try {
          const res = await api.post('/pesanan/create/', {
            produk_id: item.id,
            delivery_type: deliveryType,
            payment_method: paymentMethod,
            shipping_address: fullShippingAddress,
            kode_pos: deliveryType === 'delivery' ? address.kode_pos : '',
            detail_alamat: deliveryType === 'delivery' ? address.detail_alamat : '',
            cod_location: deliveryType === 'cod' ? codLocation : '',
            koordinat,
            catatan: catatan || `Pesanan (${deliveryType.toUpperCase()} · ${paymentMethod})`,
          })
          if (!firstCreated && res.data) {
            firstCreated = res.data
          }
        } catch (err) {
          lastErr = err.response?.data?.error || 'Gagal membuat pesanan.'
        }
      }

      if (firstCreated) {
        if (fromCart) clearCart()
        window.dispatchEvent(new CustomEvent('kampusloop:dataUpdated'))

        // If Midtrans/Digital, show payment modal for instant testing & QRIS/VA display
        if (paymentMethod.startsWith('MIDTRANS') || paymentMethod.startsWith('TRIPAY') || paymentMethod === 'QRIS') {
          showToast('Pesanan berhasil dibuat! Selesaikan pembayaran melalui Midtrans Sandbox.')
          setCreatedMidtransOrder(firstCreated)
        } else {
          showToast('Pesanan COD berhasil dibuat! Pantau di Dashboard Pesanan.')
          navigate('/dashboard')
        }
      } else {
        showToast(lastErr || 'Gagal membuat pesanan.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (p) => 'Rp' + Number(p || 0).toLocaleString('id-ID')

  if (!user) return null

  if (items.length === 0) {
    return (
      <main className="wrap" style={{ padding: '70px 0' }}>
        <div className="empty-state">
          <strong>Belum ada produk di keranjang atau checkout.</strong>
          <div style={{ marginTop: '14px' }}>
            <Link to="/shop" className="btn btn-primary">
              Belanja di Shop ↗
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main>
      <section className="page-hero" style={{ paddingBottom: '22px' }}>
        <div className="wrap">
          <Link to="/shop" className="article-back-link">
            ← Kembali ke Shop
          </Link>
          <span className="eyebrow">Checkout KampusLoop</span>
          <h1>Pembayaran Digital (Midtrans) & Pengiriman Berdasarkan Jarak</h1>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: '85px' }}>
        <form className="checkout-grid" onSubmit={handlePlaceOrder}>
          {/* Left Column: Address / COD & Payment */}
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Step 1: Metode Pengiriman / COD */}
            <div className="listing-form-card show" style={{ marginTop: 0 }}>
              <div className="dash-section-row">
                <div>
                  <span className="eyebrow">Langkah 1</span>
                  <h2>Pilih Pengambilan COD atau Antar Alamat</h2>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{
                    fontSize: '10px',
                    padding: '7px 12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  onClick={handleUseCurrentLocation}
                  disabled={locatingGps}
                >
                  <MapPin size={13} strokeWidth={2.2} />
                  <span>{locatingGps ? 'Mendeteksi GPS...' : 'Gunakan Lokasi Terkini'}</span>
                </button>
              </div>

              <div className="checkout-mode-tabs">
                <button
                  type="button"
                  className={`btn ${deliveryType === 'cod' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}
                  onClick={() => setDeliveryType('cod')}
                >
                  <Handshake size={15} strokeWidth={2.2} />
                  <span>COD di Kampus / Sekitar (Rp0)</span>
                </button>
                <button
                  type="button"
                  className={`btn ${deliveryType === 'delivery' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}
                  onClick={() => setDeliveryType('delivery')}
                >
                  <Truck size={15} strokeWidth={2.2} />
                  <span>Antar Berdasarkan Jarak</span>
                </button>
              </div>

              {deliveryType === 'cod' ? (
                <div className="listing-form" style={{ marginTop: '14px' }}>
                  {codSuggestions.length > 0 && (
                    <div>
                      <small
                        style={{
                          display: 'block',
                          marginBottom: '8px',
                          color: 'var(--muted)',
                          fontWeight: 700,
                        }}
                      >
                        Pilihan Titik COD Tersedia dari Penjual:
                      </small>
                      <div className="cod-chip-list">
                        {codSuggestions.map((spot, idx) => (
                          <button
                            type="button"
                            key={idx}
                            className={`cod-chip-btn ${codLocation === spot ? 'active' : ''}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => {
                              setCodLocation(spot)
                              setCodEditedByUser(true)
                            }}
                          >
                            <MapPin size={12} strokeWidth={2.2} />
                            <span>{spot}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="field">
                    <label>Lokasi Pertemuan COD</label>
                    <input
                      required
                      placeholder="Contoh: Perpustakaan Pusat Lt. 1 / Kantin Fakultas"
                      value={codLocation}
                      onChange={(e) => {
                        setCodLocation(e.target.value)
                        setCodEditedByUser(true)
                      }}
                    />
                    {koordinat && (
                      <small
                        style={{
                          color: 'var(--green)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          marginTop: '4px',
                        }}
                      >
                        <CheckCircle2 size={13} strokeWidth={2.2} />
                        <span>Koordinat GPS terlampir: {koordinat}</span>
                      </small>
                    )}
                  </div>
                </div>
              ) : (
                <div className="listing-form" style={{ marginTop: '14px' }}>
                  {/* Distance & Courier Info Banner */}
                  <div
                    style={{
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1', fontWeight: 700, fontSize: '12px' }}>
                        <Truck size={15} />
                        <span>{calcData.courier_name}</span>
                      </div>
                      <small style={{ color: '#0284c7', fontSize: '11px' }}>
                        Tarif Dasar + (Jarak × Tarif/km) · Min. Rp8.000
                      </small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>
                        Estimasi Jarak:{' '}
                        <b>{calculating ? '...' : `${calcData.distance_km || 1.5} km`}</b>
                      </span>
                      <strong style={{ color: '#0369a1', fontSize: '14px' }}>
                        {formatPrice(shippingCost)}
                      </strong>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label>Nama Lengkap Penerima</label>
                      <input
                        required
                        value={address.nama_penerima}
                        onChange={(e) => setAddress({ ...address, nama_penerima: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>Nomor Telepon / WhatsApp</label>
                      <input
                        required
                        placeholder="08xxxxxxxxxx"
                        value={address.telp}
                        onChange={(e) => setAddress({ ...address, telp: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label>Provinsi</label>
                      <input
                        required
                        placeholder="Contoh: Sulawesi Selatan"
                        value={address.provinsi}
                        onChange={(e) => setAddress({ ...address, provinsi: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>Kota / Kabupaten</label>
                      <input
                        required
                        placeholder="Contoh: Kota Makassar"
                        value={address.kota_kabupaten}
                        onChange={(e) => setAddress({ ...address, kota_kabupaten: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label>Kecamatan</label>
                      <input
                        required
                        placeholder="Contoh: Rappocini"
                        value={address.kecamatan}
                        onChange={(e) => setAddress({ ...address, kecamatan: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>Kode Pos</label>
                      <input
                        placeholder="Contoh: 90222"
                        value={address.kode_pos}
                        onChange={(e) => setAddress({ ...address, kode_pos: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Nama Jalan, Gedung, No. Rumah / Kos</label>
                    <input
                      required
                      placeholder="Contoh: Jl. A.P. Pettarani No. 12, Kos Melati"
                      value={address.alamat}
                      onChange={(e) => setAddress({ ...address, alamat: e.target.value })}
                    />
                  </div>

                  <div className="field">
                    <label>Detail Lainnya / Patokan</label>
                    <input
                      placeholder="Contoh: Lantai 2 Kamar 5, depan minimarket"
                      value={address.detail_alamat}
                      onChange={(e) => setAddress({ ...address, detail_alamat: e.target.value })}
                    />
                    {koordinat && (
                      <small
                        style={{
                          color: 'var(--green)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          marginTop: '4px',
                        }}
                      >
                        <CheckCircle2 size={13} strokeWidth={2.2} />
                        <span>Koordinat GPS terlampir: {koordinat}</span>
                      </small>
                    )}
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={saveAddressToProfile}
                      onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                    />
                    <span>Simpan alamat ini sebagai alamat utama di Profil saya</span>
                  </label>
                </div>
              )}

              <div className="field" style={{ marginTop: '16px', borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
                <label>Catatan Tambahan untuk Penjual (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Bisa ketemu jam 2 siang setelah kuliah / titip di resepsionis"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>
            </div>

            {/* Banner Informasi Pembayaran via Midtrans Gateway */}
            <div
              className="listing-form-card show"
              style={{
                marginTop: 0,
                background: '#f0f9ff',
                borderColor: '#bae6fd',
                padding: '16px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: '#e0f2fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284c7',
                    }}
                  >
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0369a1', display: 'block' }}>
                      Metode Pembayaran: Midtrans Gateway
                    </strong>
                    <span style={{ fontSize: '11px', color: '#0284c7' }}>
                      Semua metode pembayaran (QRIS, GoPay, ShopeePay, Virtual Account BCA/BNI/BRI/Mandiri, Kartu Kredit) otomatis tersedia di pop-up Midtrans.
                    </span>
                  </div>
                </div>
                <span className="status-pill status-green" style={{ fontSize: '9px', whiteSpace: 'nowrap' }}>
                  Midtrans Sandbox Aktif
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Transparent Fee Breakdown */}
          <aside className="checkout-summary-card">
            <span className="eyebrow">Ringkasan Biaya Checkout</span>
            <h2 style={{ margin: '4px 0 14px', fontSize: '20px' }}>Total Pembayaran</h2>

            <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
              {items.map((item) => (
                <div key={item.id} className="checkout-item-row">
                  <img
                    src={
                      item.foto_display ||
                      item.foto_url ||
                      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=120'
                    }
                    alt={item.nama}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong>{item.nama}</strong>
                    <small>
                      {item.kategori} · {item.kondisi}
                    </small>
                  </div>
                  <b>{formatPrice(item.harga)}</b>
                </div>
              ))}
            </div>

            {/* Transparent Cost Breakdown */}
            <div
              style={{
                borderTop: '1px solid var(--line)',
                paddingTop: '14px',
                display: 'grid',
                gap: '10px',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Subtotal Produk</span>
                <b>{formatPrice(subtotal)}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    color: 'var(--muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Biaya operasional & perlindungan transaksi platform"
                >
                  <span>Biaya Layanan Platform (2%)</span>
                  <Info size={12} color="#888" />
                </span>
                <b>{formatPrice(serviceFee)}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ color: 'var(--muted)', display: 'block' }}>
                    Ongkos Kirim
                  </span>
                  <small style={{ color: '#0369a1', fontSize: '10px' }}>
                    {deliveryType === 'cod'
                      ? 'COD Kampus (Rp0)'
                      : `${calcData.courier_name} · ${calcData.distance_km || 1.5} km`}
                  </small>
                </div>
                <b>{formatPrice(shippingCost)}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Metode Bayar</span>
                <b style={{ color: '#0284c7' }}>Midtrans Gateway</b>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '16px',
                  marginTop: '6px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--line)',
                }}
              >
                <strong>Total Bayar</strong>
                <strong style={{ color: 'var(--green)', fontSize: '18px' }}>
                  {formatPrice(totalAmount)}
                </strong>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '18px' }}
              disabled={submitting}
            >
              {submitting ? 'Menyiapkan Midtrans...' : 'Bayar Sekarang via Midtrans ↗'}
            </button>
          </aside>
        </form>
      </section>

      {/* Midtrans Payment Instructions & Sandbox Simulator Modal */}
      {createdMidtransOrder && (
        <MidtransPaymentModal
          order={createdMidtransOrder}
          onClose={() => {
            setCreatedMidtransOrder(null)
            navigate('/dashboard')
          }}
          onSuccess={() => {
            setTimeout(() => {
              navigate('/dashboard')
            }, 1800)
          }}
          showToast={showToast}
        />
      )}
    </main>
  )
}
