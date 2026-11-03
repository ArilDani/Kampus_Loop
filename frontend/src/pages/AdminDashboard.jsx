import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import api from '../api'
import {
  IconOverview,
  IconPackage,
  IconReceipt,
  IconSettings,
  IconShoppingBag,
  IconUsers,
  IconGraduationCap,
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

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const { showToast } = useCart()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    total_users: 0,
    total_sellers: 0,
    pending_sellers: 0,
    total_produk: 0,
    active_produk: 0,
    produk_pending: 0,
    total_orders: 0,
    completed_orders: 0,
    total_transaksi: 0,
    kategori_breakdown: [],
  })

  const [productsList, setProductsList] = useState([])
  const [usersList, setUsersList] = useState([])
  const [ordersList, setOrdersList] = useState([])
  const [sellerApps, setSellerApps] = useState([])
  const [settings, setSettings] = useState({
    nama_toko: 'KampusLoop',
    tagline: 'Student Circular Marketplace',
    email_support: 'hello@kampusloop.id',
    no_telp: '@kampusloop',
    banner_pengumuman: '',
    status_toko: 'ONLINE',
  })
  const [loading, setLoading] = useState(true)

  // Search & Filter
  const [searchProduct, setSearchProduct] = useState('')
  const [productFilter, setProductFilter] = useState('all')
  const [searchUser, setSearchUser] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')

  // Product CRUD Modals
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [newProductForm, setNewProductForm] = useState({
    nama: '',
    kategori: 'Buku & Akademik',
    kondisi: 'Good',
    harga: '',
    harga_asli: '',
    lokasi: 'Kampus',
    foto_url: '',
    deskripsi: '',
    status: 'approved',
  })
  const [editingProduct, setEditingProduct] = useState(null)
  const [editProductForm, setEditProductForm] = useState({})
  const [deletingProductId, setDeletingProductId] = useState(null)

  // User CRUD Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [newUserForm, setNewUserForm] = useState({
    nama: '',
    email: '',
    password: 'kampus123',
    role: 'user',
    kampus: 'Universitas Hasanuddin',
    telp: '',
  })
  const [editingUser, setEditingUser] = useState(null)
  const [editUserForm, setEditUserForm] = useState({})
  const [deletingUserId, setDeletingUserId] = useState(null)

  // Seller Rejection Modal
  const [rejectingAppId, setRejectingAppId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  // KTM Preview Modal
  const [previewKtmUrl, setPreviewKtmUrl] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=login')
      return
    }
    if (!user.is_staff && !user.is_superuser && user.role !== 'admin') {
      navigate('/dashboard')
      return
    }

    loadAdminData()
  }, [user, navigate])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [statsRes, productsRes, usersRes, ordersRes, sellerAppsRes, settingsRes] = await Promise.all([
        api.get('/admin/stats/').catch(() => ({ data: null })),
        api.get('/admin/produk/').catch(() => ({ data: [] })),
        api.get('/admin/users/').catch(() => ({ data: [] })),
        api.get('/admin/pesanan/').catch(() => ({ data: [] })),
        api.get('/admin/seller-applications/').catch(() => ({ data: [] })),
        api.get('/admin/settings/').catch(() => ({ data: null })),
      ])

      if (statsRes.data) setStats(statsRes.data)
      setProductsList(Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data?.results || []))
      setUsersList(Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.results || []))
      setOrdersList(Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.results || []))
      setSellerApps(Array.isArray(sellerAppsRes.data) ? sellerAppsRes.data : (sellerAppsRes.data?.results || []))
      if (settingsRes.data) setSettings(settingsRes.data)
    } catch {
      // Handled
    } finally {
      setLoading(false)
    }
  }

  // ── PRODUCT ACTIONS ──────────────────────────────────────────────
  const handleApproveProduct = async (id) => {
    try {
      await api.post(`/admin/produk/${id}/approve/`)
      showToast('Produk berhasil disetujui & aktif di katalog!')
      loadAdminData()
    } catch {
      showToast('Gagal menyetujui produk.')
    }
  }

  const handleRejectProduct = async (id) => {
    try {
      await api.post(`/admin/produk/${id}/reject/`)
      showToast('Produk ditolak.')
      loadAdminData()
    } catch {
      showToast('Gagal menolak produk.')
    }
  }

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/produk/', {
        ...newProductForm,
        harga: parseInt(newProductForm.harga),
        harga_asli: newProductForm.harga_asli ? parseInt(newProductForm.harga_asli) : null,
      })
      showToast('Produk platform berhasil dibuat dan tersimpan di database!')
      setShowAddProductModal(false)
      setNewProductForm({
        nama: '',
        kategori: 'Buku & Akademik',
        kondisi: 'Good',
        harga: '',
        harga_asli: '',
        lokasi: 'Kampus',
        foto_url: '',
        deskripsi: '',
        status: 'approved',
      })
      loadAdminData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menambahkan produk.')
    }
  }

  const openEditProductModal = (p) => {
    setEditingProduct(p)
    setEditProductForm({
      nama: p.nama,
      kategori: p.kategori,
      kondisi: p.kondisi,
      harga: p.harga,
      harga_asli: p.harga_asli || '',
      lokasi: p.lokasi || '',
      foto_url: p.foto_url || '',
      deskripsi: p.deskripsi,
      status: p.status,
    })
  }

  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/produk/${editingProduct.id}/edit/`, {
        ...editProductForm,
        harga: parseInt(editProductForm.harga),
        harga_asli: editProductForm.harga_asli ? parseInt(editProductForm.harga_asli) : null,
      })
      showToast('Produk berhasil diperbarui!')
      setEditingProduct(null)
      loadAdminData()
    } catch {
      showToast('Gagal memperbarui produk.')
    }
  }

  const handleDeleteProduct = async (id) => {
    try {
      await api.delete(`/admin/produk/${id}/delete/`)
      showToast('Produk berhasil dihapus dari database.')
      setDeletingProductId(null)
      loadAdminData()
    } catch {
      showToast('Gagal menghapus produk.')
    }
  }

  // ── SELLER VERIFICATION ACTIONS ──────────────────────────────────
  const handleApproveSeller = async (userId) => {
    try {
      const res = await api.post(`/admin/seller-applications/${userId}/approve/`)
      showToast(res.data.message || 'Penjual disetujui!')
      loadAdminData()
    } catch {
      showToast('Gagal menyetujui verifikasi penjual.')
    }
  }

  const handleRejectSeller = async () => {
    if (!rejectingAppId) return
    try {
      const res = await api.post(`/admin/seller-applications/${rejectingAppId}/reject/`, {
        reason: rejectReason || 'Berkas KTM tidak sesuai atau tidak valid.',
      })
      showToast(res.data.message || 'Pengajuan penjual ditolak.')
      setRejectingAppId(null)
      setRejectReason('')
      loadAdminData()
    } catch {
      showToast('Gagal menolak verifikasi penjual.')
    }
  }

  // ── USER CRUD ACTIONS ────────────────────────────────────────────
  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/admin/users/create/', newUserForm)
      showToast(res.data.message || 'Pengguna baru berhasil dibuat!')
      setShowAddUserModal(false)
      setNewUserForm({
        nama: '',
        email: '',
        password: 'kampus123',
        role: 'user',
        kampus: 'Universitas Hasanuddin',
        telp: '',
      })
      loadAdminData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal membuat akun pengguna.')
    }
  }

  const openEditUserModal = (u) => {
    setEditingUser(u)
    setEditUserForm({
      nama: u.nama,
      role: u.role,
      seller_status: u.seller_status,
      kampus: u.kampus,
      telp: u.telp,
    })
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post(`/admin/users/${editingUser.id}/update/`, editUserForm)
      showToast(res.data.message || 'Data pengguna berhasil diperbarui!')
      setEditingUser(null)
      loadAdminData()
    } catch {
      showToast('Gagal memperbarui pengguna.')
    }
  }

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}/delete/`)
      showToast('Pengguna berhasil dihapus.')
      setDeletingUserId(null)
      loadAdminData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menghapus pengguna.')
    }
  }

  // ── SETTINGS ─────────────────────────────────────────────────────
  const handleSaveSettings = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/settings/', settings)
      showToast('Pengaturan platform berhasil disimpan!')
    } catch {
      showToast('Gagal menyimpan pengaturan.')
    }
  }

  const formatPrice = (p) => 'Rp' + Number(p || 0).toLocaleString('id-ID')

  // Filtered Products
  const filteredProducts = productsList.filter((p) => {
    const matchSearch = p.nama.toLowerCase().includes(searchProduct.toLowerCase()) ||
      (p.kategori && p.kategori.toLowerCase().includes(searchProduct.toLowerCase())) ||
      (p.seller_nama && p.seller_nama.toLowerCase().includes(searchProduct.toLowerCase()))
    if (productFilter === 'all') return matchSearch
    return matchSearch && p.status === productFilter
  })

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchSearch = u.nama.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      (u.kampus && u.kampus.toLowerCase().includes(searchUser.toLowerCase()))
    if (userRoleFilter === 'all') return matchSearch
    return matchSearch && u.role === userRoleFilter
  })

  const pendingApps = sellerApps.filter((a) => a.seller_status === 'pending')

  return (
    <main className="dashboard-page">
      <div className="dashboard-wrap">
        {/* ─── SIDEBAR ────────────────────────────────────────────── */}
        <aside className="dash-sidebar admin-sidebar">
          <Link to="/" className="dash-brand">
            <span className="brand-mark" style={{ background: '#0284c7' }}>
              <IconShield size={20} />
            </span>
            <span>
              Kampus<span>Loop</span>
              <small>SUPER ADMIN PANEL</small>
            </span>
          </Link>

          <div className="dash-profile-mini">
            <div className="profile-initial" style={{ background: '#0369a1', color: '#ffffff' }}>
              SA
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '13px' }}>{user.name}</strong>
                <span className="badge badge-admin" style={{ fontSize: '9px', padding: '2px 6px' }}>
                  ADMIN
                </span>
              </div>
              <small>Hak Akses Platform Penuh</small>
            </div>
          </div>

          <span className="dash-nav-label">MANAJEMEN PLATFORM</span>
          <button
            className={`dash-nav ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <IconOverview size={18} />
            <span>Ringkasan Platform</span>
          </button>
          <button
            className={`dash-nav ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <IconPackage size={18} />
            <span>Kelola Produk</span>
            <i>{productsList.length}</i>
          </button>
          <button
            className={`dash-nav ${activeTab === 'seller-apps' ? 'active' : ''}`}
            onClick={() => setActiveTab('seller-apps')}
            style={pendingApps.length > 0 ? { color: '#f59e0b', fontWeight: 700 } : {}}
          >
            <IconGraduationCap size={18} />
            <span>Verifikasi Penjual (KTM)</span>
            <i>{pendingApps.length}</i>
          </button>
          <button
            className={`dash-nav ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <IconUsers size={18} />
            <span>Kelola Pengguna</span>
            <i>{usersList.length}</i>
          </button>
          <button
            className={`dash-nav ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <IconReceipt size={18} />
            <span>Semua Transaksi</span>
            <i>{ordersList.length}</i>
          </button>
          <button
            className={`dash-nav ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <IconSettings size={18} />
            <span>Pengaturan Web</span>
          </button>

          <span className="dash-nav-label" style={{ marginTop: '20px' }}>AKSES BACKEND & LAIN</span>
          <a
            href="http://localhost:8000/admin/"
            target="_blank"
            rel="noreferrer"
            className="dash-nav"
            style={{ color: '#38bdf8', fontWeight: 700 }}
          >
            <IconExternalLink size={18} />
            <span>Super Admin Django</span>
          </a>
          <Link to="/dashboard/penjual" className="dash-nav">
            <IconPackage size={18} />
            <span>Dashboard Penjual</span>
          </Link>
          <Link to="/dashboard" className="dash-nav">
            <IconShoppingBag size={18} />
            <span>Dashboard User</span>
          </Link>

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
              <span className="dash-eyebrow" style={{ color: '#0284c7' }}>KONTROL ADMINISTRATOR WEB</span>
              <h1>
                {activeTab === 'overview' && 'Ringkasan & Statistik Platform'}
                {activeTab === 'products' && 'Manajemen Seluruh Produk (CRUD)'}
                {activeTab === 'seller-apps' && 'Verifikasi Pengajuan Penjual (Mahasiswa Aktif)'}
                {activeTab === 'users' && 'Manajemen Pengguna & Hak Akses (CRUD)'}
                {activeTab === 'orders' && 'Seluruh Pencatatan Penjualan & Transaksi'}
                {activeTab === 'settings' && 'Pengaturan & Identitas Web'}
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href="http://localhost:8000/admin/"
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderColor: '#0284c7', color: '#0284c7' }}
              >
                <span>Super Admin Django</span>
                <IconExternalLink size={14} />
              </a>
              <Link to="/shop" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Lihat Frontend</span>
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
                    <span className="stat-label">TOTAL TRANSAKSI (GMV)</span>
                    <div className="stat-icon green">
                      <IconTrendingUp size={18} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: '#059669' }}>
                    {formatPrice(stats.total_transaksi)}
                  </div>
                  <span className="stat-hint">{stats.completed_orders} pesanan selesai</span>
                </div>

                <div className="dash-stat-card">
                  <div className="stat-header">
                    <span className="stat-label">TOTAL PENGGUNA</span>
                    <div className="stat-icon blue">
                      <IconUsers size={18} />
                    </div>
                  </div>
                  <div className="stat-value">{stats.total_users}</div>
                  <span className="stat-hint">{stats.total_sellers} penjual terverifikasi</span>
                </div>

                <div className="dash-stat-card">
                  <div className="stat-header">
                    <span className="stat-label">VERIFIKASI PENJUAL PENDING</span>
                    <div className="stat-icon amber">
                      <IconGraduationCap size={18} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: stats.pending_sellers > 0 ? '#d97706' : '#0f172a' }}>
                    {stats.pending_sellers}
                  </div>
                  <span className="stat-hint">Perlu verifikasi berkas KTM</span>
                </div>

                <div className="dash-stat-card">
                  <div className="stat-header">
                    <span className="stat-label">TOTAL PRODUK PLATFORM</span>
                    <div className="stat-icon purple">
                      <IconPackage size={18} />
                    </div>
                  </div>
                  <div className="stat-value">{stats.total_produk}</div>
                  <span className="stat-hint">{stats.produk_pending} produk pending review</span>
                </div>
              </div>

              {/* Alert for Pending Seller Applications */}
              {pendingApps.length > 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '16px', padding: '18px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ color: '#d97706', flexShrink: 0 }}>
                      <IconGraduationCap size={28} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800, color: '#92400e' }}>
                        Ada {pendingApps.length} Mahasiswa Menunggu Verifikasi Penjual!
                      </h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#b45309' }}>
                        Periksa foto KTM dan data mahasiswa untuk menyetujui akun mereka menjadi Penjual (User Admin).
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setActiveTab('seller-apps')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>Review Berkas Penjual</span>
                    <IconExternalLink size={13} />
                  </button>
                </div>
              )}

              {/* Quick Actions & Category Distribution */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '28px' }}>
                <div className="dash-panel">
                  <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px' }}>Distribusi Kategori Produk</h3>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {stats.kategori_breakdown?.map((cat) => (
                      <div key={cat.kategori} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>{cat.kategori}</span>
                        <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{cat.count} barang</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dash-panel">
                  <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px' }}>Akses Cepat Database & Admin</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowAddProductModal(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <IconPlus size={16} />
                      <span>Tambah Produk Baru ke Platform</span>
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => setShowAddUserModal(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <IconPlus size={16} />
                      <span>Tambah Akun Pengguna / Admin Baru</span>
                    </button>
                    <button className="btn btn-outline" onClick={() => setActiveTab('orders')}>
                      Lihat Semua Transaksi Platform ({ordersList.length})
                    </button>
                    <a
                      href="http://localhost:8000/admin/"
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-dark"
                      style={{ textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <span>Buka Super Admin Django Panel</span>
                      <IconExternalLink size={14} />
                    </a>
                  </div>
                </div>
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
                      placeholder="Cari produk / seller..."
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
                    <option value="pending">Pending Moderasi</option>
                    <option value="sold">Terjual (Sold)</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddProductModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconPlus size={16} />
                  <span>Tambah Produk Baru</span>
                </button>
              </div>

              <div className="dash-table-wrapper">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Foto</th>
                      <th>Nama & Kategori</th>
                      <th>Penjual (Seller)</th>
                      <th>Harga</th>
                      <th>Status</th>
                      <th>Moderasi</th>
                      <th style={{ textAlign: 'right' }}>Aksi (CRUD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id}>
                        <td style={{ width: '60px' }}>
                          <img
                            src={p.foto_display || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200'}
                            alt={p.nama}
                            style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          />
                        </td>
                        <td>
                          <strong>{p.nama}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{p.kategori} • {p.kondisi}</div>
                        </td>
                        <td>
                          <div><strong>{p.seller_nama}</strong></div>
                          <small style={{ color: '#64748b' }}>{p.seller_kampus || p.seller_email}</small>
                        </td>
                        <td><strong>{formatPrice(p.harga)}</strong></td>
                        <td>
                          <span className={`badge badge-${p.status}`}>
                            {p.status === 'approved' && 'Aktif'}
                            {p.status === 'pending' && 'Review'}
                            {p.status === 'sold' && 'Terjual'}
                            {p.status === 'rejected' && 'Ditolak'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {p.status !== 'approved' && (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleApproveProduct(p.id)}
                                title="Setujui Produk"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <IconCheck size={13} />
                                <span>Approve</span>
                              </button>
                            )}
                            {p.status !== 'rejected' && (
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => handleRejectProduct(p.id)}
                                title="Tolak Produk"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <IconX size={13} />
                                <span>Tolak</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => openEditProductModal(p)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <IconEdit size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeletingProductId(p.id)}
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
            </div>
          )}

          {/* ─── TAB: SELLER VERIFICATION (VERIFIKASI MAHASISWA AKTIF) ─── */}
          {activeTab === 'seller-apps' && (
            <div className="dash-panel">
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px' }}>
                  Pengajuan Verifikasi Penjual (Mahasiswa Aktif)
                </h3>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                  Review berkas KTM mahasiswa yang mendaftar sebagai Penjual (User Admin). Pengguna yang disetujui akan otomatis memperoleh hak akses Dashboard Penjual dan dapat mengunggah barang.
                </p>
              </div>

              {sellerApps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '12px' }}>
                    <IconGraduationCap size={40} />
                  </div>
                  <h3 style={{ margin: '0 0 4px', color: '#0f172a' }}>Belum ada pengajuan verifikasi penjual</h3>
                  <p style={{ margin: 0, fontSize: '14px' }}>Saat mahasiswa mengajukan verifikasi berkas KTM di Dashboard mereka, datanya akan muncul di sini.</p>
                </div>
              ) : (
                <div className="dash-table-wrapper">
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Foto KTM / Berkas</th>
                        <th>Mahasiswa & Kontak</th>
                        <th>Kampus & NIM</th>
                        <th>Fakultas / Prodi</th>
                        <th>Rencana Jualan</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Aksi Verifikasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerApps.map((app) => (
                        <tr key={app.uuid}>
                          <td style={{ width: '80px' }}>
                            {app.ktm_display ? (
                              <img
                                src={app.ktm_display}
                                alt="KTM"
                                style={{ width: '70px', height: '46px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                                onClick={() => setPreviewKtmUrl(app.ktm_display)}
                                title="Klik untuk memperbesar"
                              />
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Tidak ada foto</span>
                            )}
                          </td>
                          <td>
                            <strong>{app.nama}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{app.email}</div>
                            {app.telp && (
                              <a
                                href={`https://wa.me/${app.telp.replace(/^0/, '62')}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '11px', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}
                              >
                                <span>WA: {app.telp}</span>
                                <IconExternalLink size={11} />
                              </a>
                            )}
                          </td>
                          <td>
                            <strong>{app.kampus || '-'}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>NIM: {app.nim || '-'}</div>
                          </td>
                          <td>{app.fakultas_prodi || '-'}</td>
                          <td style={{ maxWidth: '200px', fontSize: '12px', color: '#475569' }}>
                            {app.alasan_jual || '-'}
                          </td>
                          <td>
                            <span className={`badge badge-${app.seller_status}`}>
                              {app.seller_status === 'pending' && 'Menunggu Review'}
                              {app.seller_status === 'approved' && 'Terverifikasi'}
                              {app.seller_status === 'rejected' && 'Ditolak'}
                              {app.seller_status === 'none' && 'Belum Ajukan'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {app.seller_status === 'pending' ? (
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleApproveSeller(app.user_id)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <IconCheck size={13} />
                                  <span>Setujui Penjual</span>
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => setRejectingAppId(app.user_id)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <IconX size={13} />
                                  <span>Tolak</span>
                                </button>
                              </div>
                            ) : app.seller_status === 'approved' ? (
                              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <IconBadgeCheck size={14} />
                                <span>Sudah Jadi Penjual</span>
                              </span>
                            ) : (
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => handleApproveSeller(app.user_id)}
                              >
                                Setujui Ulang
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: USERS (CRUD LENGKAP) ────────────────────────── */}
          {activeTab === 'users' && (
            <div className="dash-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Cari user / email / kampus..."
                      className="dash-input"
                      style={{ width: '240px', paddingLeft: '34px' }}
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                    />
                    <span style={{ position: 'absolute', left: '11px', color: '#94a3b8' }}>
                      <IconSearch size={16} />
                    </span>
                  </div>

                  <select
                    className="dash-input"
                    style={{ width: '160px' }}
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                  >
                    <option value="all">Semua Peran (Role)</option>
                    <option value="admin">Super Admin</option>
                    <option value="penjual">User Admin (Penjual)</option>
                    <option value="user">Mahasiswa (Pembeli)</option>
                  </select>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddUserModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconPlus size={16} />
                  <span>Tambah Pengguna Baru</span>
                </button>
              </div>

              <div className="dash-table-wrapper">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Nama & Email</th>
                      <th>Peran (Role)</th>
                      <th>Status Penjual</th>
                      <th>Kampus & NIM</th>
                      <th>No Telp</th>
                      <th>Produk</th>
                      <th style={{ textAlign: 'right' }}>Aksi (CRUD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.nama}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{u.email}</div>
                        </td>
                        <td>
                          {u.role === 'admin' ? (
                            <span className="badge badge-admin">
                              <IconShield size={11} />
                              <span>Super Admin</span>
                            </span>
                          ) : u.role === 'penjual' ? (
                            <span className="badge badge-approved">
                              <IconBadgeCheck size={11} />
                              <span>User Admin (Penjual)</span>
                            </span>
                          ) : (
                            <span className="badge badge-user">
                              <IconUser size={11} />
                              <span>Mahasiswa (User)</span>
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${u.seller_status}`}>
                            {u.seller_status === 'approved' && 'Terverifikasi'}
                            {u.seller_status === 'pending' && 'Pending KTM'}
                            {u.seller_status === 'rejected' && 'Ditolak'}
                            {u.seller_status === 'none' && 'Bukan Penjual'}
                          </span>
                        </td>
                        <td>
                          <div>{u.kampus || '-'}</div>
                          <small style={{ color: '#64748b' }}>{u.nim || ''}</small>
                        </td>
                        <td>{u.telp || '-'}</td>
                        <td><strong>{u.produk_count}</strong></td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => openEditUserModal(u)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <IconEdit size={13} />
                              <span>Edit / Role</span>
                            </button>
                            {u.id !== user.id && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => setDeletingUserId(u.id)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <IconTrash size={13} />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── TAB: ORDERS (SEMUA TRANSAKSI) ────────────────────── */}
          {activeTab === 'orders' && (
            <div className="dash-panel">
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '18px' }}>
                Seluruh Pencatatan Transaksi & Penjualan Platform
              </h3>

              {ordersList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                  <p>Belum ada transaksi di platform.</p>
                </div>
              ) : (
                <div className="dash-table-wrapper">
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Produk</th>
                        <th>Pembeli</th>
                        <th>Penjual (Seller)</th>
                        <th>Total Bayar</th>
                        <th>Catatan</th>
                        <th>Status</th>
                        <th>Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersList.map((ord) => (
                        <tr key={ord.id}>
                          <td><strong>#{ord.order_number}</strong></td>
                          <td>
                            <strong>{ord.produk_detail?.nama}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{ord.produk_detail?.kategori}</div>
                          </td>
                          <td>
                            <strong>{ord.pembeli_nama}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{ord.pembeli_kampus}</div>
                          </td>
                          <td>
                            <strong>{ord.seller_nama || 'Penjual'}</strong>
                          </td>
                          <td><strong>{formatPrice(ord.harga_bayar)}</strong></td>
                          <td style={{ maxWidth: '160px', fontSize: '12px', color: '#475569' }}>
                            {ord.catatan || '-'}
                          </td>
                          <td>
                            <span className={`badge badge-${ord.status}`}>
                              {ord.status === 'confirmed' && 'Dikonfirmasi'}
                              {ord.status === 'cod_waiting' && 'Menunggu COD'}
                              {ord.status === 'completed' && 'Selesai'}
                              {ord.status === 'cancelled' && 'Dibatalkan'}
                              {ord.status === 'pending' && 'Pending'}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: '#64748b' }}>
                            {ord.tanggal_pesan ? new Date(ord.tanggal_pesan).toLocaleDateString('id-ID') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: SETTINGS ────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <div className="dash-panel" style={{ maxWidth: '640px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '18px' }}>Pengaturan Web & Toko</h3>
              <form onSubmit={handleSaveSettings} style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label className="dash-label">Nama Platform / Toko</label>
                  <input
                    type="text"
                    className="dash-input"
                    value={settings.nama_toko}
                    onChange={(e) => setSettings({ ...settings, nama_toko: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="dash-label">Tagline</label>
                  <input
                    type="text"
                    className="dash-input"
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="dash-label">Email Support</label>
                    <input
                      type="email"
                      className="dash-input"
                      value={settings.email_support}
                      onChange={(e) => setSettings({ ...settings, email_support: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="dash-label">Social / Kontak</label>
                    <input
                      type="text"
                      className="dash-input"
                      value={settings.no_telp}
                      onChange={(e) => setSettings({ ...settings, no_telp: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="dash-label">Banner Pengumuman</label>
                  <textarea
                    rows={3}
                    className="dash-input"
                    value={settings.banner_pengumuman}
                    onChange={(e) => setSettings({ ...settings, banner_pengumuman: e.target.value })}
                  />
                </div>
                <div>
                  <button type="submit" className="btn btn-primary">
                    Simpan Pengaturan
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>

      {/* ─── MODAL: ADD PRODUCT ──────────────────────────────────── */}
      {showAddProductModal && (
        <div className="modal-backdrop" onClick={() => setShowAddProductModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Tambah Produk Baru (Admin CRUD)</h2>
              <button className="icon-btn" onClick={() => setShowAddProductModal(false)} aria-label="Tutup modal">
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label className="dash-label">Nama Barang</label>
                <input
                  type="text"
                  className="dash-input"
                  placeholder="Contoh: Kalkulator Ilmiah, Kamera Mirrorless..."
                  value={newProductForm.nama}
                  onChange={(e) => setNewProductForm({ ...newProductForm, nama: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dash-label">Kategori</label>
                  <select
                    className="dash-input"
                    value={newProductForm.kategori}
                    onChange={(e) => setNewProductForm({ ...newProductForm, kategori: e.target.value })}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="dash-label">Kondisi</label>
                  <select
                    className="dash-input"
                    value={newProductForm.kondisi}
                    onChange={(e) => setNewProductForm({ ...newProductForm, kondisi: e.target.value })}
                  >
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dash-label">Harga (Rp)</label>
                  <input
                    type="number"
                    className="dash-input"
                    value={newProductForm.harga}
                    onChange={(e) => setNewProductForm({ ...newProductForm, harga: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="dash-label">Harga Asli (Rp)</label>
                  <input
                    type="number"
                    className="dash-input"
                    value={newProductForm.harga_asli}
                    onChange={(e) => setNewProductForm({ ...newProductForm, harga_asli: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="dash-label">Lokasi / Kampus</label>
                <input
                  type="text"
                  className="dash-input"
                  value={newProductForm.lokasi}
                  onChange={(e) => setNewProductForm({ ...newProductForm, lokasi: e.target.value })}
                />
              </div>

              <div>
                <label className="dash-label">URL Foto Produk</label>
                <input
                  type="url"
                  className="dash-input"
                  value={newProductForm.foto_url}
                  onChange={(e) => setNewProductForm({ ...newProductForm, foto_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div>
                <label className="dash-label">Deskripsi</label>
                <textarea
                  rows={3}
                  className="dash-input"
                  value={newProductForm.deskripsi}
                  onChange={(e) => setNewProductForm({ ...newProductForm, deskripsi: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddProductModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Produk ke Database
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Edit Produk (Admin CRUD)</h2>
              <button className="icon-btn" onClick={() => setEditingProduct(null)} aria-label="Tutup modal">
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label className="dash-label">Nama Barang</label>
                <input
                  type="text"
                  className="dash-input"
                  value={editProductForm.nama}
                  onChange={(e) => setEditProductForm({ ...editProductForm, nama: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dash-label">Kategori</label>
                  <select
                    className="dash-input"
                    value={editProductForm.kategori}
                    onChange={(e) => setEditProductForm({ ...editProductForm, kategori: e.target.value })}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="dash-label">Status</label>
                  <select
                    className="dash-input"
                    value={editProductForm.status}
                    onChange={(e) => setEditProductForm({ ...editProductForm, status: e.target.value })}
                  >
                    <option value="approved">Aktif (Approved)</option>
                    <option value="pending">Pending Moderasi</option>
                    <option value="sold">Terjual (Sold)</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dash-label">Harga (Rp)</label>
                  <input
                    type="number"
                    className="dash-input"
                    value={editProductForm.harga}
                    onChange={(e) => setEditProductForm({ ...editProductForm, harga: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="dash-label">Kondisi</label>
                  <select
                    className="dash-input"
                    value={editProductForm.kondisi}
                    onChange={(e) => setEditProductForm({ ...editProductForm, kondisi: e.target.value })}
                  >
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="dash-label">URL Foto Produk</label>
                <input
                  type="url"
                  className="dash-input"
                  value={editProductForm.foto_url}
                  onChange={(e) => setEditProductForm({ ...editProductForm, foto_url: e.target.value })}
                />
              </div>

              <div>
                <label className="dash-label">Deskripsi</label>
                <textarea
                  rows={3}
                  className="dash-input"
                  value={editProductForm.deskripsi}
                  onChange={(e) => setEditProductForm({ ...editProductForm, deskripsi: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingProduct(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD USER ─────────────────────────────────────── */}
      {showAddUserModal && (
        <div className="modal-backdrop" onClick={() => setShowAddUserModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Tambah Pengguna Baru (User CRUD)</h2>
              <button className="icon-btn" onClick={() => setShowAddUserModal(false)} aria-label="Tutup modal">
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label className="dash-label">Nama Lengkap</label>
                <input
                  type="text"
                  className="dash-input"
                  value={newUserForm.nama}
                  onChange={(e) => setNewUserForm({ ...newUserForm, nama: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="dash-label">Email (Bebas Email Apa Saja)</label>
                <input
                  type="email"
                  className="dash-input"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="user@gmail.com / user@kampus.id"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dash-label">Peran Akun (Role)</label>
                  <select
                    className="dash-input"
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  >
                    <option value="user">Mahasiswa (Pembeli Reguler)</option>
                    <option value="penjual">User Admin (Penjual Terverifikasi)</option>
                    <option value="admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="dash-label">Password Awal</label>
                  <input
                    type="password"
                    className="dash-input"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="dash-label">Universitas / Kampus</label>
                <input
                  type="text"
                  className="dash-input"
                  value={newUserForm.kampus}
                  onChange={(e) => setNewUserForm({ ...newUserForm, kampus: e.target.value })}
                />
              </div>

              <div>
                <label className="dash-label">Nomor WhatsApp / Telp</label>
                <input
                  type="text"
                  className="dash-input"
                  value={newUserForm.telp}
                  onChange={(e) => setNewUserForm({ ...newUserForm, telp: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddUserModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Buat Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT USER & ROLE ─────────────────────────────── */}
      {editingUser && (
        <div className="modal-backdrop" onClick={() => setEditingUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Edit Pengguna: {editingUser.nama}</h2>
              <button className="icon-btn" onClick={() => setEditingUser(null)} aria-label="Tutup modal">
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label className="dash-label">Nama Lengkap</label>
                <input
                  type="text"
                  className="dash-input"
                  value={editUserForm.nama}
                  onChange={(e) => setEditUserForm({ ...editUserForm, nama: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dash-label">Ubah Peran (Role)</label>
                  <select
                    className="dash-input"
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                  >
                    <option value="user">Mahasiswa (Pembeli)</option>
                    <option value="penjual">User Admin (Penjual)</option>
                    <option value="admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="dash-label">Status Penjual</label>
                  <select
                    className="dash-input"
                    value={editUserForm.seller_status}
                    onChange={(e) => setEditUserForm({ ...editUserForm, seller_status: e.target.value })}
                  >
                    <option value="none">Bukan Penjual</option>
                    <option value="pending">Pending Verifikasi</option>
                    <option value="approved">Terverifikasi (Penjual)</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="dash-label">Kampus</label>
                <input
                  type="text"
                  className="dash-input"
                  value={editUserForm.kampus}
                  onChange={(e) => setEditUserForm({ ...editUserForm, kampus: e.target.value })}
                />
              </div>

              <div>
                <label className="dash-label">Nomor WhatsApp</label>
                <input
                  type="text"
                  className="dash-input"
                  value={editUserForm.telp}
                  onChange={(e) => setEditUserForm({ ...editUserForm, telp: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingUser(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: REJECT SELLER WITH REASON ────────────────────── */}
      {rejectingAppId && (
        <div className="modal-backdrop" onClick={() => setRejectingAppId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 10px' }}>Tolak Pengajuan Penjual</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px' }}>
              Berikan alasan penolakan agar mahasiswa dapat memperbarui berkas yang sesuai.
            </p>
            <textarea
              rows={3}
              className="dash-input"
              placeholder="Contoh: Foto KTM tidak jelas, mohon unggah ulang foto yang menampilkan nama dan NIM jelas..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-outline" onClick={() => setRejectingAppId(null)}>Batal</button>
              <button className="btn btn-danger" onClick={handleRejectSeller}>Kirim Penolakan</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: PREVIEW KTM ───────────────────────────────────── */}
      {previewKtmUrl && (
        <div className="modal-backdrop" onClick={() => setPreviewKtmUrl(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Pratinjau Foto KTM / Mahasiswa Aktif</h3>
              <button className="icon-btn" onClick={() => setPreviewKtmUrl(null)} aria-label="Tutup pratinjau">
                <IconX size={18} />
              </button>
            </div>
            <img
              src={previewKtmUrl}
              alt="Berkas KTM"
              style={{ width: '100%', maxHeight: '480px', objectFit: 'contain', borderRadius: '12px' }}
            />
          </div>
        </div>
      )}

      {/* ─── MODAL: DELETE PRODUCT CONFIRM ───────────────────────── */}
      {deletingProductId && (
        <div className="modal-backdrop" onClick={() => setDeletingProductId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', marginBottom: '12px' }}>
              <IconAlertTriangle size={44} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>Hapus Produk Platform?</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px', lineHeight: 1.5 }}>
              Produk akan terhapus dari database MariaDB `db_KampusLoop`.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setDeletingProductId(null)}>Batal</button>
              <button className="btn btn-danger" onClick={() => handleDeleteProduct(deletingProductId)}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: DELETE USER CONFIRM ──────────────────────────── */}
      {deletingUserId && (
        <div className="modal-backdrop" onClick={() => setDeletingUserId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', marginBottom: '12px' }}>
              <IconAlertTriangle size={44} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>Hapus Pengguna Ini?</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px', lineHeight: 1.5 }}>
              Seluruh data akun, profil, dan listing terkait pengguna ini akan dihapus permanen.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setDeletingUserId(null)}>Batal</button>
              <button className="btn btn-danger" onClick={() => handleDeleteUser(deletingUserId)}>Hapus Pengguna</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
