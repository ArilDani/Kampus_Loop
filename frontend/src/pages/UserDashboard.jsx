import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  MapPin,
  Settings,
  Heart,
  Sparkles,
  Check,
  X,
  Clock,
  Search,
  Bell,
  LayoutGrid,
  Package,
  ArrowUpRight,
  User as UserIcon,
  LogOut,
  RotateCw,
  CreditCard,
  Truck,
  AlertCircle,
  Calendar,
  DollarSign,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import CodLocationManager from '../components/CodLocationManager'
import MidtransPaymentModal from '../components/MidtransPaymentModal'
import api from '../api'

export default function UserDashboard() {
  const { user, setUser, refreshUser, logout } = useAuth()
  const { showToast } = useCart()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({ listings_count: 0, orders_count: 0, total_spent: 0, impact_score: 0 })
  const [myListings, setMyListings] = useState([])
  const [orders, setOrders] = useState([])
  const [sellerOrders, setSellerOrders] = useState([])
  const [wishlistItems, setWishlistItems] = useState([])
  const [searchListing, setSearchListing] = useState('')

  // Modal states for payment, detail, shipping status update
  const [payingOrder, setPayingOrder] = useState(null)
  const [detailModalOrder, setDetailModalOrder] = useState(null)
  const [updatingShippingId, setUpdatingShippingId] = useState(null)

  // New listing form state
  const [showListingForm, setShowListingForm] = useState(false)
  const [newListing, setNewListing] = useState({
    nama: '',
    kategori: 'Buku & Akademik',
    harga: '',
    harga_asli: '',
    kondisi: 'Good',
    stok: 1,
    lokasi: '',
    cod_lokasi: '',
    foto_url: '',
    deskripsi: '',
  })
  const [uploadingListingPhoto, setUploadingListingPhoto] = useState(false)
  const [submittingListing, setSubmittingListing] = useState(false)

  // Edit listing modal state
  const [editingListing, setEditingListing] = useState(null)
  const [uploadingEditPhoto, setUploadingEditPhoto] = useState(false)
  const [savingEditListing, setSavingEditListing] = useState(false)

  // Seller payment config state
  const [showSellerPayment, setShowSellerPayment] = useState(false)
  const [sellerPayment, setSellerPayment] = useState({
    cod_enabled: true,
    qris_enabled: false,
    qris_image_url: '',
    qris_label: '',
    bank_enabled: false,
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    cod_locations: 'Perpustakaan Pusat, Kantin Fakultas, Gerbang Utama Kampus',
  })
  const [uploadingQris, setUploadingQris] = useState(false)
  const [savingSellerPayment, setSavingSellerPayment] = useState(false)
  const [applyCodToProducts, setApplyCodToProducts] = useState(true)

  // Profile edit modal state
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    nama: '',
    email: '',
    kampus: '',
    telp: '',
    gender: 'Laki-laki',
    nim: '',
    fakultas_prodi: '',
    angkatan: '',
    provinsi: '',
    kota_kabupaten: '',
    kecamatan: '',
    kode_pos: '',
    alamat: '',
    detail_alamat: '',
    bio: '',
  })

  // Seller application state
  const [agreementTemplate, setAgreementTemplate] = useState({ judul: '', isi: '', catatan: '' })
  const [showAgreementPreview, setShowAgreementPreview] = useState(false)
  const [sellerForm, setSellerForm] = useState({
    nama: '',
    nim: '',
    kampus: '',
    fakultas_prodi: '',
    angkatan: '',
    telp: '',
    alamat: '',
    alasan: '',
    ktm_url: '',
    bukti_lain_url: '',
    surat_perjanjian_url: '',
  })
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState({ ktm: false, bukti: false, surat: false })
  const [submittingSeller, setSubmittingSeller] = useState(false)

  const isSeller = Boolean(
    user && (user.role === 'seller' || user.role === 'admin' || user.is_staff || user.is_superuser)
  )

  const loadDashboardData = useCallback(async () => {
    try {
      const [statsRes, listingsRes, ordersRes, wishlistRes, sellerOrdRes, tmplRes, payRes] = await Promise.all([
        api.get('/user/stats/').catch(() => ({ data: { listings_count: 0, orders_count: 0, total_spent: 0, impact_score: 0 } })),
        api.get('/user/listings/').catch(() => ({ data: [] })),
        api.get('/pesanan/').catch(() => ({ data: [] })),
        api.get('/wishlist/').catch(() => ({ data: [] })),
        api.get('/user/seller-orders/').catch(() => ({ data: [] })),
        api.get('/user/agreement-template/').catch(() => ({ data: { judul: '', isi: '', catatan: '' } })),
        api.get('/user/payment-settings/').catch(() => ({ data: null })),
      ])

      setStats(statsRes.data || { listings_count: 0, orders_count: 0, total_spent: 0, impact_score: 0 })
      setMyListings(Array.isArray(listingsRes.data) ? listingsRes.data : (listingsRes.data?.results || []))
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.results || []))
      setWishlistItems(Array.isArray(wishlistRes.data) ? wishlistRes.data : (wishlistRes.data?.results || []))
      setSellerOrders(Array.isArray(sellerOrdRes.data) ? sellerOrdRes.data : [])
      if (tmplRes.data) setAgreementTemplate(tmplRes.data)
      if (payRes?.data && typeof payRes.data === 'object') {
        setSellerPayment((prev) => ({ ...prev, ...payRes.data }))
      }
    } catch {
      // Fallback kept empty
    }
  }, [])

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=login')
      return
    }

    setProfileData({
      nama: user.nama || user.name || '',
      email: user.email || '',
      kampus: user.kampus || user.campus || '',
      telp: user.telp || '',
      gender: user.gender || 'Laki-laki',
      nim: user.nim || '',
      fakultas_prodi: user.fakultas_prodi || '',
      angkatan: user.angkatan || '',
      provinsi: user.provinsi || '',
      kota_kabupaten: user.kota_kabupaten || '',
      kecamatan: user.kecamatan || '',
      kode_pos: user.kode_pos || '',
      alamat: user.alamat || '',
      detail_alamat: user.detail_alamat || '',
      bio: user.bio || '',
    })

    if (user.payment_config) {
      setSellerPayment((prev) => ({ ...prev, ...user.payment_config }))
    }

    setSellerForm((prev) => ({
      ...prev,
      nama: prev.nama || user.nama || user.name || '',
      nim: prev.nim || user.nim || '',
      kampus: prev.kampus || user.kampus || user.campus || '',
      fakultas_prodi: prev.fakultas_prodi || user.fakultas_prodi || '',
      angkatan: prev.angkatan || user.angkatan || '',
      telp: prev.telp || user.telp || '',
      alamat: prev.alamat || user.alamat || '',
      alasan: prev.alasan || user.alasan_pengajuan_penjual || '',
      ktm_url: prev.ktm_url || user.ktm_url || '',
      bukti_lain_url: prev.bukti_lain_url || user.bukti_lain_url || '',
      surat_perjanjian_url: prev.surat_perjanjian_url || user.surat_perjanjian_url || '',
    }))

    loadDashboardData()
  }, [user, navigate, loadDashboardData])

  useEffect(() => {
    const onDataUpdated = () => {
      loadDashboardData()
      refreshUser()
    }
    window.addEventListener('kampusloop:dataUpdated', onDataUpdated)
    return () => window.removeEventListener('kampusloop:dataUpdated', onDataUpdated)
  }, [loadDashboardData, refreshUser])

  const uploadFile = async (file, folder) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', folder)
    const res = await api.post('/upload/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.url
  }

  const handleListingPhotoUpload = async (e, isEdit = false) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (isEdit) setUploadingEditPhoto(true)
    else setUploadingListingPhoto(true)

    try {
      const url = await uploadFile(file, 'products')
      if (isEdit) {
        setEditingListing((prev) => ({ ...prev, foto_url: url }))
      } else {
        setNewListing((prev) => ({ ...prev, foto_url: url }))
      }
      showToast('Foto produk berhasil diunggah!')
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal mengunggah foto produk.')
    } finally {
      if (isEdit) setUploadingEditPhoto(false)
      else setUploadingListingPhoto(false)
    }
  }

  const handleDocUpload = async (e, docKey, fieldName) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDoc((prev) => ({ ...prev, [docKey]: true }))
    try {
      const url = await uploadFile(file, 'verification')
      setSellerForm((prev) => ({ ...prev, [fieldName]: url }))
      showToast('Berkas berhasil diunggah!')
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal mengunggah berkas.')
    } finally {
      setUploadingDoc((prev) => ({ ...prev, [docKey]: false }))
    }
  }

  const handleCreateListing = async (e) => {
    e.preventDefault()
    setSubmittingListing(true)

    try {
      const res = await api.post('/produk/create/', {
        ...newListing,
        lokasi: newListing.lokasi || profileData.kampus || '',
      })
      showToast('Barang berhasil diajukan untuk moderasi admin!')
      setMyListings([res.data, ...myListings])
      setShowListingForm(false)
      setNewListing({
        nama: '',
        kategori: 'Buku & Akademik',
        harga: '',
        harga_asli: '',
        kondisi: 'Good',
        stok: 1,
        lokasi: '',
        cod_lokasi: '',
        foto_url: '',
        deskripsi: '',
      })
      loadDashboardData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menambahkan barang.')
    } finally {
      setSubmittingListing(false)
    }
  }

  const handleSaveEditListing = async (e) => {
    e.preventDefault()
    if (!editingListing) return
    setSavingEditListing(true)
    try {
      await api.put(`/produk/${editingListing.id}/update/`, {
        nama: editingListing.nama,
        kategori: editingListing.kategori,
        kondisi: editingListing.kondisi,
        harga: editingListing.harga,
        harga_asli: editingListing.harga_asli,
        lokasi: editingListing.lokasi,
        cod_lokasi: editingListing.cod_lokasi || '',
        foto_url: editingListing.foto_url,
        deskripsi: editingListing.deskripsi,
        stok: editingListing.stok !== undefined ? Math.max(0, parseInt(editingListing.stok, 10)) : 1,
      })
      showToast('Produk berhasil diperbarui dan tersimpan di database!')
      setEditingListing(null)
      loadDashboardData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal memperbarui produk.')
    } finally {
      setSavingEditListing(false)
    }
  }

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Yakin ingin membatalkan pesanan ini? Stok produk akan dikembalikan ke etalase toko.')) return
    try {
      await api.post(`/pesanan/${orderId}/cancel/`)
      showToast('Pesanan berhasil dibatalkan dan stok produk dikembalikan.')
      if (payingOrder?.id === orderId) setPayingOrder(null)
      if (detailModalOrder?.id === orderId) setDetailModalOrder(null)
      loadDashboardData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal membatalkan pesanan.')
    }
  }

  const handleSellerUpdateShipping = async (orderId, newStatus) => {
    try {
      setUpdatingShippingId(orderId)
      await api.put(`/user/seller-orders/${orderId}/shipping-status/`, { shipping_status: newStatus })
      showToast(`Status pengiriman berhasil diubah ke: ${newStatus}`)
      loadDashboardData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal memperbarui status pengiriman.')
    } finally {
      setUpdatingShippingId(null)
    }
  }

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Hapus barang ini secara permanen?')) return
    try {
      await api.delete(`/produk/${id}/delete/`)
      setMyListings(myListings.filter((item) => item.id !== id))
      showToast('Barang berhasil dihapus.')
      loadDashboardData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menghapus barang.')
    }
  }

  const [locatingProfileGps, setLocatingProfileGps] = useState(false)

  const handleDetectProfileGPS = () => {
    if (!navigator.geolocation) {
      showToast('Browser Anda tidak mendukung fitur geolokasi.')
      return
    }
    setLocatingProfileGps(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          )
          const data = await resp.json()
          const addr = data.address || {}
          setProfileData((prev) => ({
            ...prev,
            provinsi: addr.state || prev.provinsi,
            kota_kabupaten: addr.city || addr.town || addr.county || prev.kota_kabupaten,
            kecamatan: addr.suburb || addr.village || addr.district || prev.kecamatan,
            kode_pos: addr.postcode || prev.kode_pos,
            alamat: data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          }))
          showToast('Lokasi terkini berhasil dideteksi!')
        } catch {
          setProfileData((prev) => ({
            ...prev,
            alamat: prev.alamat || `Koordinat GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          }))
          showToast('Koordinat GPS terdeteksi. Lengkapi detail alamat jika diperlukan.')
        } finally {
          setLocatingProfileGps(false)
        }
      },
      () => {
        setLocatingProfileGps(false)
        showToast('Izin lokasi ditolak atau gagal mengakses GPS.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      const res = await api.put('/user/profile/update/', profileData)
      const updatedUser = res.data.user || { ...user, ...profileData }
      if (setUser) setUser(updatedUser)
      localStorage.setItem('kampusloop_session', JSON.stringify(updatedUser))
      showToast('Profil berhasil diperbarui dan tersimpan di database!')
      setEditingProfile(false)
    } catch (err) {
      const errDetail = err.response?.data?.error || 'Gagal menyimpan profil.'
      showToast(errDetail)
    }
  }

  const handleSubmitSellerApplication = async (e) => {
    e.preventDefault()
    if (!agreeTerms) {
      showToast('Centang pernyataan kebenaran berkas dan surat perjanjian terlebih dahulu.')
      return
    }
    if (!sellerForm.ktm_url || !sellerForm.bukti_lain_url || !sellerForm.surat_perjanjian_url) {
      showToast('Mohon unggah seluruh berkas (KTM, bukti mahasiswa lainnya, dan surat perjanjian tertandatangani).')
      return
    }

    setSubmittingSeller(true)
    try {
      const res = await api.post('/user/ajukan-penjual/', sellerForm)
      const updatedUser = res.data.user
      if (updatedUser && setUser) {
        setUser(updatedUser)
        localStorage.setItem('kampusloop_session', JSON.stringify(updatedUser))
      }
      showToast(res.data.message || 'Pengajuan menjadi Penjual berhasil dikirim!')
      loadDashboardData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal mengirim pengajuan penjual.')
    } finally {
      setSubmittingSeller(false)
    }
  }

  const handleDownloadAgreement = () => {
    if (agreementTemplate.file_url) {
      window.open(agreementTemplate.file_url, '_blank')
    } else {
      window.open('/api/user/agreement-download/', '_blank')
    }
  }

  const handleSellerQrisUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingQris(true)
    try {
      const url = await uploadFile(file, 'products')
      setSellerPayment((prev) => ({ ...prev, qris_image_url: url }))
      showToast('Gambar QRIS berhasil diunggah!')
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal mengunggah gambar QRIS.')
    } finally {
      setUploadingQris(false)
    }
  }

  const handleSaveSellerPayment = async (e) => {
    e.preventDefault()
    setSavingSellerPayment(true)
    try {
      const res = await api.post('/user/payment-settings/', {
        ...sellerPayment,
        apply_to_products: applyCodToProducts,
      })
      if (res.data?.payment_config) {
        setSellerPayment((prev) => ({ ...prev, ...res.data.payment_config }))
      }
      if (res.data?.user && setUser) {
        setUser(res.data.user)
        localStorage.setItem('kampusloop_session', JSON.stringify(res.data.user))
      }
      await loadDashboardData()
      window.dispatchEvent(new CustomEvent('kampusloop:dataUpdated'))
      showToast(res.data?.message || 'Metode pembayaran & lokasi COD penjual tersimpan!')
      setShowSellerPayment(false)
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menyimpan pengaturan pembayaran.')
    } finally {
      setSavingSellerPayment(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    showToast('Kamu telah keluar dari akun.')
    navigate('/')
  }

  if (!user) return null

  const initial = (user.name ? user.name[0] : 'M').toUpperCase()
  const formatPrice = (p) => 'Rp' + Number(p || 0).toLocaleString('id-ID')
  const roleLabel =
    user.role === 'admin'
      ? 'Admin Web'
      : user.role === 'seller'
        ? 'Penjual Terverifikasi'
        : 'User (Pembeli)'

  const filteredListings = myListings.filter((item) =>
    item.nama.toLowerCase().includes(searchListing.toLowerCase())
  )

  return (
    <main className="dashboard-page">
      <div className="dashboard-wrap">
        {/* ─── SIDEBAR ────────────────────────────────────────────── */}
        <aside className="dash-sidebar user-sidebar">
          <Link to="/" className="dash-brand">
            <span className="brand-mark">∞</span>
            <span>
              Kampus<span>Loop</span>
              <small>{user.role === 'seller' ? 'SELLER SPACE' : 'STUDENT SPACE'}</small>
            </span>
          </Link>

          <div className="dash-profile-mini">
            <div className="profile-initial">{initial}</div>
            <div>
              <strong>{user.name}</strong>
              <small>{roleLabel} · {profileData.kampus || user.campus || 'Mahasiswa'}</small>
            </div>
          </div>

          <span className="dash-nav-label">WORKSPACE</span>
          <button
            className={`dash-nav ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span>▦</span> Overview
          </button>
          <button
            className={`dash-nav ${activeTab === 'my-listings' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-listings')}
          >
            <LayoutGrid size={15} /> Barang Saya <i>{myListings.length}</i>
          </button>
          <button
            className={`dash-nav ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ArrowUpRight size={15} /> Pesanan <i>{orders.length}</i>
          </button>
          <button
            className={`dash-nav ${activeTab === 'wishlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('wishlist')}
          >
            <Heart size={15} /> Wishlist <i>{wishlistItems.length}</i>
          </button>
          <button
            className={`dash-nav ${activeTab === 'apply-seller' ? 'active' : ''}`}
            onClick={() => setActiveTab('apply-seller')}
          >
            <Sparkles size={15} /> Ajukan Penjual{' '}
            {user.role === 'seller' ? (
              <i style={{ display: 'inline-flex', alignItems: 'center' }}><Check size={12} strokeWidth={2.5} /></i>
            ) : user.status_pengajuan_penjual === 'pending' ? (
              <i className="nav-alert">1</i>
            ) : null}
          </button>

          <span className="dash-nav-label">PREFERENCES</span>
          <button
            className={`dash-nav ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <UserIcon size={15} /> Profil Saya
          </button>

          <div className="dash-sidebar-bottom">
            <div className="help-card">
              <span><Sparkles size={15} /></span>
              <strong>Butuh bantuan?</strong>
              <small>Tim KampusLoop siap membantu transaksi kampusmu.</small>
              <button onClick={() => navigate('/contact')}>Hubungi kami →</button>
            </div>

            <button className="dash-logout" onClick={handleLogout}>
              <LogOut size={15} /> Keluar akun
            </button>
          </div>
        </aside>

        {/* ─── MAIN CONTENT ───────────────────────────────────────── */}
        <div className="dash-main">
          {/* Topbar */}
          <div className="dash-topbar">
            <div>
              <span className="eyebrow">Student workspace · {roleLabel}</span>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Halo, {user.name ? user.name.split(' ')[0] : 'Mahasiswa'}</span>
                <Sparkles size={20} style={{ color: 'var(--green)' }} />
              </h1>
              <p>Kelola barang, pesanan, verifikasi penjual, dan aktivitas sirkularmu di KampusLoop.</p>
            </div>
            <div className="dash-top-actions">
              <button
                className="dash-icon-button"
                onClick={() => showToast('Tidak ada notifikasi baru.')}
                title="Notifikasi"
              >
                <Bell size={16} />
              </button>
              <div className="dash-user-chip">
                <span className="profile-initial small">{initial}</span>
                <span>{user.name ? user.name.split(' ')[0] : 'Mahasiswa'}</span>
              </div>
            </div>
          </div>

          <div className="dash-content">
            {/* ─── TAB: OVERVIEW ──────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="dash-panel active">
                <div className="welcome-banner">
                  <div>
                    <span className="eyebrow">Your campus, your marketplace</span>
                    <h2>
                      Barangmu punya<br />
                      <em>kesempatan kedua.</em>
                    </h2>
                    <p>
                      {isSeller
                        ? 'Mulai jual barang yang tak lagi digunakan atau temukan perlengkapan kuliah yang kamu butuhkan.'
                        : 'Belanja perlengkapan kuliah hemat atau ajukan verifikasi mahasiswa untuk mulai menjual barangmu.'}
                    </p>
                    <button
                      className="btn btn-lime"
                      onClick={() => {
                        if (isSeller) {
                          setActiveTab('my-listings')
                          setShowListingForm(true)
                        } else {
                          setActiveTab('apply-seller')
                        }
                      }}
                    >
                      {isSeller ? '+ Jual barang sekarang' : 'Ajukan jadi penjual ↗'}
                    </button>
                  </div>
                  <div className="welcome-graphic">
                    <div className="graphic-ring ring-a" />
                    <div className="graphic-ring ring-b" />
                    <div className="graphic-emoji">
                      <RotateCw size={28} />
                    </div>
                    <span className="graphic-leaf leaf-a"><Sparkles size={14} /></span>
                    <span className="graphic-leaf leaf-b"><Sparkles size={14} /></span>
                  </div>
                </div>

                <div className="dash-stat-grid">
                  <article className="dash-stat">
                    <span>Barang terdaftar</span>
                    <strong>{myListings.length}</strong>
                    <small><b>↗</b> Barang yang kamu jual</small>
                    <i><Package size={16} /></i>
                  </article>
                  <article className="dash-stat">
                    <span>Pesanan aktif</span>
                    <strong>{orders.length}</strong>
                    <small><b>↗</b> Transaksi terpantau</small>
                    <i><Clock size={16} /></i>
                  </article>
                  <article className="dash-stat">
                    <span>Total transaksi</span>
                    <strong>{formatPrice(stats.total_spent ?? 0)}</strong>
                    <small><b>↗</b> Nilai pembelian</small>
                    <i><ArrowUpRight size={16} /></i>
                  </article>
                  <article className="dash-stat accent-stat">
                    <span>Impact score</span>
                    <strong>{stats.impact_score ?? 0}</strong>
                    <small>Barang berputar kembali</small>
                    <i><Sparkles size={16} /></i>
                  </article>
                </div>

                <div className="dash-section-row">
                  <div>
                    <span className="eyebrow">Recent activity</span>
                    <h2>Aktivitas transaksi terbaru</h2>
                  </div>
                  <button className="text-link" onClick={() => setActiveTab('orders')}>
                    Lihat semua →
                  </button>
                </div>

                <div className="dash-table-card">
                  <div className="table-scroll">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>Produk</th>
                          <th>Status</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.length > 0 ? (
                          orders.map((o) => (
                            <tr key={o.id}>
                              <td>
                                <span className="table-product">
                                  <img
                                    src={o.produk_foto || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100'}
                                    alt=""
                                  />
                                  <span>
                                    <b>{o.produk_nama}</b>
                                    <small>#{o.order_number}</small>
                                  </span>
                                </span>
                              </td>
                              <td>
                                <span className={`status-pill ${o.status === 'completed' ? 'status-green' : 'status-orange'}`}>
                                  {o.status_display || o.status}
                                </span>
                              </td>
                              <td>
                                <b>{formatPrice(o.harga_bayar)}</b>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                              Belum ada transaksi pembelian. <Link to="/shop" style={{ color: 'var(--green)', fontWeight: 700 }}>Jelajahi etalase →</Link>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB: MY LISTINGS ───────────────────────────────── */}
            {activeTab === 'my-listings' && (
              <div className="dash-panel active">
                <div className="dash-section-row page-dash-heading">
                  <div>
                    <span className="eyebrow">Your marketplace inventory</span>
                    <h2>Barang saya</h2>
                    <p>Kelola semua barang yang kamu tawarkan di KampusLoop.</p>
                  </div>
                  {isSeller ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-outline"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => setShowSellerPayment(!showSellerPayment)}
                      >
                        <Settings size={14} strokeWidth={2.2} />
                        <span>Metode Pembayaran & COD</span>
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => setShowListingForm(!showListingForm)}
                      >
                        {showListingForm ? 'Tutup Formulir' : '+ Tambah barang'}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => setActiveTab('apply-seller')}
                    >
                      Ajukan Jadi Penjual ↗
                    </button>
                  )}
                </div>

                {!isSeller ? (
                  <div className="empty-state" style={{ padding: '48px 24px' }}>
                    <strong style={{ fontSize: '15px', display: 'block', marginBottom: '8px' }}>
                      Akun Anda saat ini berstatus User (Pembeli)
                    </strong>
                    <p style={{ margin: '0 auto 18px', maxWidth: '520px', color: 'var(--muted)', fontSize: '12px' }}>
                      Untuk menjaga keamanan transaksi dan mencegah penipuan, setiap mahasiswa yang ingin menjual barang wajib melengkapi validasi mahasiswa, KTM, bukti pendukung, dan menandatangani surat perjanjian penjual.
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() => setActiveTab('apply-seller')}
                    >
                      Lengkapi Berkas Pengajuan Penjual ↗
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Seller Payment Settings Panel */}
                    {showSellerPayment && (
                      <div className="listing-form-card show" style={{ marginBottom: '24px' }}>
                        <div className="dash-section-row">
                          <div>
                            <span className="eyebrow">Payment & COD settings</span>
                            <h2>Atur Metode Pembayaran & Lokasi COD Penjual</h2>
                          </div>
                          <button className="dash-icon-button" onClick={() => setShowSellerPayment(false)}>
                            ×
                          </button>
                        </div>

                        <form className="listing-form" onSubmit={handleSaveSellerPayment}>
                          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '6px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={sellerPayment.cod_enabled}
                                onChange={(e) => setSellerPayment({ ...sellerPayment, cod_enabled: e.target.checked })}
                              />
                              Aktifkan COD
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={sellerPayment.qris_enabled}
                                onChange={(e) => setSellerPayment({ ...sellerPayment, qris_enabled: e.target.checked })}
                              />
                              Aktifkan QRIS
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={sellerPayment.bank_enabled}
                                onChange={(e) => setSellerPayment({ ...sellerPayment, bank_enabled: e.target.checked })}
                              />
                              Aktifkan Transfer Bank
                            </label>
                          </div>

                          <CodLocationManager
                            label="Opsi Lokasi COD yang Didukung"
                            value={sellerPayment.cod_locations || ''}
                            onChange={(nextVal) => setSellerPayment({ ...sellerPayment, cod_locations: nextVal })}
                            helperText="Daftar lokasi COD ini akan muncul sebagai pilihan titik pertemuan saat pembeli melakukan checkout."
                          />

                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', marginBottom: '4px' }}>
                            <input
                              type="checkbox"
                              checked={applyCodToProducts}
                              onChange={(e) => setApplyCodToProducts(e.target.checked)}
                            />
                            <span>Terapkan opsi lokasi COD ini ke semua barang saya yang sudah terdaftar</span>
                          </label>

                          {sellerPayment.qris_enabled && (
                            <div className="form-row">
                              <div className="field">
                                <label>Nama Merchant QRIS</label>
                                <input
                                  placeholder="Contoh: Toko Mahasiswa Aril"
                                  value={sellerPayment.qris_label || ''}
                                  onChange={(e) => setSellerPayment({ ...sellerPayment, qris_label: e.target.value })}
                                />
                              </div>
                              <div className="field">
                                <label>Upload Gambar Kode QRIS</label>
                                <input type="file" accept="image/*" onChange={handleSellerQrisUpload} />
                                {uploadingQris && <small style={{ color: 'var(--muted)' }}>Mengunggah QRIS...</small>}
                                {sellerPayment.qris_image_url && (
                                  <small style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Check size={12} strokeWidth={2.4} /> QRIS terunggah (<a href={sellerPayment.qris_image_url} target="_blank" rel="noreferrer">Lihat</a>)
                                  </small>
                                )}
                              </div>
                            </div>
                          )}

                          {sellerPayment.bank_enabled && (
                            <div className="form-row">
                              <div className="field">
                                <label>Nama Bank</label>
                                <input
                                  placeholder="Contoh: BCA / BRI / BNI"
                                  value={sellerPayment.bank_name || ''}
                                  onChange={(e) => setSellerPayment({ ...sellerPayment, bank_name: e.target.value })}
                                />
                              </div>
                              <div className="field">
                                <label>Nomor Rekening</label>
                                <input
                                  placeholder="Contoh: 1234567890"
                                  value={sellerPayment.bank_account_number || ''}
                                  onChange={(e) => setSellerPayment({ ...sellerPayment, bank_account_number: e.target.value })}
                                />
                              </div>
                              <div className="field">
                                <label>Atas Nama Rekening</label>
                                <input
                                  placeholder="Nama pemilik rekening"
                                  value={sellerPayment.bank_account_name || ''}
                                  onChange={(e) => setSellerPayment({ ...sellerPayment, bank_account_name: e.target.value })}
                                />
                              </div>
                            </div>
                          )}

                          <button type="submit" className="btn btn-primary" style={{ width: 'max-content' }} disabled={savingSellerPayment || uploadingQris}>
                            {savingSellerPayment ? 'Menyimpan...' : 'Simpan Metode Pembayaran ↗'}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Add Listing Form */}
                    {showListingForm && (
                      <div className="listing-form-card show" style={{ marginBottom: '24px' }}>
                        <div className="dash-section-row">
                          <div>
                            <span className="eyebrow">Create a listing</span>
                            <h2>Tambah barang baru</h2>
                          </div>
                          <button
                            className="dash-icon-button"
                            onClick={() => setShowListingForm(false)}
                          >
                            ×
                          </button>
                        </div>

                        <form className="listing-form" onSubmit={handleCreateListing}>
                          <div className="form-row">
                            <div className="field">
                              <label htmlFor="listingName">Nama barang</label>
                              <input
                                id="listingName"
                                required
                                placeholder="Contoh: Kalkulator Casio FX-991EX"
                                value={newListing.nama}
                                onChange={(e) => setNewListing({ ...newListing, nama: e.target.value })}
                              />
                            </div>
                            <div className="field">
                              <label htmlFor="listingCat">Kategori</label>
                              <select
                                id="listingCat"
                                value={newListing.kategori}
                                onChange={(e) => setNewListing({ ...newListing, kategori: e.target.value })}
                              >
                                <option>Buku & Akademik</option>
                                <option>Elektronik</option>
                                <option>Fashion</option>
                                <option>Kos & Living</option>
                                <option>Hobi & Organisasi</option>
                                <option>Lainnya</option>
                              </select>
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="field">
                              <label htmlFor="listingPrice">Harga jual (Rp)</label>
                              <input
                                id="listingPrice"
                                type="number"
                                min="1000"
                                required
                                placeholder="85000"
                                value={newListing.harga}
                                onChange={(e) => setNewListing({ ...newListing, harga: e.target.value })}
                              />
                            </div>
                            <div className="field">
                              <label htmlFor="listingOldPrice">Harga asli (Rp, opsional)</label>
                              <input
                                id="listingOldPrice"
                                type="number"
                                min="0"
                                placeholder="150000"
                                value={newListing.harga_asli}
                                onChange={(e) => setNewListing({ ...newListing, harga_asli: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="field">
                              <label htmlFor="listingCond">Kondisi</label>
                              <select
                                id="listingCond"
                                value={newListing.kondisi}
                                onChange={(e) => setNewListing({ ...newListing, kondisi: e.target.value })}
                              >
                                <option>Like New</option>
                                <option>Good</option>
                                <option>Fair</option>
                              </select>
                            </div>
                            <div className="field">
                              <label htmlFor="listingStok">Jumlah Stok (Quantity)</label>
                              <input
                                id="listingStok"
                                type="number"
                                min="0"
                                required
                                placeholder="1"
                                value={newListing.stok ?? 1}
                                onChange={(e) => setNewListing({ ...newListing, stok: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                              />
                              <small style={{ fontSize: '11px', color: 'var(--muted)' }}>
                                Jika stok 0, otomatis diberi label "Habis" tanpa menghapus produk.
                              </small>
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="field">
                              <label htmlFor="listingLocation">Lokasi / Kampus</label>
                              <input
                                id="listingLocation"
                                placeholder="Contoh: Makassar"
                                value={newListing.lokasi}
                                onChange={(e) => setNewListing({ ...newListing, lokasi: e.target.value })}
                              />
                            </div>
                          </div>

                          <CodLocationManager
                            label="Opsi Titik Lokasi COD Barang Ini"
                            value={newListing.cod_lokasi || ''}
                            onChange={(nextVal) => setNewListing({ ...newListing, cod_lokasi: nextVal })}
                            helperText="Kosongkan jika ingin memakai pengaturan Lokasi COD di Metode Pembayaran & COD."
                          />

                          <div className="form-row">
                            <div className="field">
                              <label htmlFor="listingPhotoUpload">Upload Foto Barang</label>
                              <input
                                id="listingPhotoUpload"
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleListingPhotoUpload(e, false)}
                              />
                              {uploadingListingPhoto && <small style={{ color: 'var(--muted)' }}>Mengunggah gambar...</small>}
                            </div>
                            <div className="field">
                              <label htmlFor="listingPhoto">Atau URL Foto Barang</label>
                              <input
                                id="listingPhoto"
                                type="text"
                                placeholder="https://..."
                                value={newListing.foto_url}
                                onChange={(e) => setNewListing({ ...newListing, foto_url: e.target.value })}
                              />
                            </div>
                          </div>

                          {newListing.foto_url && (
                            <div style={{ marginBottom: '12px' }}>
                              <img
                                src={newListing.foto_url}
                                alt="Preview"
                                style={{ width: '110px', height: '110px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--line)' }}
                              />
                            </div>
                          )}

                          <div className="field">
                            <label htmlFor="listingDesc">Deskripsi detail barang</label>
                            <textarea
                              id="listingDesc"
                              required
                              placeholder="Jelaskan kondisi fisik, kelengkapan, dan waktu pemakaian..."
                              value={newListing.deskripsi}
                              onChange={(e) => setNewListing({ ...newListing, deskripsi: e.target.value })}
                            />
                          </div>

                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submittingListing || uploadingListingPhoto}
                          >
                            {submittingListing ? 'Mengunggah...' : 'Publikasikan barang ↗'}
                          </button>
                        </form>
                      </div>
                    )}

                    <div className="listing-toolbar">
                      <div className="dash-search">
                        <span><Search size={14} /></span>
                        <input
                          placeholder="Cari barang saya..."
                          value={searchListing}
                          onChange={(e) => setSearchListing(e.target.value)}
                        />
                      </div>
                      <span>{filteredListings.length} barang terdaftar</span>
                    </div>

                    <div className="my-listing-grid">
                      {filteredListings.length > 0 ? (
                        filteredListings.map((item) => (
                          <article key={item.id} className="my-listing-card">
                            <img
                              src={
                                item.foto_display ||
                                item.foto_url ||
                                item.img ||
                                'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'
                              }
                              alt={item.nama}
                            />
                            <div className="my-listing-body">
                              <h3>{item.nama}</h3>
                              <p>
                                {item.kategori} · {item.kondisi} ·{' '}
                                <span
                                  className={`status-pill ${
                                    item.status === 'approved' && (item.stok ?? 1) > 0
                                      ? 'status-green'
                                      : item.status === 'sold' || (item.stok ?? 1) === 0
                                        ? 'status-red'
                                        : item.status === 'rejected'
                                          ? 'status-red'
                                          : 'status-orange'
                                  }`}
                                >
                                  {item.status === 'sold' || (item.stok ?? 1) === 0
                                    ? 'Habis / Sold'
                                    : item.status === 'approved'
                                      ? 'Aktif'
                                      : item.status === 'rejected'
                                        ? 'Ditolak'
                                        : 'Menunggu review'}
                                </span>
                              </p>
                              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>Stok: <b style={{ color: (item.stok ?? 1) === 0 ? 'var(--red, #ef4444)' : 'var(--text)' }}>{item.stok ?? 1} unit</b></span>
                              </div>
                              <div className="my-listing-foot">
                                <strong>{formatPrice(item.harga)}</strong>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button
                                    style={{ color: 'var(--green)' }}
                                    onClick={() => setEditingListing({ ...item })}
                                  >
                                    Edit
                                  </button>
                                  <button onClick={() => handleDeleteListing(item.id)}>Hapus</button>
                                </div>
                              </div>
                            </div>
                          </article>
                        ))
                      ) : (
                        <div
                          className="empty-state"
                          style={{ gridColumn: '1 / -1', padding: '45px 20px' }}
                        >
                          <p>Belum ada barang yang kamu daftarkan.</p>
                          <button
                            className="btn btn-primary"
                            onClick={() => setShowListingForm(true)}
                            style={{ marginTop: '10px' }}
                          >
                            + Tambah barang sekarang
                          </button>
                        </div>
                      )}
                    </div>

                    {sellerOrders.length > 0 && (
                      <div style={{ marginTop: '28px' }}>
                        <div className="dash-section-row">
                          <div>
                            <span className="eyebrow">Incoming orders</span>
                            <h2>Pesanan masuk untuk barangmu ({sellerOrders.length})</h2>
                          </div>
                        </div>
                        <div className="dash-table-card">
                          <div className="table-scroll">
                            <table className="dash-table">
                              <thead>
                                <tr>
                                  <th>ID &amp; Tanggal</th>
                                  <th>Pembeli</th>
                                  <th>Produk</th>
                                  <th>Rincian Biaya</th>
                                  <th>Pendapatan Bersih</th>
                                  <th>Pembayaran &amp; Fee COD</th>
                                  <th>Status Pengiriman</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sellerOrders.map((o) => {
                                  const isCod = o.delivery_type === 'cod' || (o.payment_method || '').toUpperCase() === 'COD';
                                  return (
                                    <tr key={o.id}>
                                      <td>
                                        <b>#{o.order_number}</b>
                                        <small style={{ display: 'block', color: 'var(--muted)', fontSize: '10px' }}>
                                          {o.tanggal_pesan ? new Date(o.tanggal_pesan).toLocaleDateString('id-ID') : '-'}
                                        </small>
                                      </td>
                                      <td>
                                        <div style={{ fontWeight: 600 }}>{o.pembeli_nama || 'Mahasiswa'}</div>
                                        <small style={{ color: 'var(--muted)', fontSize: '11px' }}>
                                          {isCod ? `Titik COD: ${o.cod_location || 'Kampus'}` : `Kirim: ${o.shipping_address || 'Alamat'}`}
                                        </small>
                                      </td>
                                      <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          {o.produk_foto && (
                                            <img
                                              src={o.produk_foto}
                                              alt=""
                                              style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }}
                                            />
                                          )}
                                          <span>{o.produk_nama}</span>
                                        </div>
                                      </td>
                                      <td>
                                        <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                                          <div>Subtotal: {formatPrice(o.subtotal_produk ?? o.harga_bayar)}</div>
                                          <div style={{ color: 'var(--muted)' }}>Biaya Layanan 2%: {formatPrice(o.service_fee || 0)}</div>
                                          <div style={{ color: 'var(--muted)' }}>Ongkir ({o.distance_km || 0} km): {formatPrice(o.shipping_cost || 0)}</div>
                                          <div style={{ fontWeight: 600, marginTop: '2px' }}>Total Tagihan: {formatPrice(o.harga_bayar)}</div>
                                        </div>
                                      </td>
                                      <td>
                                        <strong style={{ color: 'var(--green)', fontSize: '13px' }}>
                                          {formatPrice(o.net_seller_revenue || o.subtotal_produk || o.harga_bayar)}
                                        </strong>
                                        <small style={{ display: 'block', fontSize: '10px', color: 'var(--muted)' }}>
                                          (Subtotal produk)
                                        </small>
                                      </td>
                                      <td>
                                        <span className={`status-pill ${o.payment_status === 'paid' ? 'status-green' : 'status-orange'}`}>
                                          {o.payment_status_display || (o.payment_status === 'paid' ? 'LUNAS' : 'Menunggu Bayar')}
                                        </span>
                                        {isCod && (
                                          <div style={{ marginTop: '5px', fontSize: '10px', color: o.cod_fee_status === 'paid' ? 'var(--green)' : '#d97706' }}>
                                            Tagihan Fee 2%: {formatPrice(o.cod_fee_amount || o.service_fee || 0)}
                                            <br />
                                            <b>({o.cod_fee_status === 'paid' ? 'Sudah Disetor' : 'Belum Disetor'})</b>
                                          </div>
                                        )}
                                      </td>
                                      <td>
                                        <select
                                          value={o.shipping_status || 'pending'}
                                          disabled={updatingShippingId === o.id || o.shipping_status === 'delivered' || o.shipping_status === 'cancelled'}
                                          onChange={(e) => handleSellerUpdateShipping(o.id, e.target.value)}
                                          style={{
                                            fontSize: '11px',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--line)',
                                            background: 'var(--card-bg)',
                                            color: 'var(--text)',
                                            cursor: 'pointer',
                                          }}
                                        >
                                          <option value="pending">Menunggu Diproses</option>
                                          <option value="processing">Sedang Dipersiapkan</option>
                                          <option value="shipped">Sedang Dikirim</option>
                                          <option value="delivered">Terkirim / Selesai</option>
                                          <option value="cancelled">Dibatalkan</option>
                                        </select>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ─── TAB: ORDERS ────────────────────────────────────── */}
            {activeTab === 'orders' && (
              <div className="dash-panel active">
                <div className="dash-section-row page-dash-heading">
                  <div>
                    <span className="eyebrow">Purchase history</span>
                    <h2>Pesanan saya</h2>
                    <p>Pantau riwayat transaksi, instruksi pembayaran Midtrans, dan status pengiriman produkmu.</p>
                  </div>
                </div>

                <div className="order-cards">
                  {orders.length > 0 ? (
                    orders.map((o) => {
                      const isUnpaid = o.payment_status === 'unpaid' || o.status === 'pending';
                      const isDigitalPayment = (o.payment_method || '').toUpperCase() !== 'COD';
                      const canCancel = o.status === 'pending' || o.payment_status === 'unpaid';

                      return (
                        <article key={o.id} className="order-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div className="order-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              {/* Status Pembayaran */}
                              <span
                                className={`status-pill ${
                                  o.payment_status === 'paid'
                                    ? 'status-green'
                                    : o.payment_status === 'cancelled'
                                      ? 'status-red'
                                      : 'status-orange'
                                }`}
                              >
                                {o.payment_status === 'paid' ? 'LUNAS' : o.payment_status === 'cancelled' ? 'Batal' : 'Menunggu Bayar'}
                              </span>

                              {/* Status Pengiriman */}
                              <span
                                className={`status-pill ${
                                  o.shipping_status === 'delivered'
                                    ? 'status-green'
                                    : o.shipping_status === 'shipped'
                                      ? 'status-blue'
                                      : o.shipping_status === 'cancelled'
                                        ? 'status-red'
                                        : 'status-orange'
                                }`}
                              >
                                {o.shipping_status_display || (o.shipping_status === 'delivered' ? 'Sampai / Selesai' : o.shipping_status === 'shipped' ? 'Sedang Dikirim' : o.shipping_status === 'cancelled' ? 'Dibatalkan' : 'Diproses Penjual')}
                              </span>
                            </div>
                            <small style={{ fontWeight: 600 }}>#{o.order_number}</small>
                          </div>

                          <div className="table-product">
                            <img
                              src={
                                o.produk_foto ||
                                'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=120'
                              }
                              alt=""
                            />
                            <span>
                              <b>{o.produk_nama}</b>
                              <small>
                                Penjual: {o.seller_nama || 'KampusLoop'} ·{' '}
                                {(o.payment_method || 'COD').toUpperCase()} ·{' '}
                                {o.delivery_type === 'delivery' || o.delivery_type === 'antar'
                                  ? `Pengiriman Jarak (${o.distance_km || 0} km)`
                                  : 'COD Kampus'}
                              </small>
                              {(o.cod_location || o.shipping_address) && (
                                <small style={{ display: 'block', marginTop: '2px', color: 'var(--muted)' }}>
                                  {o.delivery_type === 'delivery' || o.delivery_type === 'antar'
                                    ? `Alamat: ${o.shipping_address}${o.kode_pos ? ` (${o.kode_pos})` : ''}`
                                    : `Titik Temu COD: ${o.cod_location}`}
                                </small>
                              )}
                              {o.catatan && (
                                <small style={{ display: 'block', marginTop: '2px', color: 'var(--muted)', fontStyle: 'italic' }}>
                                  Catatan: "{o.catatan}"
                                </small>
                              )}
                            </span>
                          </div>

                          {/* Breakdown bar */}
                          <div style={{ background: 'var(--section-bg, #f8fafc)', padding: '10px 14px', borderRadius: '10px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                              <span>Subtotal Produk</span>
                              <span>{formatPrice(o.subtotal_produk || o.harga_bayar)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                              <span>Biaya Layanan Platform (2%)</span>
                              <span>{formatPrice(o.service_fee || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                              <span>Ongkir ({o.distance_km || 0} km - {o.shipping_courier || 'Kurir'})</span>
                              <span>{formatPrice(o.shipping_cost || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '13px', borderTop: '1px solid var(--line)', paddingTop: '6px', marginTop: '2px' }}>
                              <span>Total Pembayaran</span>
                              <span style={{ color: 'var(--green)' }}>{formatPrice(o.harga_bayar || o.total_bayar)}</span>
                            </div>
                          </div>

                          <div className="order-card-bottom" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {canCancel && (
                              <button
                                className="btn btn-outline"
                                style={{ color: '#ef4444', borderColor: '#ef4444', padding: '6px 12px', fontSize: '11px' }}
                                onClick={() => handleCancelOrder(o.id)}
                              >
                                Batalkan
                              </button>
                            )}

                            {isUnpaid && isDigitalPayment && (
                              <button
                                className="btn btn-primary"
                                style={{ padding: '6px 14px', fontSize: '11px', background: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => setPayingOrder(o)}
                              >
                                <CreditCard size={13} />
                                Bayar Sekarang (Midtrans) ↗
                              </button>
                            )}

                            <button
                              className="btn btn-outline"
                              style={{ padding: '6px 12px', fontSize: '11px' }}
                              onClick={() => setDetailModalOrder(o)}
                            >
                              Detail Pesanan
                            </button>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '55px 20px' }}>
                      <p style={{ margin: '0 0 14px', color: 'var(--muted)' }}>
                        Kamu belum memiliki pesanan. Jelajahi etalase untuk mulai bertransaksi!
                      </p>
                      <Link to="/shop" className="btn btn-primary">
                        Buka E-commerce ↗
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── TAB: WISHLIST ──────────────────────────────────── */}
            {activeTab === 'wishlist' && (
              <div className="dash-panel active">
                <div className="dash-section-row page-dash-heading">
                  <div>
                    <span className="eyebrow">Saved for later</span>
                    <h2>Wishlist saya</h2>
                    <p>Barang yang kamu simpan untuk dilihat kembali.</p>
                  </div>
                  <Link to="/shop" className="text-link">
                    Jelajahi produk →
                  </Link>
                </div>

                {wishlistItems.length > 0 ? (
                  <div className="my-listing-grid">
                    {wishlistItems.map((w) => (
                      <article key={w.id} className="my-listing-card">
                        <img
                          src={
                            w.produk_foto ||
                            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
                          }
                          alt={w.produk_nama}
                        />
                        <div className="my-listing-body">
                          <h3>{w.produk_nama}</h3>
                          <p>{w.produk_kategori} · {w.produk_kondisi}</p>
                          <div className="my-listing-foot">
                            <strong>{formatPrice(w.produk_harga)}</strong>
                            <Link to="/shop" className="btn btn-outline" style={{ fontSize: '9px', padding: '6px 10px' }}>
                              Lihat barang
                            </Link>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: '65px 20px' }}>
                    <p style={{ margin: '0 0 15px', color: 'var(--muted)' }}>
                      Belum ada barang di wishlist. Simpan barang favoritmu dari etalase!
                    </p>
                    <Link to="/shop" className="btn btn-primary">
                      Buka E-commerce ↗
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB: AJUKAN PENJUAL ────────────────────────────── */}
            {activeTab === 'apply-seller' && (
              <div className="dash-panel active">
                <div className="dash-section-row page-dash-heading">
                  <div>
                    <span className="eyebrow">Seller verification & agreement</span>
                    <h2>Ajukan Menjadi Penjual</h2>
                    <p>Lengkapi berkas validasi mahasiswa dan tandatangani surat perjanjian untuk mencegah penipuan.</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleDownloadAgreement}
                  >
                    ↓ Download Format Surat Perjanjian
                  </button>
                </div>

                {/* Status Banner */}
                <div className="listing-form-card show" style={{ marginTop: 0, marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <span className="eyebrow">Status Verifikasi Penjual</span>
                      <h3 style={{ margin: '4px 0', fontSize: '16px' }}>
                        {user.role === 'seller'
                          ? 'Akun Anda sudah aktif sebagai Penjual Terverifikasi!'
                          : user.status_pengajuan_penjual === 'pending'
                            ? 'Pengajuan Anda sedang ditinjau oleh Admin Web'
                            : user.status_pengajuan_penjual === 'rejected'
                              ? 'Pengajuan sebelumnya ditolak — silakan perbaiki dan ajukan ulang'
                              : 'Belum mengajukan sebagai Penjual'}
                      </h3>
                      {user.catatan_admin_penjual && (
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--muted)' }}>
                          Catatan Admin: {user.catatan_admin_penjual}
                        </p>
                      )}
                    </div>
                    <span
                      className={`status-pill ${
                        user.role === 'seller'
                          ? 'status-green'
                          : user.status_pengajuan_penjual === 'pending'
                            ? 'status-orange'
                            : ''
                      }`}
                      style={
                        user.role === 'seller' || user.status_pengajuan_penjual === 'pending'
                          ? { display: 'inline-flex', alignItems: 'center', gap: '5px' }
                          : user.status_pengajuan_penjual === 'rejected'
                            ? { background: '#fee2e2', color: '#991b1b', display: 'inline-flex', alignItems: 'center', gap: '5px' }
                            : { background: '#eef3ef', color: 'var(--muted)' }
                      }
                    >
                      {user.role === 'seller' ? (
                        <>
                          <Check size={12} strokeWidth={2.5} />
                          <span>Penjual Aktif</span>
                        </>
                      ) : user.status_pengajuan_penjual === 'pending' ? (
                        <>
                          <Clock size={12} strokeWidth={2.2} />
                          <span>Menunggu Validasi Admin</span>
                        </>
                      ) : user.status_pengajuan_penjual === 'rejected' ? (
                        <>
                          <X size={12} strokeWidth={2.4} />
                          <span>Ditolak</span>
                        </>
                      ) : (
                        'Belum Mengajukan'
                      )}
                    </span>
                  </div>

                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--line)', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <small style={{ color: 'var(--muted)', maxWidth: '620px' }}>
                      {agreementTemplate.catatan || 'Unduh format surat perjanjian, lengkapi dan tandatangani, lalu unggah kembali bersama KTM dan bukti mahasiswa lainnya.'}
                    </small>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setShowAgreementPreview(!showAgreementPreview)}
                    >
                      {showAgreementPreview ? 'Tutup preview surat' : 'Lihat isi surat perjanjian →'}
                    </button>
                  </div>

                  {showAgreementPreview && (
                    <div style={{ marginTop: '14px', padding: '16px', background: '#f8faf8', border: '1px solid var(--line)', borderRadius: '12px' }}>
                      <strong style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
                        {agreementTemplate.judul}
                      </strong>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '11px', color: '#334', lineHeight: 1.6 }}>
                        {agreementTemplate.isi}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Form pengajuan jika belum seller & tidak sedang pending */}
                {user.role !== 'seller' && user.status_pengajuan_penjual !== 'pending' && (
                  <div className="listing-form-card show">
                    <div className="dash-section-row">
                      <div>
                        <span className="eyebrow">Student verification form</span>
                        <h2>Formulir Berkas Mahasiswa & Surat Perjanjian</h2>
                      </div>
                    </div>

                    <form className="listing-form" onSubmit={handleSubmitSellerApplication}>
                      <div className="form-row">
                        <div className="field">
                          <label>Nama Lengkap (Sesuai KTM)</label>
                          <input
                            required
                            value={sellerForm.nama}
                            onChange={(e) => setSellerForm({ ...sellerForm, nama: e.target.value })}
                            placeholder="Nama lengkap sesuai KTM"
                          />
                        </div>
                        <div className="field">
                          <label>NIM (Nomor Induk Mahasiswa)</label>
                          <input
                            required
                            value={sellerForm.nim}
                            onChange={(e) => setSellerForm({ ...sellerForm, nim: e.target.value })}
                            placeholder="Contoh: 210209501"
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="field">
                          <label>Universitas / Kampus</label>
                          <input
                            required
                            value={sellerForm.kampus}
                            onChange={(e) => setSellerForm({ ...sellerForm, kampus: e.target.value })}
                            placeholder="Contoh: Universitas Negeri Makassar"
                          />
                        </div>
                        <div className="field">
                          <label>Fakultas / Program Studi</label>
                          <input
                            required
                            value={sellerForm.fakultas_prodi}
                            onChange={(e) => setSellerForm({ ...sellerForm, fakultas_prodi: e.target.value })}
                            placeholder="Contoh: Teknik Informatika"
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="field">
                          <label>Angkatan / Tahun Masuk</label>
                          <input
                            value={sellerForm.angkatan}
                            onChange={(e) => setSellerForm({ ...sellerForm, angkatan: e.target.value })}
                            placeholder="Contoh: 2023"
                          />
                        </div>
                        <div className="field">
                          <label>No. WhatsApp / Telepon Aktif</label>
                          <input
                            required
                            value={sellerForm.telp}
                            onChange={(e) => setSellerForm({ ...sellerForm, telp: e.target.value })}
                            placeholder="0812xxxxxxxx"
                          />
                        </div>
                      </div>

                      <div className="field">
                        <label>Alamat Kos / Tempat Tinggal</label>
                        <input
                          required
                          value={sellerForm.alamat}
                          onChange={(e) => setSellerForm({ ...sellerForm, alamat: e.target.value })}
                          placeholder="Alamat lengkap sekitar kampus"
                        />
                      </div>

                      <div className="form-row">
                        <div className="field">
                          <label>Upload Foto KTM (Wajib)</label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleDocUpload(e, 'ktm', 'ktm_url')}
                          />
                          {uploadingDoc.ktm && <small style={{ color: 'var(--muted)' }}>Mengunggah KTM...</small>}
                          {sellerForm.ktm_url && (
                            <small style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                              <Check size={12} strokeWidth={2.4} /> KTM terunggah (<a href={sellerForm.ktm_url} target="_blank" rel="noreferrer">Lihat berkas</a>)
                            </small>
                          )}
                        </div>
                        <div className="field">
                          <label>Upload Bukti Mahasiswa Lainnya (KRS / Surat Aktif / Selfie KTM)</label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleDocUpload(e, 'bukti', 'bukti_lain_url')}
                          />
                          {uploadingDoc.bukti && <small style={{ color: 'var(--muted)' }}>Mengunggah bukti...</small>}
                          {sellerForm.bukti_lain_url && (
                            <small style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                              <Check size={12} strokeWidth={2.4} /> Bukti terunggah (<a href={sellerForm.bukti_lain_url} target="_blank" rel="noreferrer">Lihat berkas</a>)
                            </small>
                          )}
                        </div>
                      </div>

                      <div className="field">
                        <label>Upload Surat Perjanjian yang Sudah Ditandatangani (Wajib)</label>
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={(e) => handleDocUpload(e, 'surat', 'surat_perjanjian_url')}
                        />
                        {uploadingDoc.surat && <small style={{ color: 'var(--muted)' }}>Mengunggah surat perjanjian...</small>}
                        {sellerForm.surat_perjanjian_url && (
                          <small style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                            <Check size={12} strokeWidth={2.4} /> Surat perjanjian terunggah (<a href={sellerForm.surat_perjanjian_url} target="_blank" rel="noreferrer">Lihat berkas</a>)
                          </small>
                        )}
                      </div>

                      <div className="field">
                        <label>Keterangan / Jenis Barang yang Ingin Dijual</label>
                        <textarea
                          rows={3}
                          value={sellerForm.alasan}
                          onChange={(e) => setSellerForm({ ...sellerForm, alasan: e.target.value })}
                          placeholder="Contoh: Menjual buku kuliah semester lalu, perlengkapan kos, dan elektronik pribadi."
                        />
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer', marginBottom: '12px' }}>
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                        />
                        <span>
                          Saya menyatakan seluruh berkas mahasiswa adalah asli dan saya menyetujui serta menandatangani Surat Perjanjian Penjual KampusLoop untuk mencegah penipuan.
                        </span>
                      </label>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submittingSeller || uploadingDoc.ktm || uploadingDoc.bukti || uploadingDoc.surat}
                      >
                        {submittingSeller ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Penjual ↗'}
                      </button>
                    </form>
                  </div>
                )}

                {user.role === 'seller' && (
                  <div className="empty-state" style={{ padding: '40px 24px' }}>
                    <strong style={{ fontSize: '15px', display: 'block', marginBottom: '8px' }}>
                      Akun Penjual Anda sudah aktif
                    </strong>
                    <p style={{ margin: '0 auto 14px', color: 'var(--muted)', fontSize: '12px' }}>
                      Anda kini dapat mengunggah dan mengelola barang jualan melalui tab Barang Saya.
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() => setActiveTab('my-listings')}
                    >
                      Kelola Barang Saya ↗
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB: PROFILE ───────────────────────────────────── */}
            {activeTab === 'profile' && (
              <div className="dash-panel active">
                <div className="dash-section-row page-dash-heading">
                  <div>
                    <span className="eyebrow">Personal information</span>
                    <h2>Profil saya</h2>
                    <p>Informasi identitas akun, status peran, dan kampusmu.</p>
                  </div>
                </div>

                <div className="profile-settings-card">
                  <div className="profile-settings-head">
                    <div className="profile-initial big">{initial}</div>
                    <div>
                      <h3>{user.nama || user.name}</h3>
                      <p>{user.email}</p>
                      <span className="verified-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} strokeWidth={2.4} />
                        {user.role === 'admin'
                          ? 'Admin Web'
                          : user.role === 'seller'
                            ? 'Penjual Terverifikasi'
                            : 'User Terdaftar'}
                      </span>
                    </div>
                  </div>

                  <div className="profile-data-grid">
                    <div>
                      <small>Nama lengkap</small>
                      <strong>{user.nama || user.name}</strong>
                    </div>
                    <div>
                      <small>Email</small>
                      <strong>{user.email}</strong>
                    </div>
                    <div>
                      <small>Universitas / Kampus</small>
                      <strong>{profileData.kampus || user.campus || '-'}</strong>
                    </div>
                    <div>
                      <small>Nomor WhatsApp / Telp</small>
                      <strong>{profileData.telp || user.telp || '-'}</strong>
                    </div>
                    <div>
                      <small>Jenis Kelamin</small>
                      <strong>{profileData.gender || user.gender || '-'}</strong>
                    </div>
                    <div>
                      <small>NIM</small>
                      <strong>{profileData.nim || user.nim || '-'}</strong>
                    </div>
                    <div>
                      <small>Fakultas / Program Studi</small>
                      <strong>{profileData.fakultas_prodi || user.fakultas_prodi || '-'}</strong>
                    </div>
                    <div>
                      <small>Alamat Utama</small>
                      <strong>{profileData.alamat || user.alamat || '-'}</strong>
                    </div>
                    <div>
                      <small>Wilayah & Kode Pos</small>
                      <strong>
                        {[profileData.kecamatan, profileData.kota_kabupaten, profileData.provinsi]
                          .filter(Boolean)
                          .join(', ') || '-'}
                        {profileData.kode_pos ? ` (${profileData.kode_pos})` : ''}
                      </strong>
                    </div>
                    <div>
                      <small>Detail Alamat / Patokan</small>
                      <strong>{profileData.detail_alamat || user.detail_alamat || '-'}</strong>
                    </div>
                    <div>
                      <small>Bio Singkat</small>
                      <strong>{profileData.bio || user.bio || '-'}</strong>
                    </div>
                  </div>

                  <button
                    className="btn btn-outline"
                    onClick={() => setEditingProfile(!editingProfile)}
                  >
                    {editingProfile ? 'Batal Edit' : 'Edit profil'}
                  </button>

                  {editingProfile && (
                    <form
                      onSubmit={handleUpdateProfile}
                      style={{ marginTop: '24px', display: 'grid', gap: '12px' }}
                    >
                      <div className="form-row">
                        <div className="field">
                          <label>Nama Lengkap</label>
                          <input
                            value={profileData.nama}
                            onChange={(e) =>
                              setProfileData({ ...profileData, nama: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="field">
                          <label>Email</label>
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) =>
                              setProfileData({ ...profileData, email: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="field">
                          <label>Universitas / Kampus</label>
                          <input
                            value={profileData.kampus}
                            onChange={(e) =>
                              setProfileData({ ...profileData, kampus: e.target.value })
                            }
                          />
                        </div>
                        <div className="field">
                          <label>Nomor Telepon / WA</label>
                          <input
                            value={profileData.telp}
                            onChange={(e) =>
                              setProfileData({ ...profileData, telp: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="field">
                          <label>NIM (Nomor Induk Mahasiswa)</label>
                          <input
                            value={profileData.nim}
                            placeholder="Contoh: 210209501"
                            onChange={(e) =>
                              setProfileData({ ...profileData, nim: e.target.value })
                            }
                          />
                        </div>
                        <div className="field">
                          <label>Fakultas / Program Studi</label>
                          <input
                            value={profileData.fakultas_prodi}
                            placeholder="Contoh: Teknik Informatika"
                            onChange={(e) =>
                              setProfileData({ ...profileData, fakultas_prodi: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="field">
                          <label>Jenis Kelamin</label>
                          <select
                            value={profileData.gender}
                            onChange={(e) =>
                              setProfileData({ ...profileData, gender: e.target.value })
                            }
                          >
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                          </select>
                        </div>
                        <div className="field">
                          <label>Kode Pos</label>
                          <input
                            value={profileData.kode_pos}
                            placeholder="Contoh: 90222"
                            onChange={(e) =>
                              setProfileData({ ...profileData, kode_pos: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="field" style={{ background: '#f8fbf8', border: '1px solid var(--line)', borderRadius: '14px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                          <label style={{ margin: 0 }}>Alamat Pengiriman Lengkap (Shopee Style)</label>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ fontSize: '10px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={handleDetectProfileGPS}
                            disabled={locatingProfileGps}
                          >
                            <MapPin size={12} strokeWidth={2.2} />
                            <span>{locatingProfileGps ? 'Mendeteksi GPS...' : 'Gunakan Lokasi Terkini'}</span>
                          </button>
                        </div>
                        <div className="form-row">
                          <div className="field">
                            <label>Provinsi</label>
                            <input
                              placeholder="Contoh: Sulawesi Selatan"
                              value={profileData.provinsi}
                              onChange={(e) =>
                                setProfileData({ ...profileData, provinsi: e.target.value })
                              }
                            />
                          </div>
                          <div className="field">
                            <label>Kota / Kabupaten</label>
                            <input
                              placeholder="Contoh: Kota Makassar"
                              value={profileData.kota_kabupaten}
                              onChange={(e) =>
                                setProfileData({ ...profileData, kota_kabupaten: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="field">
                            <label>Kecamatan / Kelurahan</label>
                            <input
                              placeholder="Contoh: Rappocini"
                              value={profileData.kecamatan}
                              onChange={(e) =>
                                setProfileData({ ...profileData, kecamatan: e.target.value })
                              }
                            />
                          </div>
                          <div className="field">
                            <label>Nama Jalan, Gedung, No. Rumah / Kos</label>
                            <input
                              placeholder="Contoh: Jl. Andi Djemma No. 12, Kos Pondok Hijau"
                              value={profileData.alamat}
                              onChange={(e) =>
                                setProfileData({ ...profileData, alamat: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <div className="field" style={{ marginBottom: 0 }}>
                          <label>Detail Lainnya (Blok, Lantai, Warna Pagar, Patokan)</label>
                          <input
                            placeholder="Contoh: Samping warung, pagar hitam lantai 2 kamar 4"
                            value={profileData.detail_alamat}
                            onChange={(e) =>
                              setProfileData({ ...profileData, detail_alamat: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="field">
                        <label>Bio Singkat</label>
                        <textarea
                          value={profileData.bio}
                          onChange={(e) =>
                            setProfileData({ ...profileData, bio: e.target.value })
                          }
                        />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ width: 'max-content' }}>
                        Simpan Perubahan ↗
                      </button>
                    </form>
                  )}

                  {/* Level Akun & Status Penjual */}
                  <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <span className="eyebrow">Level & Peran Akun</span>
                        <h3 style={{ fontSize: '15px', margin: '4px 0' }}>{roleLabel}</h3>
                        <p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0 }}>
                          {user.role === 'seller'
                            ? 'Anda terdaftar sebagai Penjual Terverifikasi dan dapat menjual serta membeli barang di KampusLoop.'
                            : 'Sebagai user, Anda dapat berbelanja setelah login. Untuk mulai menjual barang, ajukan verifikasi menjadi Penjual.'}
                        </p>
                      </div>
                      <div>
                        {user.role === 'seller' ? (
                          <span className="status-pill status-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={12} strokeWidth={2.4} />
                            <span>Penjual Terverifikasi</span>
                          </span>
                        ) : (
                          <button
                            className="btn btn-outline"
                            style={{ fontSize: '10px', padding: '6px 12px' }}
                            onClick={() => setActiveTab('apply-seller')}
                          >
                            {user.status_pengajuan_penjual === 'pending'
                              ? 'Lihat Status Pengajuan Penjual'
                              : 'Ajukan Menjadi Penjual ↗'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL: EDIT LISTING (SELLER) ──────────────────────────── */}
      {editingListing && (
        <div
          className="overlay show"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingListing(null)
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal" style={{ maxWidth: '620px', padding: '24px' }}>
            <button className="modal-close" onClick={() => setEditingListing(null)} aria-label="Tutup">
              ×
            </button>
            <span className="eyebrow">Edit Barang</span>
            <h2 style={{ marginBottom: '16px' }}>{editingListing.nama}</h2>
            <form className="listing-form" onSubmit={handleSaveEditListing}>
              <div className="form-row">
                <div className="field">
                  <label>Nama barang</label>
                  <input
                    required
                    value={editingListing.nama || ''}
                    onChange={(e) => setEditingListing({ ...editingListing, nama: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Kategori</label>
                  <select
                    value={editingListing.kategori || 'Buku & Akademik'}
                    onChange={(e) => setEditingListing({ ...editingListing, kategori: e.target.value })}
                  >
                    <option>Buku & Akademik</option>
                    <option>Elektronik</option>
                    <option>Fashion</option>
                    <option>Kos & Living</option>
                    <option>Hobi & Organisasi</option>
                    <option>Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>Harga (Rp)</label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={editingListing.harga || ''}
                    onChange={(e) => setEditingListing({ ...editingListing, harga: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Harga asli (Rp, opsional)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingListing.harga_asli || ''}
                    onChange={(e) => setEditingListing({ ...editingListing, harga_asli: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>Kondisi</label>
                  <select
                    value={editingListing.kondisi || 'Good'}
                    onChange={(e) => setEditingListing({ ...editingListing, kondisi: e.target.value })}
                  >
                    <option>Like New</option>
                    <option>Good</option>
                    <option>Fair</option>
                  </select>
                </div>
                <div className="field">
                  <label>Jumlah Stok (Quantity)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingListing.stok ?? 1}
                    onChange={(e) => setEditingListing({ ...editingListing, stok: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                  />
                  <small style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    Ubah ke &gt; 0 agar produk kembali tersedia, atau 0 agar otomatis berstatus Habis/Sold.
                  </small>
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>Lokasi / Kampus</label>
                  <input
                    value={editingListing.lokasi || ''}
                    onChange={(e) => setEditingListing({ ...editingListing, lokasi: e.target.value })}
                  />
                </div>
              </div>

              <CodLocationManager
                label="Opsi Titik Lokasi COD Barang Ini"
                value={editingListing.cod_lokasi || ''}
                onChange={(nextVal) => setEditingListing({ ...editingListing, cod_lokasi: nextVal })}
                helperText="Tambahkan atau hapus titik lokasi COD untuk barang ini."
              />

              <div className="form-row">
                <div className="field">
                  <label>Upload Foto Baru</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleListingPhotoUpload(e, true)}
                  />
                  {uploadingEditPhoto && <small style={{ color: 'var(--muted)' }}>Mengunggah gambar...</small>}
                </div>
                <div className="field">
                  <label>URL Foto</label>
                  <input
                    value={editingListing.foto_url || ''}
                    onChange={(e) => setEditingListing({ ...editingListing, foto_url: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>Deskripsi</label>
                <textarea
                  required
                  value={editingListing.deskripsi || ''}
                  onChange={(e) => setEditingListing({ ...editingListing, deskripsi: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingListing(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEditListing || uploadingEditPhoto}>
                  {savingEditListing ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: MIDTRANS PAYMENT MODAL (WITH MINIMIZE BAR) ─── */}
      {payingOrder && (
        <MidtransPaymentModal
          order={payingOrder}
          onClose={() => setPayingOrder(null)}
          onPaymentSuccess={() => {
            showToast('Pembayaran berhasil diverifikasi!')
            setPayingOrder(null)
            loadDashboardData()
          }}
          onCancelOrder={handleCancelOrder}
        />
      )}

      {/* ─── MODAL: ORDER DETAIL MODAL ───────────────────────── */}
      {detailModalOrder && (
        <div
          className="modal-backdrop show"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setDetailModalOrder(null)}
        >
          <div
            className="modal-dialog"
            style={{
              background: 'var(--card-bg, #fff)',
              borderRadius: '18px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
              <div>
                <span className="eyebrow">Rincian Transaksi</span>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Pesanan #{detailModalOrder.order_number}</h3>
              </div>
              <button
                className="dash-icon-button"
                onClick={() => setDetailModalOrder(null)}
                style={{ cursor: 'pointer', border: 'none', background: 'transparent', fontSize: '20px' }}
              >
                ×
              </button>
            </div>

            {/* Status Pills */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span className={`status-pill ${detailModalOrder.payment_status === 'paid' ? 'status-green' : detailModalOrder.payment_status === 'cancelled' ? 'status-red' : 'status-orange'}`}>
                Status Bayar: {detailModalOrder.payment_status === 'paid' ? 'LUNAS' : detailModalOrder.payment_status === 'cancelled' ? 'Batal' : 'Menunggu Bayar'}
              </span>
              <span className={`status-pill ${detailModalOrder.shipping_status === 'delivered' ? 'status-green' : detailModalOrder.shipping_status === 'shipped' ? 'status-blue' : detailModalOrder.shipping_status === 'cancelled' ? 'status-red' : 'status-orange'}`}>
                Status Kirim: {detailModalOrder.shipping_status_display || detailModalOrder.shipping_status || 'Diproses'}
              </span>
            </div>

            {/* Produk */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--section-bg, #f8fafc)', padding: '12px', borderRadius: '12px', marginBottom: '16px' }}>
              {detailModalOrder.produk_foto && (
                <img
                  src={detailModalOrder.produk_foto}
                  alt=""
                  style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '15px' }}>{detailModalOrder.produk_nama}</h4>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Penjual: {detailModalOrder.seller_nama || 'KampusLoop'}
                </div>
              </div>
            </div>

            {/* Rincian Biaya (Formula Transparan) */}
            <div style={{ marginBottom: '16px' }}>
              <h5 style={{ margin: '0 0 8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)' }}>
                Rincian Biaya Transparan
              </h5>
              <div style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '12px 14px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal Produk</span>
                  <b>{formatPrice(detailModalOrder.subtotal_produk ?? detailModalOrder.harga_bayar)}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                  <span>Biaya Layanan Platform (2%)</span>
                  <span>{formatPrice(detailModalOrder.service_fee || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                  <span>Ongkir ({detailModalOrder.distance_km || 0} km - {detailModalOrder.shipping_courier || 'Kurir'})</span>
                  <span>{formatPrice(detailModalOrder.shipping_cost || 0)}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700 }}>
                  <span>Total Pembayaran</span>
                  <span style={{ color: 'var(--green)' }}>{formatPrice(detailModalOrder.harga_bayar || detailModalOrder.total_bayar)}</span>
                </div>
              </div>
            </div>

            {/* Pengiriman & Catatan */}
            <div style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--text)' }}>
              <h5 style={{ margin: '0 0 8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)' }}>
                Detail Pengiriman &amp; Metode
              </h5>
              <div style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div><b>Metode Pembayaran:</b> {(detailModalOrder.payment_method || 'COD').toUpperCase()}</div>
                <div><b>Tipe Pengiriman:</b> {detailModalOrder.delivery_type === 'delivery' || detailModalOrder.delivery_type === 'antar' ? 'Antar Alamat (Kirim Jarak)' : 'COD Kampus'}</div>
                {detailModalOrder.shipping_address && (
                  <div><b>Alamat Tujuan:</b> {detailModalOrder.shipping_address}{detailModalOrder.kode_pos ? ` (${detailModalOrder.kode_pos})` : ''}</div>
                )}
                {detailModalOrder.cod_location && (
                  <div><b>Titik Temu COD:</b> {detailModalOrder.cod_location}</div>
                )}
                {detailModalOrder.catatan && (
                  <div><b>Catatan Pembeli:</b> "{detailModalOrder.catatan}"</div>
                )}
              </div>
            </div>

            {/* Riwayat / Timeline */}
            {Array.isArray(detailModalOrder.history) && detailModalOrder.history.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ margin: '0 0 8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)' }}>
                  Riwayat Transaksi (Audit Trail)
                </h5>
                <div style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 14px', maxHeight: '130px', overflowY: 'auto', fontSize: '11px' }}>
                  {detailModalOrder.history.map((h, i) => (
                    <div key={i} style={{ borderBottom: i < detailModalOrder.history.length - 1 ? '1px dashed var(--line)' : 'none', padding: '6px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                        <b>{h.action}</b>
                        <small>{h.timestamp ? new Date(h.timestamp).toLocaleString('id-ID') : '-'}</small>
                      </div>
                      <div style={{ color: 'var(--text)', marginTop: '2px' }}>{h.notes || h.note || '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
              {(detailModalOrder.status === 'pending' || detailModalOrder.payment_status === 'unpaid') && (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ color: '#ef4444', borderColor: '#ef4444' }}
                  onClick={() => handleCancelOrder(detailModalOrder.id)}
                >
                  Batalkan Pesanan
                </button>
              )}

              {detailModalOrder.payment_status === 'unpaid' && (detailModalOrder.payment_method || '').toUpperCase() !== 'COD' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const ord = detailModalOrder
                    setDetailModalOrder(null)
                    setPayingOrder(ord)
                  }}
                >
                  Bayar Sekarang via Midtrans ↗
                </button>
              )}

              <button type="button" className="btn btn-outline" onClick={() => setDetailModalOrder(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
