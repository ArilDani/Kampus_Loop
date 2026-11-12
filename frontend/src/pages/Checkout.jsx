import React, { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { MapPin, Handshake, Truck, Banknote, QrCode, Landmark, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
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
    api.get(`/produk/${primaryItem.id}/`)
      .then((res) => {
        if (active && res.data) setFreshProduct(res.data)
      })
      .catch(() => {})
    return () => { active = false }
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
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
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

  // Shopee-style full delivery address
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

  // Payment method selection
  const availableMethods = useMemo(() => {
    const list = []
    if (paymentOpts.cod_enabled !== false) list.push('COD')
    if (paymentOpts.qris_enabled) list.push('QRIS')
    if (paymentOpts.bank_enabled) list.push('Transfer Bank')
    return list.length > 0 ? list : ['COD']
  }, [paymentOpts])

  const [paymentMethod, setPaymentMethod] = useState(availableMethods[0] || 'COD')
  const [catatan, setCatatan] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  useEffect(() => {
    if (!availableMethods.includes(paymentMethod)) {
      setPaymentMethod(availableMethods[0] || 'COD')
    }
  }, [availableMethods, paymentMethod])

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
          showToast('Lokasi terkini berhasil diambil!')
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
          showToast('Koordinat lokasi terkini berhasil diambil!')
        } finally {
          setLocatingGps(false)
        }
      },
      () => {
        setLocatingGps(false)
        showToast('Izin lokasi ditolak atau GPS tidak tersedia.')
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
      if (!address.nama_penerima || !address.telp || !address.kode_pos || !address.alamat) {
        showToast('Lengkapi nama penerima, no. HP, kode pos, dan alamat lengkap pengiriman.')
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
      let successCount = 0
      let lastErr = ''
      for (const item of items) {
        try {
          await api.post('/pesanan/create/', {
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
          successCount++
        } catch (err) {
          lastErr = err.response?.data?.error || 'Gagal membuat pesanan.'
        }
      }

      if (successCount > 0) {
        if (fromCart) clearCart()
        window.dispatchEvent(new CustomEvent('kampusloop:dataUpdated'))
        showToast('Pesanan berhasil dibuat! Pantau detailnya di Dashboard Pesanan.')
        navigate('/dashboard')
      } else {
        showToast(lastErr || 'Gagal membuat pesanan.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (p) => 'Rp' + Number(p || 0).toLocaleString('id-ID')
  const subtotal = items.reduce((sum, i) => sum + Number(i.harga || 0), 0)

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
          <h1>Atur Pengiriman / COD & Metode Pembayaran</h1>
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
                  style={{ fontSize: '10px', padding: '7px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
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
                  <span>COD di Kampus / Sekitar</span>
                </button>
                <button
                  type="button"
                  className={`btn ${deliveryType === 'delivery' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}
                  onClick={() => setDeliveryType('delivery')}
                >
                  <Truck size={15} strokeWidth={2.2} />
                  <span>Antar ke Alamat Lengkap</span>
                </button>
              </div>

              {deliveryType === 'cod' ? (
                <div className="listing-form" style={{ marginTop: '14px' }}>
                  {codSuggestions.length > 0 && (
                    <div>
                      <small style={{ display: 'block', marginBottom: '8px', color: 'var(--muted)', fontWeight: 700 }}>
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
                      <small style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                        <CheckCircle2 size={13} strokeWidth={2.2} />
                        <span>Koordinat GPS terlampir: {koordinat}</span>
                      </small>
                    )}
                  </div>
                </div>
              ) : (
                <div className="listing-form" style={{ marginTop: '14px' }}>
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
                        required
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
                    <label>Detail Lainnya / Patokan (Blok, Lantai, Warna Pagar)</label>
                    <input
                      placeholder="Contoh: Lantai 2 Kamar 5, depan minimarket"
                      value={address.detail_alamat}
                      onChange={(e) => setAddress({ ...address, detail_alamat: e.target.value })}
                    />
                    {koordinat && (
                      <small style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                        <CheckCircle2 size={13} strokeWidth={2.2} />
                        <span>Koordinat GPS terlampir: {koordinat}</span>
                      </small>
                    )}
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={saveAddressToProfile}
                      onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                    />
                    <span>Simpan alamat ini sebagai alamat utama di Profil saya</span>
                  </label>
                </div>
              )}
            </div>

            {/* Step 2: Metode Pembayaran */}
            <div className="listing-form-card show" style={{ marginTop: 0 }}>
              <div className="dash-section-row">
                <div>
                  <span className="eyebrow">Langkah 2</span>
                  <h2>Metode Pembayaran</h2>
                </div>
              </div>

              <div className="payment-method-grid">
                {availableMethods.map((method) => (
                  <button
                    type="button"
                    key={method}
                    className={`payment-option-card ${paymentMethod === method ? 'active' : ''}`}
                    onClick={() => setPaymentMethod(method)}
                  >
                    <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {method === 'COD' ? (
                        <>
                          <Banknote size={15} strokeWidth={2.2} />
                          <span>COD (Bayar di Tempat)</span>
                        </>
                      ) : method === 'QRIS' ? (
                        <>
                          <QrCode size={15} strokeWidth={2.2} />
                          <span>QRIS</span>
                        </>
                      ) : (
                        <>
                          <Landmark size={15} strokeWidth={2.2} />
                          <span>Transfer Bank</span>
                        </>
                      )}
                    </strong>
                    <small>
                      {method === 'COD'
                        ? 'Bayar tunai/langsung saat serah terima'
                        : method === 'QRIS'
                          ? paymentOpts.qris_label || 'Scan QRIS instan'
                          : `${paymentOpts.bank_name || 'Bank'} · ${paymentOpts.bank_account_number || 'Lihat detail'}`}
                    </small>
                  </button>
                ))}
              </div>

              {/* Payment Instructions Box */}
              {paymentMethod === 'QRIS' && (
                <div className="payment-detail-box">
                  <strong>Instruksi Pembayaran QRIS ({paymentOpts.qris_label || 'KampusLoop'})</strong>
                  {paymentOpts.qris_image_url ? (
                    <img
                      src={paymentOpts.qris_image_url}
                      alt="QRIS"
                      style={{ width: '210px', maxWidth: '100%', borderRadius: '12px', border: '1px solid var(--line)', marginTop: '10px', display: 'block' }}
                    />
                  ) : (
                    <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--muted)' }}>
                      Silakan scan kode QRIS yang dibagikan penjual/admin setelah konfirmasi pesanan.
                    </p>
                  )}
                </div>
              )}

              {paymentMethod === 'Transfer Bank' && (
                <div className="payment-detail-box">
                  <strong>Detail Rekening Transfer Bank</strong>
                  <div style={{ marginTop: '8px', fontSize: '12px', display: 'grid', gap: '4px' }}>
                    <span>Bank: <b>{paymentOpts.bank_name || '-'}</b></span>
                    <span>No. Rekening: <b>{paymentOpts.bank_account_number || 'Hubungi penjual untuk nomor rekening'}</b></span>
                    <span>Atas Nama: <b>{paymentOpts.bank_account_name || primaryProduct?.seller_nama || 'KampusLoop'}</b></span>
                  </div>
                </div>
              )}

              <div className="field" style={{ marginTop: '14px' }}>
                <label>Catatan Tambahan untuk Penjual (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Bisa ketemu jam 2 siang setelah kelas / titip di pos satpam"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <aside className="checkout-summary-card">
            <span className="eyebrow">Ringkasan Pesanan</span>
            <h2 style={{ margin: '4px 0 14px', fontSize: '20px' }}>Total Pembelian</h2>

            <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
              {items.map((item) => (
                <div key={item.id} className="checkout-item-row">
                  <img
                    src={item.foto_display || item.foto_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=120'}
                    alt={item.nama}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong>{item.nama}</strong>
                    <small>{item.kategori} · {item.kondisi}</small>
                  </div>
                  <b>{formatPrice(item.harga)}</b>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '14px', display: 'grid', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Pengiriman</span>
                <b>{deliveryType === 'cod' ? 'COD Kampus (Rp0)' : 'Antar Alamat'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Pembayaran</span>
                <b>{paymentMethod}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', marginTop: '6px', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                <strong>Total Bayar</strong>
                <strong style={{ color: 'var(--green)' }}>{formatPrice(subtotal)}</strong>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '18px' }}
              disabled={submitting}
            >
              {submitting ? 'Memproses Pesanan...' : 'Buat Pesanan Sekarang ↗'}
            </button>
          </aside>
        </form>
      </section>
    </main>
  )
}
