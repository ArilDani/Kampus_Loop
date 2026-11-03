import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import api from '../api'
import {
  IconOverview,
  IconPackage,
  IconReceipt,
  IconSettings,
  IconShoppingBag,
  IconShield,
  IconLogout,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconClock,
  IconExternalLink,
  IconAlertTriangle,
  IconTrendingUp,
  IconLock,
  IconBadgeCheck,
  IconSearch,
} from '../components/Icons'

const CATEGORIES = [
  'Buku & Akademik',
  'Elektronik',
  'Fashion',
  'Kos & Living',
  'Hobi & Organisasi',
  'Lainnya',
]

const CONDITIONS = ['Like New', 'Good', 'Fair']

export default function SellerDashboard() {
  const { user, logout } = useAuth()
  const { showToast } = useCart()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialTab = searchParams.get('tab') || 'overview'
  const [activeTab, setActiveTab] = useState(initialTab)

  const [stats, setStats] = useState({
    total_listings: 0,
    active_listings: 0,
    sold_listings: 0,
    pending_listings: 0,
    total_orders: 0,
    completed_orders: 0,
    pending_orders: 0,
    total_revenue: 0,
  })

  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchProduct, setSearchProduct] = useState('')
  const [productFilter, setProductFilter] = useState('all')

  // Create Product Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    nama: '',
    kategori: 'Buku & Akademik',
    kondisi: 'Good',
    harga: '',
    harga_asli: '',
    lokasi: '',
    foto_url: '',
    deskripsi: '',
  })
  const [submittingProduct, setSubmittingProduct] = useState(false)

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState(null)
  const [editForm, setEditForm] = useState({
    nama: '',
    kategori: '',
    kondisi: '',
    harga: '',
    harga_asli: '',
    lokasi: '',
    foto_url: '',
    deskripsi: '',
    status: '',
  })
  const [submittingEdit, setSubmittingEdit] = useState(false)

  // Delete Confirm Modal
  const [deletingProductId, setDeletingProductId] = useState(null)

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    nama: '',
    kampus: '',
    nim: '',
    fakultas_prodi: '',
    telp: '',
    bio: '',
    alamat: '',
  })
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=login')
      return
    }

    setProfileForm({
      nama: user.nama || user.name || '',
      kampus: user.kampus || '',
      nim: user.nim || '',
      fakultas_prodi: user.fakultas_prodi || '',
      telp: user.telp || '',
      bio: user.bio || '',
      alamat: user.alamat || '',
    })

    loadSellerData()
  }, [user, navigate])

  const loadSellerData = async () => {
    setLoading(true)
    try {
      const [statsRes, productsRes, ordersRes] = await Promise.all([
        api.get('/seller/stats/').catch(() => ({ data: null })),
        api.get('/seller/products/').catch(() => ({ data: [] })),
        api.get('/seller/orders/').catch(() => ({ data: [] })),
      ])

      if (statsRes.data) setStats(statsRes.data)
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data?.results || []))
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.results || []))
    } catch {
      // Handled
    } finally {
      setLoading(false)
    }
  }

  // CREATE PRODUCT
  const handleCreateProduct = async (e) => {
    e.preventDefault()
    if (!createForm.nama || !createForm.harga) {
      showToast('Nama produk dan harga wajib diisi!')
      return
    }

    setSubmittingProduct(true)
    try {
      const payload = {
        ...createForm,
        harga: parseInt(createForm.harga),
        harga_asli: createForm.harga_asli ? parseInt(createForm.harga_asli) : null,
        lokasi: createForm.lokasi || user.kampus || 'Kampus',
      }
      const res = await api.post('/produk/create/', payload)
      showToast('Produk baru berhasil ditambahkan ke database & katalog!')
      setProducts([res.data, ...products])
      setShowCreateModal(false)
      setCreateForm({
        nama: '',
        kategori: 'Buku & Akademik',
        kondisi: 'Good',
        harga: '',
        harga_asli: '',
        lokasi: '',
        foto_url: '',
        deskripsi: '',
      })
      loadSellerData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menambahkan produk.')
    } finally {
      setSubmittingProduct(false)
    }
  }

  // OPEN EDIT MODAL
  const openEditModal = (p) => {
    setEditingProduct(p)
    setEditForm({
      nama: p.nama || '',
      kategori: p.kategori || 'Buku & Akademik',
      kondisi: p.kondisi || 'Good',
      harga: p.harga || '',
      harga_asli: p.harga_asli || '',
      lokasi: p.lokasi || '',
      foto_url: p.foto_url || '',
      deskripsi: p.deskripsi || '',
      status: p.status || 'approved',
    })
  }

  // UPDATE PRODUCT (CRUD Edit)
  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    if (!editingProduct) return

    setSubmittingEdit(true)
    try {
      const payload = {
        ...editForm,
        harga: parseInt(editForm.harga),
        harga_asli: editForm.harga_asli ? parseInt(editForm.harga_asli) : null,
      }
      const res = await api.put(`/produk/${editingProduct.id}/edit/`, payload)
      showToast('Perubahan produk berhasil disimpan!')
      setProducts(products.map((p) => (p.id === editingProduct.id ? res.data : p)))
      setEditingProduct(null)
      loadSellerData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal memperbarui produk.')
    } finally {
      setSubmittingEdit(false)
    }
  }

  // DELETE PRODUCT (CRUD Delete)
  const handleDeleteProduct = async (id) => {
    try {
      await api.delete(`/produk/${id}/delete/`)
      showToast('Produk berhasil dihapus dari database.')
      setProducts(products.filter((p) => p.id !== id))
      setDeletingProductId(null)
      loadSellerData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menghapus produk.')
    }
  }

  // UPDATE ORDER STATUS (CRUD Status Update)
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.post(`/pesanan/${orderId}/status/`, { status: newStatus })
      showToast(res.data.message || `Status pesanan diubah ke ${newStatus}`)
      setOrders(orders.map((o) => (o.id === orderId ? res.data.pesanan : o)))
      loadSellerData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal mengubah status pesanan.')
    }
  }

  // SAVE SELLER PROFILE
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await api.post('/user/profile/update/', profileForm)
      showToast('Informasi toko & kontak COD berhasil disimpan!')
    } catch {
      showToast('Gagal menyimpan profil.')
    } finally {
      setSavingProfile(false)
    }
  }

  const formatPrice = (p) => 'Rp' + Number(p || 0).toLocaleString('id-ID')
  const initial = (user?.name ? user.name[0] : 'P').toUpperCase()

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.nama.toLowerCase().includes(searchProduct.toLowerCase()) ||
      (p.kategori && p.kategori.toLowerCase().includes(searchProduct.toLowerCase()))
    if (productFilter === 'all') return matchSearch
    return matchSearch && p.status === productFilter
  })

  // Check if non-seller visits
  const isUserSeller = user?.role === 'penjual' || user?.is_seller || user?.is_superuser || user?.role === 'admin'
  if (!isUserSeller) {
    return (
      <main className="dashboard-page wrap" style={{ paddingTop: '80px', minHeight: '80vh' }}>
        <div style={{ maxWidth: '600px', margin: '40px auto', background: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
          <div style={{ color: '#059669', marginBottom: '16px' }}>
            <IconLock size={48} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px', color: '#0f172a' }}>
            Akses Khusus Dashboard Penjual (User Admin)
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            Akun Anda saat ini terdaftar sebagai <strong>Mahasiswa/Pembeli Reguler</strong>. Untuk membuka toko dan berjualan di KampusLoop, silakan ajukan verifikasi berkas mahasiswa aktif (KTM) terlebih dahulu di Dashboard Pengguna Anda.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/dashboard?tab=seller-apply" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>Ajukan Verifikasi Mahasiswa Aktif</span>
              <IconExternalLink size={14} />
            </Link>
            <Link to="/dashboard" className="btn btn-outline">
              Buka Dashboard Pembeli
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-wrap">
        {/* ─── SIDEBAR ────────────────────────────────────────────── */}
        <aside className="dash-sidebar user-sidebar">
          <Link to="/" className="dash-brand">
            <span className="brand-mark">
              <IconPackage size={20} />
            </span>
            <span>
              Kampus<span>Loop</span>
              <small>SELLER DASHBOARD</small>
            </span>
          </Link>

          <div className="dash-profile-mini">
            <div className="profile-initial">
              {initial}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '13px' }}>{user.name}</strong>
                <span className="badge badge-approved" style={{ fontSize: '9px', padding: '2px 6px' }}>
                  <IconBadgeCheck size={11} />
                  <span>Penjual</span>
                </span>
              </div>
              <small>{user.kampus || 'Mahasiswa Terverifikasi'}</small>
            </div>
          </div>

          <span className="dash-nav-label">PENJUAL (USER ADMIN)</span>
          <button
            className={`dash-nav ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <IconOverview size={18} />
            <span>Ringkasan Penjualan</span>
          </button>
          <button
            className={`dash-nav ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <IconPackage size={18} />
            <span>Produk Saya</span>
            <i>{products.length}</i>
          </button>
          <button
            className={`dash-nav ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <IconReceipt size={18} />
            <span>Pesanan Masuk</span>
            <i>{orders.length}</i>
          </button>
          <button
            className={`dash-nav ${activeTab === 'store-settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('store-settings')}
          >
            <IconSettings size={18} />
            <span>Pengaturan Toko & COD</span>
          </button>

          <span className="dash-nav-label" style={{ marginTop: '20px' }}>NAVIGASI LAIN</span>
          <Link to="/dashboard" className="dash-nav">
            <IconShoppingBag size={18} />
            <span>Buka Dashboard Pembeli</span>
          </Link>
          {(user.is_staff || user.is_superuser || user.role === 'admin') && (
            <Link to="/admin" className="dash-nav" style={{ color: '#0284c7' }}>
              <IconShield size={18} />
              <span>Buka Super Admin Panel</span>
            </Link>
          )}

          <div className="dash-sidebar-bottom">
            <button className="dash-nav logout-btn" onClick={logout}>
              <IconLogout size={18} />
              <span>Keluar</span>
            </button>
          </div>
        </aside>

        {/* ─── MAIN CONTENT ────────────────────────────────────────── */}
        <section className="dash-content">
          {/* Header */}
          <div className="dash-header">
            <div>
              <span className="dash-eyebrow">DASHBOARD PENJUAL MAHASISWA</span>
              <h1>
                {activeTab === 'overview' && 'Ringkasan & Pencatatan Penjualan'}
                {activeTab === 'products' && 'Manajemen Produk Saya (CRUD)'}
                {activeTab === 'orders' && 'Pesanan Masuk & Transaksi COD'}
                {activeTab === 'store-settings' && 'Profil Toko & Preferensi COD'}
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <IconPlus size={16} />
                <span>Tambah Barang Baru</span>
              </button>
              <Link to="/shop" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Lihat Katalog</span>
                <IconExternalLink size={14} />
              </Link>
            </div>
          </div>

          {/* ─── TAB: OVERVIEW ────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <>
              {/* Stat Cards */}
              <div className="dash-grid-4">
                <div className="dash-stat-card">
                  <div className="stat-header">
                    <span className="stat-label">TOTAL PENDAPATAN (OMZET)</span>
                    <div className="stat-icon green">
                      <IconTrendingUp size={18} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: '#059669' }}>
                    {formatPrice(stats.total_revenue)}
                  </div>
                  <span className="stat-hint">Dari {stats.completed_orders} transaksi selesai</span>
                </div>

                <div className="dash-stat-card">
                  <div className="stat-header">
                    <span className="stat-label">PRODUK AKTIF</span>
                    <div className="stat-icon blue">
                      <IconPackage size={18} />
                    </div>
                  </div>
                  <div className="stat-value">{stats.active_listings}</div>
                  <span className="stat-hint">Tayang di katalog e-commerce</span>
                </div>

                <div className="dash-stat-card">
                  <div className="stat-header">
                    <span className="stat-label">PESANAN PERLU DIPROSES</span>
                    <div className="stat-icon amber">
                      <IconClock size={18} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: stats.pending_orders > 0 ? '#d97706' : '#0f172a' }}>
                    {stats.pending_orders}
                  </div>
                  <span className="stat-hint">Menunggu konfirmasi / COD</span>
                </div>

                <div className="dash-stat-card">
                  <div className="stat-header">
                    <span className="stat-label">BARANG TERJUAL</span>
                    <div className="stat-icon purple">
                      <IconBadgeCheck size={18} />
                    </div>
                  </div>
                  <div className="stat-value">{stats.sold_listings}</div>
                  <span className="stat-hint">Total item sukses terjual</span>
                </div>
              </div>

              {/* Quick Action Banner */}
              <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)', border: '1px solid #bbf7d0', borderRadius: '18px', padding: '24px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#166534', margin: '0 0 6px' }}>
                    Siap menjual barang preloved lainnya?
                  </h3>
                  <p style={{ margin: 0, color: '#15803d', fontSize: '13px' }}>
                    Unggah buku kuliah, alat elektronik, gadget kos, atau pakaianmu. Pembeli sesama mahasiswa dapat langsung bertransaksi COD aman di kampus.
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconPlus size={16} />
                  <span>Jual Barang Sekarang</span>
                </button>
              </div>

              {/* Recent Orders Overview */}
              <div className="dash-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Pesanan Masuk Terbaru</h3>
                  <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('orders')}>
                    Lihat Semua ({orders.length})
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b' }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>Belum ada pesanan masuk saat ini. Pastikan produkmu menarik dengan foto yang jelas!</p>
                  </div>
                ) : (
                  <div className="dash-table-wrapper">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>No. Pesanan</th>
                          <th>Produk</th>
                          <th>Pembeli</th>
                          <th>Harga</th>
                          <th>Status</th>
                          <th>Aksi Cepat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map((ord) => (
                          <tr key={ord.id}>
                            <td><strong>#{ord.order_number}</strong></td>
                            <td>{ord.produk_detail?.nama || 'Produk'}</td>
                            <td>
                              <div><strong>{ord.pembeli_nama}</strong></div>
                              <small style={{ color: '#64748b' }}>{ord.pembeli_kampus || ord.pembeli_email}</small>
                            </td>
                            <td><strong>{formatPrice(ord.harga_bayar)}</strong></td>
                            <td>
                              <span className={`badge badge-${ord.status}`}>
                                {ord.status === 'pending' && 'Menunggu'}
                                {ord.status === 'confirmed' && 'Dikonfirmasi'}
                                {ord.status === 'cod_waiting' && 'Menunggu COD'}
                                {ord.status === 'completed' && 'Selesai'}
                                {ord.status === 'cancelled' && 'Dibatalkan'}
                              </span>
                            </td>
                            <td>
                              {ord.status === 'confirmed' && (
                                <button className="btn btn-sm btn-outline" onClick={() => handleUpdateOrderStatus(ord.id, 'cod_waiting')}>
                                  Atur COD
                                </button>
                              )}
                              {ord.status === 'cod_waiting' && (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'completed')}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <IconCheck size={14} />
                                  <span>Tandai Selesai</span>
                                </button>
                              )}
                              {ord.status === 'completed' && (
                                <span style={{ color: '#059669', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <IconCheck size={14} />
                                  <span>Lunas</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ─── TAB: PRODUCTS (CRUD LENGKAP) ────────────────────── */}
          {activeTab === 'products' && (
            <div className="dash-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Cari produk Anda..."
                      className="dash-input"
                      style={{ width: '240px', paddingLeft: '34px' }}
                      value={searchProduct}
                      onChange={(e) => setSearchProduct(e.target.value)}
                    />
                    <span style={{ position: 'absolute', left: '11px', color: '#94a3b8' }}>
                      <IconSearch size={16} />
                    </span>
                  </div>

                  <select
                    className="dash-input"
                    style={{ width: '160px' }}
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                  >
                    <option value="all">Semua Status</option>
                    <option value="approved">Aktif (Approved)</option>
                    <option value="pending">Menunggu Moderasi</option>
                    <option value="sold">Terjual (Sold)</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconPlus size={16} />
                  <span>Tambah Produk Baru</span>
                </button>
              </div>

              {filteredProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '12px' }}>
                    <IconPackage size={40} />
                  </div>
                  <h3 style={{ margin: '0 0 6px', color: '#0f172a' }}>Tidak ada produk ditemukan</h3>
                  <p style={{ margin: '0 0 18px', fontSize: '14px' }}>Mulai daftarkan barang preloved pertama Anda untuk dijual ke sesama mahasiswa.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <IconPlus size={16} />
                    <span>Tambah Produk Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="dash-table-wrapper">
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Foto</th>
                        <th>Nama & Kategori</th>
                        <th>Kondisi</th>
                        <th>Harga</th>
                        <th>Lokasi COD</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Aksi (CRUD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => (
                        <tr key={p.id}>
                          <td style={{ width: '64px' }}>
                            <img
                              src={p.foto_display || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200'}
                              alt={p.nama}
                              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                            />
                          </td>
                          <td>
                            <strong>{p.nama}</strong>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{p.kategori}</div>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', fontWeight: 600 }}>
                              {p.kondisi}
                            </span>
                          </td>
                          <td>
                            <strong>{formatPrice(p.harga)}</strong>
                            {p.harga_asli && (
                              <div style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>
                                {formatPrice(p.harga_asli)}
                              </div>
                            )}
                          </td>
                          <td>{p.lokasi || user.kampus || '-'}</td>
                          <td>
                            <span className={`badge badge-${p.status}`}>
                              {p.status === 'approved' && 'Aktif'}
                              {p.status === 'pending' && 'Review'}
                              {p.status === 'sold' && 'Terjual'}
                              {p.status === 'rejected' && 'Ditolak'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => openEditModal(p)}
                                title="Edit Produk"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <IconEdit size={13} />
                                <span>Edit</span>
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => setDeletingProductId(p.id)}
                                title="Hapus Produk"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <IconTrash size={13} />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: ORDERS (PESANAN MASUK) ────────────────────── */}
          {activeTab === 'orders' && (
            <div className="dash-panel">
              <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '18px' }}>
                Semua Pesanan Masuk untuk Produk Anda
              </h3>

              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '12px' }}>
                    <IconReceipt size={40} />
                  </div>
                  <h3 style={{ margin: '0 0 6px', color: '#0f172a' }}>Belum ada pesanan masuk</h3>
                  <p style={{ margin: 0, fontSize: '14px' }}>Pesanan dari mahasiswa lain akan muncul di sini saat mereka membeli barang Anda.</p>
                </div>
              ) : (
                <div className="dash-table-wrapper">
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Produk</th>
                        <th>Pembeli & Kontak</th>
                        <th>Harga</th>
                        <th>Catatan Pembeli</th>
                        <th>Status</th>
                        <th>Ubah Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((ord) => (
                        <tr key={ord.id}>
                          <td><strong>#{ord.order_number}</strong></td>
                          <td>
                            <strong>{ord.produk_detail?.nama}</strong>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{ord.produk_detail?.kategori}</div>
                          </td>
                          <td>
                            <strong>{ord.pembeli_nama}</strong>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{ord.pembeli_kampus}</div>
                            {ord.pembeli_telp && (
                              <a
                                href={`https://wa.me/${ord.pembeli_telp.replace(/^0/, '62')}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '12px', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}
                              >
                                <span>WA: {ord.pembeli_telp}</span>
                                <IconExternalLink size={12} />
                              </a>
                            )}
                          </td>
                          <td><strong>{formatPrice(ord.harga_bayar)}</strong></td>
                          <td style={{ maxWidth: '200px', fontSize: '12px', color: '#475569' }}>
                            {ord.catatan || 'Tidak ada catatan'}
                          </td>
                          <td>
                            <span className={`badge badge-${ord.status}`}>
                              {ord.status === 'pending' && 'Menunggu'}
                              {ord.status === 'confirmed' && 'Dikonfirmasi'}
                              {ord.status === 'cod_waiting' && 'Menunggu COD'}
                              {ord.status === 'completed' && 'Selesai'}
                              {ord.status === 'cancelled' && 'Dibatalkan'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {ord.status !== 'confirmed' && ord.status !== 'completed' && (
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'confirmed')}
                                >
                                  Konfirmasi
                                </button>
                              )}
                              {ord.status !== 'cod_waiting' && ord.status !== 'completed' && (
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'cod_waiting')}
                                >
                                  COD
                                </button>
                              )}
                              {ord.status !== 'completed' && (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'completed')}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <IconCheck size={13} />
                                  <span>Selesai</span>
                                </button>
                              )}
                              {ord.status !== 'cancelled' && ord.status !== 'completed' && (
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'cancelled')}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <IconX size={13} />
                                  <span>Batal</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: STORE SETTINGS ────────────────────────────── */}
          {activeTab === 'store-settings' && (
            <div className="dash-panel" style={{ maxWidth: '720px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>Pengaturan Profil Toko & Kontak COD</h3>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                Informasi ini akan terlihat oleh mahasiswa yang membeli produk Anda agar proses COD di lingkungan kampus berjalan lancar.
              </p>

              <form onSubmit={handleSaveProfile} style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label className="dash-label">Nama Penjual / Nama Toko</label>
                  <input
                    type="text"
                    className="dash-input"
                    value={profileForm.nama}
                    onChange={(e) => setProfileForm({ ...profileForm, nama: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="dash-label">Universitas / Kampus</label>
                    <input
                      type="text"
                      className="dash-input"
                      value={profileForm.kampus}
                      onChange={(e) => setProfileForm({ ...profileForm, kampus: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="dash-label">Nomor WhatsApp Aktif (Untuk COD)</label>
                    <input
                      type="text"
                      className="dash-input"
                      value={profileForm.telp}
                      onChange={(e) => setProfileForm({ ...profileForm, telp: e.target.value })}
                      placeholder="Contoh: 081234567890"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="dash-label">NIM (Nomor Induk Mahasiswa)</label>
                    <input
                      type="text"
                      className="dash-input"
                      value={profileForm.nim}
                      onChange={(e) => setProfileForm({ ...profileForm, nim: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="dash-label">Fakultas / Program Studi</label>
                    <input
                      type="text"
                      className="dash-input"
                      value={profileForm.fakultas_prodi}
                      onChange={(e) => setProfileForm({ ...profileForm, fakultas_prodi: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="dash-label">Preferensi Lokasi COD di Kampus</label>
                  <input
                    type="text"
                    className="dash-input"
                    value={profileForm.alamat}
                    onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })}
                    placeholder="Contoh: Perpustakaan Pusat UNM / Gedung Rektorat UI / Kantin Fakultas"
                  />
                </div>

                <div>
                  <label className="dash-label">Bio / Catatan Toko</label>
                  <textarea
                    rows={3}
                    className="dash-input"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Deskripsi singkat tokomu, komitmen menjaga kualitas barang, atau jam luang untuk COD."
                  />
                </div>

                <div style={{ marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                    {savingProfile ? 'Menyimpan...' : 'Simpan Pengaturan Toko'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>

      {/* ─── MODAL: CREATE PRODUCT ───────────────────────────────── */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Tambah Barang Baru ke Katalog</h2>
              <button className="icon-btn" onClick={() => setShowCreateModal(false)} aria-label="Tutup modal">
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label className="dash-label">Nama Barang</label>
                <input
                  type="text"
                  className="dash-input"
                  placeholder="Contoh: Kalkulator Casio fx-991EX, Buku Akuntansi..."
                  value={createForm.nama}
                  onChange={(e) => setCreateForm({ ...createForm, nama: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="dash-label">Kategori</label>
                  <select
                    className="dash-input"
                    value={createForm.kategori}
                    onChange={(e) => setCreateForm({ ...createForm, kategori: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="dash-label">Kondisi</label>
                  <select
                    className="dash-input"
                    value={createForm.kondisi}
                    onChange={(e) => setCreateForm({ ...createForm, kondisi: e.target.value })}
                  >
                    {CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="dash-label">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    className="dash-input"
                    placeholder="Contoh: 150000"
                    value={createForm.harga}
                    onChange={(e) => setCreateForm({ ...createForm, harga: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="dash-label">Harga Asli / Beli Baru (Opsional)</label>
                  <input
                    type="number"
                    className="dash-input"
                    placeholder="Contoh: 250000"
                    value={createForm.harga_asli}
                    onChange={(e) => setCreateForm({ ...createForm, harga_asli: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="dash-label">Lokasi / Kampus COD</label>
                <input
                  type="text"
                  className="dash-input"
                  placeholder="Contoh: Makassar, Depok, Bandung, dsb."
                  value={createForm.lokasi}
                  onChange={(e) => setCreateForm({ ...createForm, lokasi: e.target.value })}
                />
              </div>

              <div>
                <label className="dash-label">URL Foto Produk</label>
                <input
                  type="url"
                  className="dash-input"
                  placeholder="https://images.unsplash.com/..."
                  value={createForm.foto_url}
                  onChange={(e) => setCreateForm({ ...createForm, foto_url: e.target.value })}
                />
                {createForm.foto_url && (
                  <div style={{ marginTop: '8px' }}>
                    <img
                      src={createForm.foto_url}
                      alt="Preview"
                      style={{ height: '90px', borderRadius: '8px', objectFit: 'cover' }}
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="dash-label">Deskripsi Lengkap Barang</label>
                <textarea
                  rows={3}
                  className="dash-input"
                  placeholder="Jelaskan kelengkapan, minus pemakaian, alasan jual, atau tips COD..."
                  value={createForm.deskripsi}
                  onChange={(e) => setCreateForm({ ...createForm, deskripsi: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingProduct}>
                  {submittingProduct ? 'Menyimpan...' : 'Simpan & Publikasikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT PRODUCT ─────────────────────────────────── */}
      {editingProduct && (
        <div className="modal-backdrop" onClick={() => setEditingProduct(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Edit Produk: {editingProduct.nama}</h2>
              <button className="icon-btn" onClick={() => setEditingProduct(null)} aria-label="Tutup modal">
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label className="dash-label">Nama Barang</label>
                <input
                  type="text"
                  className="dash-input"
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="dash-label">Kategori</label>
                  <select
                    className="dash-input"
                    value={editForm.kategori}
                    onChange={(e) => setEditForm({ ...editForm, kategori: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="dash-label">Kondisi</label>
                  <select
                    className="dash-input"
                    value={editForm.kondisi}
                    onChange={(e) => setEditForm({ ...editForm, kondisi: e.target.value })}
                  >
                    {CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="dash-label">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    className="dash-input"
                    value={editForm.harga}
                    onChange={(e) => setEditForm({ ...editForm, harga: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="dash-label">Status Produk</label>
                  <select
                    className="dash-input"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="approved">Aktif (Tampil di Katalog)</option>
                    <option value="pending">Menunggu Moderasi</option>
                    <option value="sold">Terjual</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="dash-label">URL Foto Produk</label>
                <input
                  type="url"
                  className="dash-input"
                  value={editForm.foto_url}
                  onChange={(e) => setEditForm({ ...editForm, foto_url: e.target.value })}
                />
              </div>

              <div>
                <label className="dash-label">Deskripsi</label>
                <textarea
                  rows={3}
                  className="dash-input"
                  value={editForm.deskripsi}
                  onChange={(e) => setEditForm({ ...editForm, deskripsi: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingProduct(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingEdit}>
                  {submittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CONFIRM DELETE PRODUCT ──────────────────────── */}
      {deletingProductId && (
        <div className="modal-backdrop" onClick={() => setDeletingProductId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', marginBottom: '12px' }}>
              <IconAlertTriangle size={44} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>Hapus Produk Ini?</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px', lineHeight: 1.5 }}>
              Data produk akan dihapus secara permanen dari database KampusLoop dan tidak akan tampil lagi di katalog.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setDeletingProductId(null)}>
                Batal
              </button>
              <button className="btn btn-danger" onClick={() => handleDeleteProduct(deletingProductId)}>
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
