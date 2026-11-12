import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  LayoutGrid,
  Package,
  Users,
  ArrowUpRight,
  PenLine,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  Sparkles,
  Check,
  X,
  Search,
  FileText,
  Clock,
  FileSignature,
  Headphones,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import RichTextEditor from '../components/RichTextEditor'
import CodLocationManager from '../components/CodLocationManager'
import api from '../api'

const DEFAULT_WEEK = [
  { day: 'Sen', count: 0, pct: 8 },
  { day: 'Sel', count: 0, pct: 8 },
  { day: 'Rab', count: 0, pct: 8 },
  { day: 'Kam', count: 0, pct: 8 },
  { day: 'Jum', count: 0, pct: 8 },
  { day: 'Sab', count: 0, pct: 8 },
  { day: 'Min', count: 0, pct: 8 },
]

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const { showToast } = useCart()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    total_users: 0,
    active_products: 0,
    pending_products: 0,
    completed_orders: 0,
    reuse_count: 0,
    gmv: 'Rp0',
    total_savings_formatted: 'Rp0',
    activity_rate: 0,
    weekly_activity: DEFAULT_WEEK,
    kategori_breakdown: [],
    pending_seller_applications: 0,
  })
  const [productsList, setProductsList] = useState([])
  const [productFilter, setProductFilter] = useState('all')
  const [searchProduct, setSearchProduct] = useState('')
  const [usersList, setUsersList] = useState([])
  const [userFilter, setUserFilter] = useState('all')
  const [ordersList, setOrdersList] = useState([])
  const [searchUser, setSearchUser] = useState('')

  // Admin add product state
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({
    nama: '',
    kategori: 'Buku & Akademik',
    kondisi: 'Good',
    harga: '',
    harga_asli: '',
    lokasi: 'KampusLoop',
    cod_lokasi: '',
    foto_url: '',
    deskripsi: '',
  })
  const [uploadingNewPhoto, setUploadingNewPhoto] = useState(false)
  const [savingNewProduct, setSavingNewProduct] = useState(false)

  // Admin edit product modal state
  const [editingProduct, setEditingProduct] = useState(null)
  const [uploadingEditPhoto, setUploadingEditPhoto] = useState(false)
  const [savingEditProduct, setSavingEditProduct] = useState(false)

  // Seller application review modal
  const [reviewingUser, setReviewingUser] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [processingReview, setProcessingReview] = useState(false)

  // Agreement template modal
  const [showAgreementModal, setShowAgreementModal] = useState(false)
  const [agreementForm, setAgreementForm] = useState({
    judul: '',
    isi: '',
    catatan: '',
    file_url: '',
  })
  const [uploadingAgreementFile, setUploadingAgreementFile] = useState(false)
  const [savingAgreement, setSavingAgreement] = useState(false)

  // Web Settings state
  const [webSettings, setWebSettings] = useState({
    nama_toko: 'KampusLoop',
    tagline: 'Student Circular Marketplace',
    status_toko: 'ONLINE',
    banner_pengumuman: '',
    email_support: 'hello@kampusloop.id',
    no_wa: '',
    no_telp: '@kampusloop',
    alamat: '',
    instagram_handle: '@kampusloop',
    instagram_url: 'https://instagram.com',
    tiktok_url: 'https://tiktok.com',
    telegram_handle: '@kampusloop',
    footer_deskripsi: '',
    footer_copyright: '',
    footer_tagline_bawah: '',
    kebijakan_privasi_judul: 'Kebijakan Privasi',
    kebijakan_privasi_isi: '',
    syarat_ketentuan_judul: 'Syarat & Ketentuan',
    syarat_ketentuan_isi: '',
    panduan_keamanan_judul: 'Panduan Keamanan Transaksi',
    panduan_keamanan_isi: '',
    payment_config: {
      cod_enabled: true,
      qris_enabled: false,
      qris_image_url: '',
      qris_label: 'QRIS KampusLoop',
      bank_enabled: false,
      bank_name: '',
      bank_account_number: '',
      bank_account_name: '',
      cod_locations: 'Perpustakaan Pusat, Kantin Fakultas, Gerbang Utama Kampus',
    },
  })
  const [uploadingAdminQris, setUploadingAdminQris] = useState(false)
  const [savingWebSettings, setSavingWebSettings] = useState(false)
  const [applyCodToAdminProducts, setApplyCodToAdminProducts] = useState(true)

  // Articles CRUD state (Admin Web only)
  const [articlesList, setArticlesList] = useState([])
  const [showAddArticle, setShowAddArticle] = useState(false)
  const [newArticle, setNewArticle] = useState({
    judul: '',
    kategori: 'Berita ModuLab',
    ringkasan: '',
    konten: '',
    gambar_url: '',
    status: 'published',
  })
  const [uploadingArticleImg, setUploadingArticleImg] = useState(false)
  const [savingNewArticle, setSavingNewArticle] = useState(false)
  const [editingArticle, setEditingArticle] = useState(null)
  const [uploadingEditArticleImg, setUploadingEditArticleImg] = useState(false)
  const [savingEditArticle, setSavingEditArticle] = useState(false)

  const loadAdminData = useCallback(async () => {
    try {
      const [statsRes, productsRes, usersRes, ordersRes, settingsRes, articlesRes] = await Promise.all([
        api.get('/admin/stats/').catch(() => null),
        api.get('/admin/produk/').catch(() => ({ data: [] })),
        api.get('/admin/users/').catch(() => ({ data: [] })),
        api.get('/admin/pesanan/').catch(() => ({ data: [] })),
        api.get('/admin/settings/').catch(() => null),
        api.get('/admin/artikel/').catch(() => ({ data: [] })),
      ])

      if (statsRes?.data) setStats(statsRes.data)
      if (productsRes?.data) {
        setProductsList(Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data?.results || []))
      }
      if (usersRes?.data) {
        setUsersList(Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.results || []))
      }
      if (ordersRes?.data) {
        setOrdersList(Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.results || []))
      }
      if (settingsRes?.data) {
        setWebSettings((prev) => ({ ...prev, ...settingsRes.data }))
      }
      if (articlesRes?.data) {
        setArticlesList(Array.isArray(articlesRes.data) ? articlesRes.data : [])
      }
    } catch {
      // Fallback
    }
  }, [])

  useEffect(() => {
    if (!user || (!user.is_staff && !user.is_superuser && user.role !== 'admin')) {
      navigate('/auth?mode=login')
      return
    }

    loadAdminData()
  }, [user, navigate, loadAdminData])

  const uploadProductImage = async (file, isEdit = false) => {
    if (!file) return
    if (isEdit) setUploadingEditPhoto(true)
    else setUploadingNewPhoto(true)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'products')
      const res = await api.post('/upload/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (isEdit) {
        setEditingProduct((prev) => ({ ...prev, foto_url: res.data.url }))
      } else {
        setNewProduct((prev) => ({ ...prev, foto_url: res.data.url }))
      }
      showToast('Foto produk berhasil diunggah!')
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal mengunggah gambar.')
    } finally {
      if (isEdit) setUploadingEditPhoto(false)
      else setUploadingNewPhoto(false)
    }
  }

  const handleAdminCreateProduct = async (e) => {
    e.preventDefault()
    setSavingNewProduct(true)
    try {
      await api.post('/admin/produk/create/', newProduct)
      showToast('Produk langsung ditambahkan dan tayang di katalog tanpa menunggu verifikasi!')
      setShowAddProduct(false)
      setNewProduct({
        nama: '',
        kategori: 'Buku & Akademik',
        kondisi: 'Good',
        harga: '',
        harga_asli: '',
        lokasi: 'KampusLoop',
        cod_lokasi: '',
        foto_url: '',
        deskripsi: '',
      })
      await loadAdminData()
      window.dispatchEvent(new CustomEvent('kampusloop:dataUpdated'))
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menambahkan produk.')
    } finally {
      setSavingNewProduct(false)
    }
  }

  const handleSaveEditProduct = async (e) => {
    e.preventDefault()
    if (!editingProduct) return
    setSavingEditProduct(true)
    try {
      await api.put(`/admin/produk/${editingProduct.id}/update/`, {
        nama: editingProduct.nama,
        kategori: editingProduct.kategori,
        kondisi: editingProduct.kondisi,
        harga: editingProduct.harga,
        harga_asli: editingProduct.harga_asli,
        lokasi: editingProduct.lokasi,
        cod_lokasi: editingProduct.cod_lokasi || '',
        status: editingProduct.status,
        foto_url: editingProduct.foto_url,
        deskripsi: editingProduct.deskripsi,
      })
      showToast('Detail produk berhasil diperbarui dan tersimpan di database!')
      setEditingProduct(null)
      await loadAdminData()
      window.dispatchEvent(new CustomEvent('kampusloop:dataUpdated'))
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal memperbarui produk.')
    } finally {
      setSavingEditProduct(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/produk/${id}/approve/`)
      showToast('Produk berhasil disetujui & tayang di katalog marketplace!')
      await loadAdminData()
      window.dispatchEvent(new CustomEvent('kampusloop:dataUpdated'))
    } catch {
      showToast('Gagal menyetujui produk.')
    }
  }

  const handleReject = async (id) => {
    try {
      await api.post(`/admin/produk/${id}/reject/`)
      showToast('Produk ditolak / dinonaktifkan.')
      await loadAdminData()
      window.dispatchEvent(new CustomEvent('kampusloop:dataUpdated'))
    } catch {
      showToast('Gagal menolak produk.')
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Hapus produk ini secara permanen dari database?')) return
    try {
      await api.delete(`/admin/produk/${id}/delete/`)
      showToast('Produk berhasil dihapus dari database.')
      setProductsList(productsList.filter((p) => p.id !== id))
      await loadAdminData()
      window.dispatchEvent(new CustomEvent('kampusloop:dataUpdated'))
    } catch {
      showToast('Gagal menghapus produk.')
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.post(`/admin/users/${userId}/role/`, { role: newRole })
      showToast(res.data.message || 'Role pengguna berhasil diperbarui.')
      await loadAdminData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal mengubah role pengguna.')
    }
  }

  const handleApproveSeller = async (userId) => {
    setProcessingReview(true)
    try {
      const res = await api.post(`/admin/users/${userId}/approve-seller/`, {
        catatan: reviewNote || 'Berkas mahasiswa & surat perjanjian telah divalidasi.',
      })
      showToast(res.data.message || 'Pengajuan penjual disetujui!')
      setReviewingUser(null)
      setReviewNote('')
      await loadAdminData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menyetujui pengajuan penjual.')
    } finally {
      setProcessingReview(false)
    }
  }

  const handleRejectSeller = async (userId) => {
    setProcessingReview(true)
    try {
      const res = await api.post(`/admin/users/${userId}/reject-seller/`, {
        catatan: reviewNote || 'Berkas validasi atau surat perjanjian belum sesuai.',
      })
      showToast(res.data.message || 'Pengajuan penjual ditolak.')
      setReviewingUser(null)
      setReviewNote('')
      await loadAdminData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menolak pengajuan penjual.')
    } finally {
      setProcessingReview(false)
    }
  }

  const handleOpenAgreementModal = async () => {
    try {
      const res = await api.get('/admin/agreement-template/')
      setAgreementForm({
        judul: res.data?.judul || '',
        isi: res.data?.isi || '',
        catatan: res.data?.catatan || '',
        file_url: res.data?.file_url || '',
      })
      setShowAgreementModal(true)
    } catch {
      showToast('Gagal memuat template surat perjanjian.')
    }
  }

  const handleUploadAgreementWord = async (file) => {
    if (!file) return
    setUploadingAgreementFile(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'templates')
      const res = await api.post('/upload/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setAgreementForm((prev) => ({ ...prev, file_url: res.data.url }))
      showToast('File template Word/Dokumen berhasil diunggah!')
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal mengunggah file template surat.')
    } finally {
      setUploadingAgreementFile(false)
    }
  }

  const handleUploadAdminQris = async (file) => {
    if (!file) return
    setUploadingAdminQris(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'products')
      const res = await api.post('/upload/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setWebSettings((prev) => ({
        ...prev,
        payment_config: {
          ...(prev.payment_config || {}),
          qris_image_url: res.data.url,
        },
      }))
      showToast('Gambar QRIS berhasil diunggah!')
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal mengunggah gambar QRIS.')
    } finally {
      setUploadingAdminQris(false)
    }
  }

  const handleSaveAgreementTemplate = async (e) => {
    e.preventDefault()
    setSavingAgreement(true)
    try {
      const res = await api.post('/admin/agreement-template/', agreementForm)
      showToast(res.data.message || 'Format surat perjanjian berhasil disimpan!')
      setShowAgreementModal(false)
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menyimpan format surat perjanjian.')
    } finally {
      setSavingAgreement(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Hapus pengguna ini dari database?')) return
    try {
      await api.delete(`/admin/users/${userId}/delete/`)
      setUsersList(usersList.filter((u) => u.id !== userId))
      showToast('Pengguna berhasil dihapus.')
      loadAdminData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menghapus pengguna.')
    }
  }

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/admin/pesanan/${orderId}/status/`, { status: newStatus })
      showToast(res.data.message || 'Status pesanan diperbarui.')
      await loadAdminData()
      window.dispatchEvent(new CustomEvent('kampusloop:dataUpdated'))
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal memperbarui status pesanan.')
    }
  }

  const handleSaveWebSettings = async (e) => {
    e.preventDefault()
    setSavingWebSettings(true)
    try {
      const res = await api.post('/admin/settings/', {
        ...webSettings,
        apply_cod_to_admin_products: applyCodToAdminProducts,
      })
      if (res.data?.settings) {
        setWebSettings((prev) => ({ ...prev, ...res.data.settings }))
      }
      await loadAdminData()
      showToast(res.data?.message || 'Pengaturan web & lokasi COD berhasil disimpan!')
      window.dispatchEvent(new CustomEvent('kampusloop:settingsUpdated'))
      window.dispatchEvent(new CustomEvent('kampusloop:dataUpdated'))
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menyimpan pengaturan web.')
    } finally {
      setSavingWebSettings(false)
    }
  }

  const uploadArticleImage = async (file, isEdit = false) => {
    if (!file) return
    if (isEdit) setUploadingEditArticleImg(true)
    else setUploadingArticleImg(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'articles')
      const res = await api.post('/upload/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (isEdit) {
        setEditingArticle((prev) => ({ ...prev, gambar_url: res.data.url }))
      } else {
        setNewArticle((prev) => ({ ...prev, gambar_url: res.data.url }))
      }
      showToast('Gambar artikel berhasil diunggah!')
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal mengunggah gambar artikel.')
    } finally {
      if (isEdit) setUploadingEditArticleImg(false)
      else setUploadingArticleImg(false)
    }
  }

  const handleCreateArticle = async (e) => {
    e.preventDefault()
    setSavingNewArticle(true)
    try {
      const res = await api.post('/admin/artikel/create/', newArticle)
      showToast(res.data?.message || 'Artikel berhasil diterbitkan!')
      setShowAddArticle(false)
      setNewArticle({
        judul: '',
        kategori: 'Berita ModuLab',
        ringkasan: '',
        konten: '',
        gambar_url: '',
        status: 'published',
      })
      await loadAdminData()
      window.dispatchEvent(new CustomEvent('kampusloop:articlesUpdated'))
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menyimpan artikel.')
    } finally {
      setSavingNewArticle(false)
    }
  }

  const handleSaveEditArticle = async (e) => {
    e.preventDefault()
    if (!editingArticle) return
    setSavingEditArticle(true)
    try {
      const res = await api.put(`/admin/artikel/${editingArticle.id}/update/`, {
        judul: editingArticle.judul,
        kategori: editingArticle.kategori,
        ringkasan: editingArticle.ringkasan,
        konten: editingArticle.konten,
        gambar_url: editingArticle.gambar_url,
        status: editingArticle.status,
      })
      showToast(res.data?.message || 'Artikel berhasil diperbarui!')
      setEditingArticle(null)
      await loadAdminData()
      window.dispatchEvent(new CustomEvent('kampusloop:articlesUpdated'))
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal memperbarui artikel.')
    } finally {
      setSavingEditArticle(false)
    }
  }

  const handleDeleteArticle = async (id) => {
    if (!window.confirm('Hapus artikel ini secara permanen dari database?')) return
    try {
      const res = await api.delete(`/admin/artikel/${id}/delete/`)
      showToast(res.data?.message || 'Artikel berhasil dihapus.')
      setArticlesList(articlesList.filter((a) => a.id !== id))
      window.dispatchEvent(new CustomEvent('kampusloop:articlesUpdated'))
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menghapus artikel.')
    }
  }

  const handleExportReport = () => {
    const rows = [
      ['Metrik', 'Nilai'],
      ['Total Pengguna', stats.total_users ?? 0],
      ['Total Penjual', stats.total_sellers ?? 0],
      ['Produk Aktif', stats.active_products ?? 0],
      ['Produk Pending', stats.pending_products ?? 0],
      ['Produk Terjual', stats.sold_products ?? 0],
      ['Pesanan Selesai', stats.completed_orders ?? 0],
      ['GMV Marketplace', stats.gmv || 'Rp0'],
      ['Penghematan Mahasiswa', stats.total_savings_formatted || 'Rp0'],
      [],
      ['No Pesanan', 'Pembeli', 'Produk', 'Nilai (Rp)', 'Status'],
      ...ordersList.map((o) => [
        `#${o.order_number}`,
        o.pembeli_nama || '-',
        o.produk_nama || '-',
        o.harga_bayar || 0,
        o.status_display || o.status,
      ]),
    ]
    const csvContent = rows
      .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Laporan_KampusLoop_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Ekspor CSV laporan berhasil diunduh.')
  }

  const handleLogout = async () => {
    await logout()
    showToast('Admin logged out.')
    navigate('/')
  }

  const formatPrice = (p) => 'Rp' + Number(p || 0).toLocaleString('id-ID')

  const pendingProducts = productsList.filter((p) => p.status === 'pending')
  const approvedProducts = productsList.filter((p) => p.status === 'approved')
  const soldProducts = productsList.filter((p) => p.status === 'sold')
  const pendingSellers = usersList.filter((u) => u.status_pengajuan_penjual === 'pending')

  const displayedProducts = productsList.filter((p) => {
    if (productFilter !== 'all' && p.status !== productFilter) return false
    if (searchProduct) {
      const match = `${p.nama} ${p.kategori} ${p.seller_nama} ${p.deskripsi}`.toLowerCase()
      if (!match.includes(searchProduct.toLowerCase())) return false
    }
    return true
  })

  const filteredUsers = usersList.filter((u) => {
    if (userFilter === 'pending_seller' && u.status_pengajuan_penjual !== 'pending') return false
    if (userFilter === 'seller' && u.role !== 'seller') return false
    if (userFilter === 'user' && u.role !== 'user') return false
    if (userFilter === 'admin' && u.role !== 'admin') return false
    return `${u.name} ${u.email} ${u.campus} ${u.nim || ''}`.toLowerCase().includes(searchUser.toLowerCase())
  })

  const weeklyActivity = Array.isArray(stats.weekly_activity) && stats.weekly_activity.length > 0
    ? stats.weekly_activity
    : DEFAULT_WEEK
  const categoryBars = Array.isArray(stats.kategori_breakdown) ? stats.kategori_breakdown : []

  return (
    <main className="dashboard-page admin-dashboard-page">
      <div className="dashboard-wrap">
        {/* ─── ADMIN SIDEBAR ──────────────────────────────────────── */}
        <aside className="dash-sidebar admin-sidebar">
          <Link to="/" className="dash-brand">
            <span className="brand-mark">∞</span>
            <span>
              Kampus<span>Loop</span>
              <small>ADMIN CONSOLE</small>
            </span>
          </Link>

          <div className="admin-mode-card">
            <span className="admin-shield">
              <ShieldCheck size={16} />
            </span>
            <div>
              <strong>Admin Web</strong>
              <small>Control center · Live</small>
            </div>
          </div>

          <span className="dash-nav-label">MANAGEMENT</span>
          <button
            className={`dash-nav ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutGrid size={15} /> Overview
          </button>
          <button
            className={`dash-nav ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={15} /> Produk Katalog{' '}
            {pendingProducts.length > 0 && (
              <i className="nav-alert">{pendingProducts.length}</i>
            )}
          </button>
          <button
            className={`dash-nav ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={15} /> Pengguna{' '}
            {pendingSellers.length > 0 ? (
              <i className="nav-alert">{pendingSellers.length}</i>
            ) : (
              <i>{usersList.length}</i>
            )}
          </button>
          <button
            className={`dash-nav ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <ArrowUpRight size={15} /> Transaksi <i>{ordersList.length}</i>
          </button>
          <button
            className={`dash-nav ${activeTab === 'artikel' ? 'active' : ''}`}
            onClick={() => setActiveTab('artikel')}
          >
            <PenLine size={15} /> Artikel <i>{articlesList.length}</i>
          </button>

          <span className="dash-nav-label">INSIGHTS</span>
          <button
            className={`dash-nav ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <BarChart3 size={15} /> Laporan
          </button>
          <button
            className={`dash-nav ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={15} /> Setting Web
          </button>

          <div className="dash-sidebar-bottom">
            <div className="help-card admin-help">
              <span><Headphones size={15} /></span>
              <strong>Admin support</strong>
              <small>Sistem marketplace terpantau aman dan terverifikasi.</small>
            </div>
            <button className="dash-logout" onClick={handleLogout}>
              <LogOut size={15} /> Keluar admin
            </button>
          </div>
        </aside>

        {/* ─── ADMIN MAIN ─────────────────────────────────────────── */}
        <div className="dash-main">
          {/* Topbar */}
          <div className="dash-topbar">
            <div>
              <span className="eyebrow">Platform management</span>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Admin Overview</span>
                <Sparkles size={20} style={{ color: 'var(--green)' }} />
              </h1>
              <p>Monitor aktivitas, moderasi barang, validasi penjual, dan performa marketplace KampusLoop.</p>
            </div>
            <div className="dash-top-actions">
              <span className="admin-live-dot">SYSTEM ONLINE</span>
              <span className="profile-initial small admin-initial">
                {(user?.name ? user.name[0] : 'A').toUpperCase()}
              </span>
            </div>
          </div>

          <div className="dash-content">
            {/* ─── TAB: OVERVIEW ──────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="dash-panel active">
                <div className="admin-welcome">
                  <div>
                    <span className="eyebrow">Real-Time Platform Pulse</span>
                    <h2>
                      Everything is<br />
                      <em>in the loop.</em>
                    </h2>
                    <p>Berikut ringkasan performa dan kesehatan ekosistem kampus langsung dari database Supabase.</p>
                  </div>
                  <div className="admin-welcome-mark">∞</div>
                </div>

                <div className="dash-stat-grid admin-stat-grid">
                  <article className="dash-stat">
                    <span>Total pengguna</span>
                    <strong>{stats.total_users ?? 0}</strong>
                    <small>{stats.total_sellers ?? 0} penjual · {stats.total_regular_users ?? 0} user</small>
                    <i><Users size={16} /></i>
                  </article>
                  <article className="dash-stat">
                    <span>Produk aktif</span>
                    <strong>{stats.active_products ?? 0}</strong>
                    <small>{productsList.length} total · {stats.pending_products ?? 0} pending</small>
                    <i><Package size={16} /></i>
                  </article>
                  <article className="dash-stat">
                    <span>Transaksi selesai</span>
                    <strong>{stats.completed_orders ?? 0}</strong>
                    <small>{ordersList.length} total pesanan tercatat</small>
                    <i><ArrowUpRight size={16} /></i>
                  </article>
                  <article className="dash-stat accent-stat">
                    <span>GMV marketplace</span>
                    <strong>{stats.gmv || 'Rp0'}</strong>
                    <small>Perputaran ekonomi mahasiswa</small>
                    <i><Sparkles size={16} /></i>
                  </article>
                </div>

                {/* Performance Chart & Insight */}
                <div className="admin-overview-grid">
                  <div className="admin-chart-card">
                    <div className="dash-section-row">
                      <div>
                        <span className="eyebrow">Marketplace performance</span>
                        <h2>Aktivitas transaksi & katalog mingguan</h2>
                      </div>
                      <span className="chart-period">Data Live DB</span>
                    </div>

                    <div className="bar-chart" aria-label="Grafik aktivitas transaksi">
                      {weeklyActivity.map((item) => (
                        <div key={item.day} className="bar-col" title={`${item.day}: ${item.count} aktivitas`}>
                          <i style={{ '--h': `${item.pct}%` }} />
                          <small>{item.day}</small>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="admin-insight-card">
                    <span className="insight-icon"><Sparkles size={18} /></span>
                    <span className="eyebrow">Circular impact</span>
                    <h3>Barang terus berputar.</h3>
                    <strong>
                      {stats.reuse_count ?? 0} <small>barang reuse</small>
                    </strong>
                    <p>
                      Barang preloved yang berhasil terjual/selesai dan terus dimanfaatkan mahasiswa.
                    </p>
                    <button className="text-link" onClick={() => setActiveTab('reports')}>
                      Lihat laporan lengkap →
                    </button>
                  </div>
                </div>

                {/* Seller Applications Quick Alert */}
                {pendingSellers.length > 0 && (
                  <div style={{ marginBottom: '22px', padding: '16px 20px', background: '#fff', border: '1px solid var(--line)', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span className="status-pill status-orange">⏳ {pendingSellers.length} Pengajuan Penjual Baru</span>
                      <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--muted)' }}>
                        Ada mahasiswa yang mengunggah berkas validasi & surat perjanjian untuk menjadi Penjual.
                      </p>
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '10px' }}
                      onClick={() => {
                        setActiveTab('users')
                        setUserFilter('pending_seller')
                      }}
                    >
                      Tinjau Pengajuan Penjual →
                    </button>
                  </div>
                )}

                {/* Moderation preview */}
                <div className="dash-section-row">
                  <div>
                    <span className="eyebrow">Needs attention</span>
                    <h2>Menunggu moderasi ({pendingProducts.length})</h2>
                  </div>
                  <button className="text-link" onClick={() => setActiveTab('products')}>
                    Kelola semua →
                  </button>
                </div>

                <div className="admin-pending-preview">
                  {pendingProducts.length > 0 ? (
                    pendingProducts.slice(0, 3).map((item) => (
                      <div key={item.id} className="pending-mini" style={{ justifyContent: 'space-between', padding: '12px', gap: '12px' }}>
                        <img
                          src={
                            item.foto_display ||
                            item.foto_url ||
                            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=120'
                          }
                          alt={item.nama}
                          style={{ width: '54px', height: '54px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: '12px', color: 'var(--ink)', marginBottom: '2px' }} title={item.nama}>
                            {item.nama}
                          </strong>
                          <small style={{ fontSize: '10px', color: 'var(--green)', fontWeight: 700, marginTop: 0 }}>
                            {formatPrice(item.harga)} · {item.kategori}
                          </small>
                          <small style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>
                            Oleh: {item.seller_nama || 'Admin Web'}
                          </small>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }}>
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: '9px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleApprove(item.id)}
                          >
                            <Check size={11} strokeWidth={2.5} />
                            <span>Setujui</span>
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ fontSize: '9px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleReject(item.id)}
                          >
                            <X size={11} strokeWidth={2.4} />
                            <span>Tolak</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: '1 / -1', padding: '22px', background: '#fff', borderRadius: '14px', border: '1px solid var(--line)', color: 'var(--muted)', fontSize: '11px' }}>
                      Semua barang sudah dimoderasi dan disetujui.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── TAB: MODERASI & KATALOG PRODUK ────────────────── */}
            {activeTab === 'products' && (
              <div className="dash-panel active">
                <div className="dash-section-row page-dash-heading">
                  <div>
                    <span className="eyebrow">Marketplace quality control</span>
                    <h2>Produk Katalog Platform</h2>
                    <p>Kelola seluruh produk di katalog KampusLoop: tambah langsung (tanpa tunggu verifikasi), edit detail lengkap, upload gambar, atau moderasi.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="status-pill status-orange">
                      {pendingProducts.length} perlu ditinjau · {productsList.length} total produk
                    </span>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowAddProduct(!showAddProduct)}
                    >
                      {showAddProduct ? 'Tutup Formulir' : '+ Tambah Produk'}
                    </button>
                  </div>
                </div>

                {/* Admin Web Direct Add Product Form (Immediately Approved) */}
                {showAddProduct && (
                  <div className="listing-form-card show" style={{ marginBottom: '22px' }}>
                    <div className="dash-section-row">
                      <div>
                        <span className="eyebrow">Admin Web · Langsung Tayang</span>
                        <h2>Tambah Produk Katalog Baru</h2>
                      </div>
                      <button className="dash-icon-button" onClick={() => setShowAddProduct(false)}>
                        ×
                      </button>
                    </div>

                    <form className="listing-form" onSubmit={handleAdminCreateProduct}>
                      <div className="form-row">
                        <div className="field">
                          <label>Nama Produk</label>
                          <input
                            required
                            placeholder="Contoh: Kalkulator Casio FX-991EX"
                            value={newProduct.nama}
                            onChange={(e) => setNewProduct({ ...newProduct, nama: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label>Kategori</label>
                          <select
                            value={newProduct.kategori}
                            onChange={(e) => setNewProduct({ ...newProduct, kategori: e.target.value })}
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
                          <label>Harga Jual (Rp)</label>
                          <input
                            type="number"
                            min="1000"
                            required
                            placeholder="150000"
                            value={newProduct.harga}
                            onChange={(e) => setNewProduct({ ...newProduct, harga: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label>Harga Asli / Coret (Rp, opsional)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="250000"
                            value={newProduct.harga_asli}
                            onChange={(e) => setNewProduct({ ...newProduct, harga_asli: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="field">
                          <label>Kondisi</label>
                          <select
                            value={newProduct.kondisi}
                            onChange={(e) => setNewProduct({ ...newProduct, kondisi: e.target.value })}
                          >
                            <option>Like New</option>
                            <option>Good</option>
                            <option>Fair</option>
                          </select>
                        </div>
                        <div className="field">
                          <label>Lokasi / Kampus</label>
                          <input
                            placeholder="Contoh: Makassar"
                            value={newProduct.lokasi}
                            onChange={(e) => setNewProduct({ ...newProduct, lokasi: e.target.value })}
                          />
                        </div>
                      </div>

                      <CodLocationManager
                        label="Opsi Titik Lokasi COD Produk"
                        value={newProduct.cod_lokasi || ''}
                        onChange={(nextVal) => setNewProduct({ ...newProduct, cod_lokasi: nextVal })}
                        helperText="Kosongkan jika ingin mengikuti opsi lokasi COD default dari Setting Web."
                      />

                      <div className="form-row">
                        <div className="field">
                          <label>Upload Gambar Produk</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => uploadProductImage(e.target.files?.[0], false)}
                          />
                          {uploadingNewPhoto && <small style={{ color: 'var(--muted)' }}>Mengunggah foto...</small>}
                        </div>
                        <div className="field">
                          <label>Atau URL Foto Produk</label>
                          <input
                            placeholder="https://..."
                            value={newProduct.foto_url}
                            onChange={(e) => setNewProduct({ ...newProduct, foto_url: e.target.value })}
                          />
                        </div>
                      </div>

                      {newProduct.foto_url && (
                        <div style={{ marginBottom: '12px' }}>
                          <img
                            src={newProduct.foto_url}
                            alt="Preview"
                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--line)' }}
                          />
                        </div>
                      )}

                      <div className="field">
                        <label>Deskripsi Lengkap</label>
                        <textarea
                          required
                          placeholder="Detail kondisi barang, kelengkapan, dan catatan COD..."
                          value={newProduct.deskripsi}
                          onChange={(e) => setNewProduct({ ...newProduct, deskripsi: e.target.value })}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={savingNewProduct || uploadingNewPhoto}
                      >
                        {savingNewProduct ? 'Menyimpan...' : 'Publikasikan Langsung ke Katalog ↗'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Filter and Search Bar */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      className={`btn ${productFilter === 'all' ? 'btn-dark' : 'btn-outline'}`}
                      style={{ fontSize: '10px', padding: '6px 12px' }}
                      onClick={() => setProductFilter('all')}
                    >
                      Semua ({productsList.length})
                    </button>
                    <button
                      className={`btn ${productFilter === 'pending' ? 'btn-dark' : 'btn-outline'}`}
                      style={{ fontSize: '10px', padding: '6px 12px' }}
                      onClick={() => setProductFilter('pending')}
                    >
                      Menunggu Review ({pendingProducts.length})
                    </button>
                    <button
                      className={`btn ${productFilter === 'approved' ? 'btn-dark' : 'btn-outline'}`}
                      style={{ fontSize: '10px', padding: '6px 12px' }}
                      onClick={() => setProductFilter('approved')}
                    >
                      Aktif di Katalog ({approvedProducts.length})
                    </button>
                    <button
                      className={`btn ${productFilter === 'sold' ? 'btn-dark' : 'btn-outline'}`}
                      style={{ fontSize: '10px', padding: '6px 12px' }}
                      onClick={() => setProductFilter('sold')}
                    >
                      Terjual ({soldProducts.length})
                    </button>
                  </div>
                  <div className="dash-search" style={{ margin: 0, maxWidth: '240px' }}>
                    <span>⌕</span>
                    <input
                      placeholder="Cari produk katalog..."
                      value={searchProduct}
                      onChange={(e) => setSearchProduct(e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-product-list">
                  {displayedProducts.length > 0 ? (
                    displayedProducts.map((p) => (
                      <div key={p.id} className="admin-product-item" style={{ padding: '16px', background: '#fff', border: '1px solid var(--line)', borderRadius: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <img
                          src={
                            p.foto_display ||
                            p.foto_url ||
                            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150'
                          }
                          alt=""
                          style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '12px' }}
                        />
                        <div style={{ flex: 1, minWidth: '220px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span className={`status-pill ${
                              p.status === 'approved' ? 'status-green' :
                              p.status === 'pending' ? 'status-orange' :
                              p.status === 'sold' ? 'status-pill' : 'status-red'
                            }`} style={p.status === 'rejected' ? { background: '#fee2e2', color: '#991b1b' } : {}}>
                              {p.status === 'approved' ? 'Aktif di Katalog' :
                               p.status === 'pending' ? 'Menunggu Review' :
                               p.status === 'sold' ? 'Terjual' : 'Ditolak'}
                            </span>
                            <span className="status-pill status-orange" style={{ fontSize: '9px' }}>{p.kondisi}</span>
                            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{p.kategori}</span>
                          </div>
                          <strong style={{ fontSize: '13px', display: 'block' }}>{p.nama}</strong>
                          <p style={{ margin: '4px 0', fontSize: '10px', color: 'var(--muted)' }}>
                            {p.deskripsi}
                          </p>
                          <small style={{ color: 'var(--green)', fontWeight: 800 }}>
                            {formatPrice(p.harga)}
                            {p.harga_asli ? ` (Asli: ${formatPrice(p.harga_asli)})` : ''} · Pemilik: {p.seller_nama || 'Admin Web'} ({p.lokasi || p.seller_kampus || 'KampusLoop'})
                          </small>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-outline"
                            style={{ fontSize: '10px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setEditingProduct({ ...p })}
                          >
                            <PenLine size={11} strokeWidth={2.2} />
                            <span>Edit</span>
                          </button>
                          {p.status === 'pending' && (
                            <>
                              <button
                                className="btn btn-primary"
                                style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => handleApprove(p.id)}
                              >
                                <Check size={11} strokeWidth={2.4} />
                                <span>Setujui</span>
                              </button>
                              <button
                                className="btn btn-outline"
                                style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => handleReject(p.id)}
                              >
                                <X size={11} strokeWidth={2.4} />
                                <span>Tolak</span>
                              </button>
                            </>
                          )}
                          {p.status === 'rejected' && (
                            <button
                              className="btn btn-primary"
                              style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleApprove(p.id)}
                            >
                              <Check size={11} strokeWidth={2.4} />
                              <span>Setujui</span>
                            </button>
                          )}
                          {p.status === 'approved' && (
                            <button
                              className="btn btn-outline"
                              style={{ fontSize: '10px' }}
                              onClick={() => handleReject(p.id)}
                            >
                              Nonaktifkan
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            style={{
                              border: 0,
                              background: 'none',
                              color: '#c64e46',
                              cursor: 'pointer',
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '6px',
                            }}
                            title="Hapus dari database"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state" style={{ padding: '50px 20px' }}>
                      <strong style={{ fontSize: '14px' }}>Tidak ada produk yang sesuai filter.</strong>
                      <p style={{ fontSize: '11px', margin: '6px 0 0' }}>
                        Coba pilih filter lain atau cari nama produk yang berbeda.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── TAB: PENGGUNA ──────────────────────────────────── */}
            {activeTab === 'users' && (
              <div className="dash-panel active">
                <div className="dash-section-row page-dash-heading">
                  <div>
                    <span className="eyebrow">Community & role management</span>
                    <h2>Pengguna, Role & Validasi Penjual</h2>
                    <p>Kelola 3 peran akun (Admin Web, Penjual, User), tinjau berkas pengajuan penjual, dan atur format surat perjanjian.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-outline"
                      onClick={handleOpenAgreementModal}
                      style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Settings size={13} strokeWidth={2.2} />
                      <span>Atur Surat Perjanjian</span>
                    </button>
                    <div className="dash-search" style={{ margin: 0 }}>
                      <span><Search size={14} /></span>
                      <input
                        placeholder="Cari pengguna / NIM..."
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Role / application filter pills */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <button
                    className={`btn ${userFilter === 'all' ? 'btn-dark' : 'btn-outline'}`}
                    style={{ fontSize: '10px', padding: '6px 12px' }}
                    onClick={() => setUserFilter('all')}
                  >
                    Semua ({usersList.length})
                  </button>
                  <button
                    className={`btn ${userFilter === 'pending_seller' ? 'btn-dark' : 'btn-outline'}`}
                    style={{ fontSize: '10px', padding: '6px 12px' }}
                    onClick={() => setUserFilter('pending_seller')}
                  >
                    Pengajuan Penjual ({pendingSellers.length})
                  </button>
                  <button
                    className={`btn ${userFilter === 'seller' ? 'btn-dark' : 'btn-outline'}`}
                    style={{ fontSize: '10px', padding: '6px 12px' }}
                    onClick={() => setUserFilter('seller')}
                  >
                    Penjual ({usersList.filter((u) => u.role === 'seller').length})
                  </button>
                  <button
                    className={`btn ${userFilter === 'user' ? 'btn-dark' : 'btn-outline'}`}
                    style={{ fontSize: '10px', padding: '6px 12px' }}
                    onClick={() => setUserFilter('user')}
                  >
                    User ({usersList.filter((u) => u.role === 'user').length})
                  </button>
                  <button
                    className={`btn ${userFilter === 'admin' ? 'btn-dark' : 'btn-outline'}`}
                    style={{ fontSize: '10px', padding: '6px 12px' }}
                    onClick={() => setUserFilter('admin')}
                  >
                    Admin Web ({usersList.filter((u) => u.role === 'admin').length})
                  </button>
                </div>

                <div className="dash-table-card">
                  <div className="table-scroll">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>Pengguna</th>
                          <th>Kampus & NIM</th>
                          <th>Peran & Berkas Penjual</th>
                          <th>Kelola Role & Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((u) => (
                            <tr key={u.id}>
                              <td>
                                <span className="table-product">
                                  <span className="profile-initial small">
                                    {(u.name ? u.name[0] : 'U').toUpperCase()}
                                  </span>
                                  <span>
                                    <b>{u.name}</b>
                                    <small>{u.email}</small>
                                    {u.telp && <small style={{ display: 'block', color: 'var(--muted)' }}>WA: {u.telp}</small>}
                                  </span>
                                </span>
                              </td>
                              <td>
                                <div>{u.campus || u.kampus || '-'}</div>
                                {u.nim && <small style={{ color: 'var(--muted)' }}>NIM: {u.nim}</small>}
                              </td>
                              <td>
                                <div>
                                  <span
                                    className={`status-pill ${
                                      u.role === 'admin' || u.is_superuser
                                        ? 'status-orange'
                                        : u.role === 'seller'
                                          ? 'status-green'
                                          : ''
                                    }`}
                                  >
                                    {u.is_superuser
                                      ? 'Super Admin (Admin Web)'
                                      : u.role === 'admin'
                                        ? 'Admin Web'
                                        : u.role === 'seller'
                                          ? 'Penjual'
                                          : 'User (Pembeli)'}
                                  </span>

                                  {u.status_pengajuan_penjual === 'pending' && (
                                    <div style={{ marginTop: '5px' }}>
                                      <span className="status-pill status-orange" style={{ fontSize: '9px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={10} /> Mengajukan Penjual
                                      </span>
                                    </div>
                                  )}
                                  {u.status_pengajuan_penjual === 'approved' && u.role === 'seller' && (
                                    <small style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--green)', marginTop: '4px' }}>
                                      <Check size={11} strokeWidth={2.4} /> Berkas & Surat Terverifikasi
                                    </small>
                                  )}
                                  {u.status_pengajuan_penjual === 'rejected' && (
                                    <small style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#c64e46', marginTop: '4px' }}>
                                      <X size={11} strokeWidth={2.4} /> Pengajuan Penjual Ditolak
                                    </small>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  {(u.pengajuan_penjual || u.ktm_url || u.surat_perjanjian_url) && (
                                    <button
                                      onClick={() => {
                                        setReviewingUser(u)
                                        setReviewNote(u.catatan_admin_penjual || '')
                                      }}
                                      className="btn btn-primary"
                                      style={{ fontSize: '9px', padding: '5px 10px' }}
                                    >
                                      Tinjau Berkas
                                    </button>
                                  )}

                                  {!u.is_superuser && (
                                    <select
                                      className="selectbox"
                                      style={{ fontSize: '10px', padding: '5px 8px', minWidth: '115px' }}
                                      value={u.role || 'user'}
                                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                      aria-label={`Ubah role ${u.name}`}
                                    >
                                      <option value="user">User</option>
                                      <option value="seller">Penjual</option>
                                      <option value="admin">Admin Web</option>
                                    </select>
                                  )}

                                  {!u.is_superuser && (
                                    <button
                                      onClick={() => handleDeleteUser(u.id)}
                                      style={{
                                        border: 0,
                                        background: 'none',
                                        color: '#c64e46',
                                        cursor: 'pointer',
                                        fontSize: '10px',
                                        fontWeight: 800,
                                      }}
                                    >
                                      Hapus
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                              Tidak ada pengguna ditemukan.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB: TRANSAKSI ─────────────────────────────────── */}
            {activeTab === 'transactions' && (
              <div className="dash-panel active">
                <div className="dash-section-row page-dash-heading">
                  <div>
                    <span className="eyebrow">Commerce activity</span>
                    <h2>Transaksi marketplace</h2>
                    <p>Semua pesanan dan transaksi COD sesama mahasiswa dari database Supabase.</p>
                  </div>
                  <span className="status-pill status-green">Live Data</span>
                </div>

                <div className="dash-table-card">
                  <div className="table-scroll">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>ID Pesanan</th>
                          <th>Pembeli</th>
                          <th>Produk</th>
                          <th>Pengiriman & Pembayaran</th>
                          <th>Nilai</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordersList.length > 0 ? (
                          ordersList.map((o) => (
                            <tr key={o.id}>
                              <td>
                                <b>#{o.order_number}</b>
                              </td>
                              <td>{o.pembeli_nama || 'Mahasiswa'}</td>
                              <td>{o.produk_nama}</td>
                              <td>
                                <small style={{ display: 'block', fontWeight: 700, color: 'var(--ink)' }}>
                                  {(o.payment_method || 'COD').toUpperCase()} ·{' '}
                                  {o.delivery_type === 'delivery' || o.delivery_type === 'antar'
                                    ? 'Antar Alamat'
                                    : 'COD'}
                                </small>
                                <small style={{ display: 'block', color: 'var(--muted)' }}>
                                  {o.delivery_type === 'delivery' || o.delivery_type === 'antar'
                                    ? `${o.shipping_address || '-'}${o.kode_pos ? ` (${o.kode_pos})` : ''}`
                                    : o.cod_location || '-'}
                                </small>
                              </td>
                              <td>
                                <b>{formatPrice(o.harga_bayar)}</b>
                              </td>
                              <td>
                                <select
                                  className="selectbox"
                                  style={{ fontSize: '10px', padding: '5px 8px' }}
                                  value={o.status}
                                  onChange={(e) => handleOrderStatusChange(o.id, e.target.value)}
                                >
                                  <option value="pending">Menunggu Konfirmasi</option>
                                  <option value="confirmed">Dikonfirmasi</option>
                                  <option value="cod_waiting">Menunggu COD</option>
                                  <option value="completed">Selesai</option>
                                  <option value="cancelled">Dibatalkan</option>
                                </select>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '28px', color: 'var(--muted)' }}>
                              Belum ada transaksi pesanan di database.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB: LAPORAN ───────────────────────────────────── */}
            {activeTab === 'reports' && (
              <div className="dash-panel active">
                <div className="dash-section-row page-dash-heading">
                  <div>
                    <span className="eyebrow">Data & impact intelligence</span>
                    <h2>Laporan performa marketplace</h2>
                    <p>Metrik pertumbuhan dan dampak nyata circular economy kampus tersinkronisasi langsung dengan database.</p>
                  </div>
                  <button
                    className="btn btn-outline"
                    onClick={handleExportReport}
                  >
                    ↓ Export laporan
                  </button>
                </div>

                <div className="report-grid">
                  <article className="report-card">
                    <span>Total nilai perputaran</span>
                    <strong>{stats.gmv || 'Rp0'}</strong>
                    <small>GMV marketplace berputar</small>
                  </article>
                  <article className="report-card">
                    <span>Barang digunakan kembali</span>
                    <strong>{stats.reuse_count ?? 0}</strong>
                    <small>Terserap kembali ke mahasiswa</small>
                  </article>
                  <article className="report-card">
                    <span>Penghematan mahasiswa</span>
                    <strong>{stats.total_savings_formatted || 'Rp0'}</strong>
                    <small>Selisih harga produk baru</small>
                  </article>
                  <article className="report-card">
                    <span>Tingkat serapan katalog</span>
                    <strong>{stats.activity_rate ?? 0}%</strong>
                    <small>Produk aktif & terjual di platform</small>
                  </article>
                </div>

                <div className="admin-chart-card report-chart" style={{ marginTop: '20px' }}>
                  <div className="dash-section-row">
                    <div>
                      <span className="eyebrow">Category distribution</span>
                      <h2>Distribusi produk per kategori</h2>
                    </div>
                  </div>
                  <div className="category-bars">
                    {categoryBars.length > 0 ? (
                      categoryBars.map((cat) => (
                        <div key={cat.kategori}>
                          <span>{cat.kategori}</span>
                          <i><b style={{ width: `${cat.percentage}%` }} /></i>
                          <strong>{cat.percentage}%</strong>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: 'var(--muted)', fontSize: '11px' }}>Belum ada data produk.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB: SETTING WEB ───────────────────────────────── */}
            {activeTab === 'settings' && (
              <div className="dash-panel active">
                <div className="dash-section-row page-dash-heading">
                  <div>
                    <span className="eyebrow">Website configuration</span>
                    <h2>Setting Web, Kontak, Footer & Kebijakan</h2>
                    <p>Atur informasi platform, nomor WhatsApp, email, media sosial pada Contact & Footer, serta isi Kebijakan Privasi dan halaman legal.</p>
                  </div>
                  <span className={`status-pill ${webSettings.status_toko === 'ONLINE' ? 'status-green' : 'status-orange'}`}>
                    ● {webSettings.status_toko || 'ONLINE'}
                  </span>
                </div>

                <form onSubmit={handleSaveWebSettings} style={{ display: 'grid', gap: '20px' }}>
                  {/* Identitas & Status */}
                  <div className="listing-form-card show">
                    <div className="dash-section-row">
                      <div>
                        <span className="eyebrow">Platform identity</span>
                        <h2>Identitas Web & Pengumuman</h2>
                      </div>
                    </div>
                    <div className="listing-form">
                      <div className="form-row">
                        <div className="field">
                          <label>Nama Platform / Web</label>
                          <input
                            required
                            value={webSettings.nama_toko || ''}
                            onChange={(e) => setWebSettings({ ...webSettings, nama_toko: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label>Tagline Platform</label>
                          <input
                            value={webSettings.tagline || ''}
                            onChange={(e) => setWebSettings({ ...webSettings, tagline: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="field">
                          <label>Status Platform</label>
                          <select
                            value={webSettings.status_toko || 'ONLINE'}
                            onChange={(e) => setWebSettings({ ...webSettings, status_toko: e.target.value })}
                          >
                            <option value="ONLINE">ONLINE</option>
                            <option value="OFFLINE">OFFLINE (Maintenance)</option>
                          </select>
                        </div>
                        <div className="field">
                          <label>Banner Pengumuman</label>
                          <input
                            value={webSettings.banner_pengumuman || ''}
                            onChange={(e) => setWebSettings({ ...webSettings, banner_pengumuman: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Kontak & Media Sosial */}
                  <div className="listing-form-card show">
                    <div className="dash-section-row">
                      <div>
                        <span className="eyebrow">Contact & social media</span>
                        <h2>Kontak, Nomor & Media Sosial</h2>
                      </div>
                    </div>
                    <div className="listing-form">
                      <div className="form-row">
                        <div className="field">
                          <label>Email Support (Halaman Contact & Footer)</label>
                          <input
                            type="email"
                            required
                            value={webSettings.email_support || ''}
                            onChange={(e) => setWebSettings({ ...webSettings, email_support: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label>Nomor WhatsApp / Telepon</label>
                          <input
                            placeholder="Contoh: +62 812-3456-7890"
                            value={webSettings.no_wa || ''}
                            onChange={(e) => setWebSettings({ ...webSettings, no_wa: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="field">
                          <label>Instagram Handle</label>
                          <input
                            placeholder="@kampusloop"
                            value={webSettings.instagram_handle || ''}
                            onChange={(e) => setWebSettings({ ...webSettings, instagram_handle: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label>Link URL Instagram (Footer)</label>
                          <input
                            type="url"
                            placeholder="https://instagram.com/..."
                            value={webSettings.instagram_url || ''}
                            onChange={(e) => setWebSettings({ ...webSettings, instagram_url: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="field">
                          <label>Link URL TikTok (Footer)</label>
                          <input
                            type="url"
                            placeholder="https://tiktok.com/..."
                            value={webSettings.tiktok_url || ''}
                            onChange={(e) => setWebSettings({ ...webSettings, tiktok_url: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label>Telegram Handle (Halaman Contact)</label>
                          <input
                            placeholder="@kampusloop"
                            value={webSettings.telegram_handle || ''}
                            onChange={(e) => setWebSettings({ ...webSettings, telegram_handle: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="field">
                        <label>Alamat / Campus Hub (Halaman Contact)</label>
                        <input
                          value={webSettings.alamat || ''}
                          onChange={(e) => setWebSettings({ ...webSettings, alamat: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Website */}
                  <div className="listing-form-card show">
                    <div className="dash-section-row">
                      <div>
                        <span className="eyebrow">Footer layout text</span>
                        <h2>Konten Footer Website</h2>
                      </div>
                    </div>
                    <div className="listing-form">
                      <div className="field">
                        <label>Deskripsi Singkat di Footer</label>
                        <textarea
                          rows={2}
                          value={webSettings.footer_deskripsi || ''}
                          onChange={(e) => setWebSettings({ ...webSettings, footer_deskripsi: e.target.value })}
                        />
                      </div>

                      <div className="form-row">
                        <div className="field">
                          <label>Teks Copyright Footer</label>
                          <input
                            value={webSettings.footer_copyright || ''}
                            onChange={(e) => setWebSettings({ ...webSettings, footer_copyright: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label>Tagline Bawah Footer</label>
                          <input
                            value={webSettings.footer_tagline_bawah || ''}
                            onChange={(e) => setWebSettings({ ...webSettings, footer_tagline_bawah: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Kebijakan Privasi & Halaman Legal Footer */}
                  <div className="listing-form-card show">
                    <div className="dash-section-row">
                      <div>
                        <span className="eyebrow">Legal & policy pages (Footer)</span>
                        <h2>Kebijakan Privasi, Syarat & Ketentuan & Panduan Keamanan</h2>
                      </div>
                    </div>
                    <div className="listing-form">
                      <div className="field">
                        <label>Judul Kebijakan Privasi</label>
                        <input
                          value={webSettings.kebijakan_privasi_judul || ''}
                          onChange={(e) => setWebSettings({ ...webSettings, kebijakan_privasi_judul: e.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label>Isi Kebijakan Privasi</label>
                        <textarea
                          rows={6}
                          value={webSettings.kebijakan_privasi_isi || ''}
                          onChange={(e) => setWebSettings({ ...webSettings, kebijakan_privasi_isi: e.target.value })}
                        />
                      </div>

                      <div className="field">
                        <label>Judul Syarat & Ketentuan</label>
                        <input
                          value={webSettings.syarat_ketentuan_judul || ''}
                          onChange={(e) => setWebSettings({ ...webSettings, syarat_ketentuan_judul: e.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label>Isi Syarat & Ketentuan</label>
                        <textarea
                          rows={6}
                          value={webSettings.syarat_ketentuan_isi || ''}
                          onChange={(e) => setWebSettings({ ...webSettings, syarat_ketentuan_isi: e.target.value })}
                        />
                      </div>

                      <div className="field">
                        <label>Judul Panduan Keamanan Transaksi</label>
                        <input
                          value={webSettings.panduan_keamanan_judul || ''}
                          onChange={(e) => setWebSettings({ ...webSettings, panduan_keamanan_judul: e.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label>Isi Panduan Keamanan Transaksi</label>
                        <textarea
                          rows={5}
                          value={webSettings.panduan_keamanan_isi || ''}
                          onChange={(e) => setWebSettings({ ...webSettings, panduan_keamanan_isi: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Metode Pembayaran & Lokasi COD Platform */}
                  <div className="listing-form-card show">
                    <div className="dash-section-row">
                      <div>
                        <span className="eyebrow">Payment & COD defaults</span>
                        <h2>Metode Pembayaran & Lokasi COD Platform</h2>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                          Pengaturan default metode pembayaran (COD, QRIS, Transfer Bank) dan titik lokasi COD untuk produk milik Admin Web / fallback toko.
                        </p>
                      </div>
                    </div>
                    <div className="listing-form">
                      <div className="form-row">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={webSettings.payment_config?.cod_enabled !== false}
                            onChange={(e) =>
                              setWebSettings((prev) => ({
                                ...prev,
                                payment_config: { ...(prev.payment_config || {}), cod_enabled: e.target.checked },
                              }))
                            }
                          />
                          Aktifkan COD (Bayar di Tempat)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={Boolean(webSettings.payment_config?.qris_enabled)}
                            onChange={(e) =>
                              setWebSettings((prev) => ({
                                ...prev,
                                payment_config: { ...(prev.payment_config || {}), qris_enabled: e.target.checked },
                              }))
                            }
                          />
                          Aktifkan QRIS
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={Boolean(webSettings.payment_config?.bank_enabled)}
                            onChange={(e) =>
                              setWebSettings((prev) => ({
                                ...prev,
                                payment_config: { ...(prev.payment_config || {}), bank_enabled: e.target.checked },
                              }))
                            }
                          />
                          Aktifkan Transfer Bank
                        </label>
                      </div>

                      <CodLocationManager
                        label="Daftar Titik Lokasi COD Default Kampus"
                        value={webSettings.payment_config?.cod_locations || ''}
                        onChange={(nextVal) =>
                          setWebSettings((prev) => ({
                            ...prev,
                            payment_config: { ...(prev.payment_config || {}), cod_locations: nextVal },
                          }))
                        }
                        helperText="Daftar titik COD ini dipakai sebagai default untuk seluruh produk platform dan fallback toko."
                      />

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={applyCodToAdminProducts}
                          onChange={(e) => setApplyCodToAdminProducts(e.target.checked)}
                        />
                        <span>Terapkan daftar lokasi COD ini ke semua produk milik Admin Web</span>
                      </label>

                      {webSettings.payment_config?.qris_enabled && (
                        <div className="form-row" style={{ background: '#f8fbf8', padding: '14px', borderRadius: '14px', border: '1px solid var(--line)' }}>
                          <div className="field">
                            <label>Label / Nama Merchant QRIS</label>
                            <input
                              placeholder="Contoh: KampusLoop Official QRIS"
                              value={webSettings.payment_config?.qris_label || ''}
                              onChange={(e) =>
                                setWebSettings((prev) => ({
                                  ...prev,
                                  payment_config: { ...(prev.payment_config || {}), qris_label: e.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="field">
                            <label>Upload Gambar QRIS</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUploadAdminQris(e.target.files?.[0])}
                            />
                            {uploadingAdminQris && <small style={{ color: 'var(--muted)' }}>Mengunggah gambar QRIS...</small>}
                            {webSettings.payment_config?.qris_image_url && (
                              <div style={{ marginTop: '8px' }}>
                                <img
                                  src={webSettings.payment_config.qris_image_url}
                                  alt="QRIS Admin"
                                  style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--line)' }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {webSettings.payment_config?.bank_enabled && (
                        <div className="form-row" style={{ background: '#f8fbf8', padding: '14px', borderRadius: '14px', border: '1px solid var(--line)' }}>
                          <div className="field">
                            <label>Nama Bank (BCA / BRI / Mandiri / BNI / dll)</label>
                            <input
                              placeholder="Contoh: Bank Mandiri"
                              value={webSettings.payment_config?.bank_name || ''}
                              onChange={(e) =>
                                setWebSettings((prev) => ({
                                  ...prev,
                                  payment_config: { ...(prev.payment_config || {}), bank_name: e.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="field">
                            <label>Nomor Rekening</label>
                            <input
                              placeholder="Contoh: 1740001234567"
                              value={webSettings.payment_config?.bank_account_number || ''}
                              onChange={(e) =>
                                setWebSettings((prev) => ({
                                  ...prev,
                                  payment_config: { ...(prev.payment_config || {}), bank_account_number: e.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="field">
                            <label>Atas Nama Pemilik Rekening</label>
                            <input
                              placeholder="Contoh: ModuLab KampusLoop"
                              value={webSettings.payment_config?.bank_account_name || ''}
                              onChange={(e) =>
                                setWebSettings((prev) => ({
                                  ...prev,
                                  payment_config: { ...(prev.payment_config || {}), bank_account_name: e.target.value },
                                }))
                              }
                            />
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                        <button type="submit" className="btn btn-primary" disabled={savingWebSettings || uploadingAdminQris}>
                          {savingWebSettings ? 'Menyimpan...' : 'Simpan Semua Pengaturan Web ↗'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* ─── TAB: ARTIKEL (ADMIN WEB ONLY) ──────────────────── */}
            {activeTab === 'artikel' && (
              <div className="dash-panel active">
                <div className="dash-section-row page-dash-heading">
                  <div>
                    <span className="eyebrow">Content & ModuLab news</span>
                    <h2>Kelola Artikel & Berita ModuLab</h2>
                    <p>Tambah, edit, publikasikan, atau hapus artikel yang tampil di halaman Artikel, Home, dan About (khusus Admin Web).</p>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAddArticle(!showAddArticle)}
                  >
                    {showAddArticle ? 'Tutup Formulir' : '+ Tulis Artikel Baru'}
                  </button>
                </div>

                {showAddArticle && (
                  <div className="listing-form-card show" style={{ marginBottom: '22px' }}>
                    <div className="dash-section-row">
                      <div>
                        <span className="eyebrow">Create article</span>
                        <h2>Tulis Artikel / Berita ModuLab</h2>
                      </div>
                      <button className="dash-icon-button" onClick={() => setShowAddArticle(false)}>
                        ×
                      </button>
                    </div>

                    <form className="listing-form" onSubmit={handleCreateArticle}>
                      <div className="form-row">
                        <div className="field">
                          <label>Judul Artikel</label>
                          <input
                            required
                            placeholder="Contoh: Update ModuLab atau Potensi Barang Bekas Mahasiswa"
                            value={newArticle.judul}
                            onChange={(e) => setNewArticle({ ...newArticle, judul: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label>Kategori</label>
                          <select
                            value={newArticle.kategori}
                            onChange={(e) => setNewArticle({ ...newArticle, kategori: e.target.value })}
                          >
                            <option>Berita ModuLab</option>
                            <option>Edukasi Sirkular</option>
                            <option>Tips Mahasiswa</option>
                            <option>Pengumuman</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="field">
                          <label>Upload Gambar Sampul</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => uploadArticleImage(e.target.files?.[0], false)}
                          />
                          {uploadingArticleImg && <small style={{ color: 'var(--muted)' }}>Mengunggah gambar...</small>}
                        </div>
                        <div className="field">
                          <label>Atau URL Gambar Sampul</label>
                          <input
                            placeholder="https://..."
                            value={newArticle.gambar_url}
                            onChange={(e) => setNewArticle({ ...newArticle, gambar_url: e.target.value })}
                          />
                        </div>
                      </div>

                      {newArticle.gambar_url && (
                        <div style={{ marginBottom: '12px' }}>
                          <img
                            src={newArticle.gambar_url}
                            alt="Preview"
                            style={{ width: '140px', height: '88px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--line)' }}
                          />
                        </div>
                      )}

                      <div className="field">
                        <label>Ringkasan Singkat</label>
                        <textarea
                          rows={2}
                          placeholder="Ringkasan yang tampil pada kartu artikel..."
                          value={newArticle.ringkasan}
                          onChange={(e) => setNewArticle({ ...newArticle, ringkasan: e.target.value })}
                        />
                      </div>

                      <div className="field">
                        <RichTextEditor
                          label="Isi Berita / Artikel Lengkap"
                          required
                          value={newArticle.konten}
                          onChange={(val) => setNewArticle((prev) => ({ ...prev, konten: val }))}
                        />
                      </div>

                      <div className="form-row" style={{ alignItems: 'center' }}>
                        <div className="field">
                          <label>Status Publikasi</label>
                          <select
                            value={newArticle.status}
                            onChange={(e) => setNewArticle({ ...newArticle, status: e.target.value })}
                          >
                            <option value="published">Tayangkan Langsung (Published)</option>
                            <option value="draft">Simpan sebagai Draft</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={savingNewArticle || uploadingArticleImg}
                          >
                            {savingNewArticle ? 'Menyimpan...' : 'Simpan Artikel ↗'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                <div className="admin-product-list">
                  {articlesList.length > 0 ? (
                    articlesList.map((art) => (
                      <div
                        key={art.id}
                        className="admin-product-item"
                        style={{ padding: '16px', background: '#fff', border: '1px solid var(--line)', borderRadius: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}
                      >
                        <img
                          src={
                            art.gambar_url ||
                            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200'
                          }
                          alt={art.judul}
                          style={{ width: '88px', height: '64px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: '220px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span className={`status-pill ${art.status === 'published' ? 'status-green' : 'status-orange'}`}>
                              {art.status === 'published' ? 'Tayang' : 'Draft'}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{art.kategori}</span>
                            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>· {art.dilihat || 0} dibaca</span>
                          </div>
                          <strong style={{ fontSize: '13px', display: 'block' }}>{art.judul}</strong>
                          <p style={{ margin: '4px 0', fontSize: '10px', color: 'var(--muted)' }}>
                            {art.ringkasan}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-outline"
                            style={{ fontSize: '10px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setEditingArticle({ ...art })}
                          >
                            <PenLine size={11} strokeWidth={2.2} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteArticle(art.id)}
                            style={{
                              border: 0,
                              background: 'none',
                              color: '#c64e46',
                              cursor: 'pointer',
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '6px',
                            }}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state" style={{ padding: '45px 20px' }}>
                      <strong>Belum ada artikel di database.</strong>
                      <p style={{ fontSize: '11px', margin: '6px 0 12px', color: 'var(--muted)' }}>
                        Klik "+ Tulis Artikel Baru" untuk membuat artikel atau berita ModuLab pertama Anda.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL: EDIT PRODUCT (ADMIN WEB) ───────────────────────── */}
      {editingProduct && (
        <div
          className="overlay show"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingProduct(null)
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal" style={{ maxWidth: '640px', padding: '24px' }}>
            <button className="modal-close" onClick={() => setEditingProduct(null)} aria-label="Tutup">
              ×
            </button>
            <span className="eyebrow">Edit Produk Katalog</span>
            <h2 style={{ marginBottom: '16px' }}>{editingProduct.nama}</h2>

            <form className="listing-form" onSubmit={handleSaveEditProduct}>
              <div className="form-row">
                <div className="field">
                  <label>Nama Produk</label>
                  <input
                    required
                    value={editingProduct.nama || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nama: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Kategori</label>
                  <select
                    value={editingProduct.kategori || 'Buku & Akademik'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, kategori: e.target.value })}
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
                    value={editingProduct.harga || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, harga: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Harga Asli (Rp, opsional)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.harga_asli ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, harga_asli: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>Kondisi</label>
                  <select
                    value={editingProduct.kondisi || 'Good'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, kondisi: e.target.value })}
                  >
                    <option>Like New</option>
                    <option>Good</option>
                    <option>Fair</option>
                  </select>
                </div>
                <div className="field">
                  <label>Status Katalog</label>
                  <select
                    value={editingProduct.status || 'approved'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })}
                  >
                    <option value="approved">Aktif di Katalog (Approved)</option>
                    <option value="pending">Menunggu Review (Pending)</option>
                    <option value="rejected">Ditolak / Nonaktif</option>
                    <option value="sold">Terjual (Sold)</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Lokasi / Kampus</label>
                <input
                  value={editingProduct.lokasi || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, lokasi: e.target.value })}
                />
              </div>

              <CodLocationManager
                label="Opsi Titik Lokasi COD Produk"
                value={editingProduct.cod_lokasi || ''}
                onChange={(nextVal) => setEditingProduct({ ...editingProduct, cod_lokasi: nextVal })}
                helperText="Kosongkan jika ingin produk ini mengikuti opsi lokasi COD default dari Setting Web."
              />

              <div className="form-row">
                <div className="field">
                  <label>Upload Foto Baru</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => uploadProductImage(e.target.files?.[0], true)}
                  />
                  {uploadingEditPhoto && <small style={{ color: 'var(--muted)' }}>Mengunggah foto...</small>}
                </div>
                <div className="field">
                  <label>URL Foto</label>
                  <input
                    value={editingProduct.foto_url || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, foto_url: e.target.value })}
                  />
                </div>
              </div>

              {editingProduct.foto_url && (
                <div style={{ marginBottom: '12px' }}>
                  <img
                    src={editingProduct.foto_url}
                    alt="Preview"
                    style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--line)' }}
                  />
                </div>
              )}

              <div className="field">
                <label>Deskripsi Lengkap</label>
                <textarea
                  required
                  value={editingProduct.deskripsi || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, deskripsi: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingProduct(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEditProduct || uploadingEditPhoto}>
                  {savingEditProduct ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: TINJAU BERKAS PENGAJUAN PENJUAL ─────────────────── */}
      {reviewingUser && (
        <div
          className="overlay show"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReviewingUser(null)
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal" style={{ maxWidth: '660px', padding: '24px' }}>
            <button className="modal-close" onClick={() => setReviewingUser(null)} aria-label="Tutup">
              ×
            </button>
            <span className="eyebrow">Validasi Berkas Penjual</span>
            <h2 style={{ marginBottom: '14px' }}>{reviewingUser.name}</h2>

            <div className="profile-data-grid" style={{ marginBottom: '16px' }}>
              <div>
                <small>Email</small>
                <strong>{reviewingUser.email}</strong>
              </div>
              <div>
                <small>NIM</small>
                <strong>{reviewingUser.nim || '-'}</strong>
              </div>
              <div>
                <small>Kampus</small>
                <strong>{reviewingUser.kampus || '-'}</strong>
              </div>
              <div>
                <small>Fakultas / Prodi</small>
                <strong>{reviewingUser.fakultas_prodi || '-'}</strong>
              </div>
              <div>
                <small>Angkatan</small>
                <strong>{reviewingUser.angkatan || '-'}</strong>
              </div>
              <div>
                <small>No. WhatsApp</small>
                <strong>{reviewingUser.telp || '-'}</strong>
              </div>
              <div>
                <small>Alamat</small>
                <strong>{reviewingUser.alamat || '-'}</strong>
              </div>
              <div>
                <small>Keterangan / Alasan</small>
                <strong>{reviewingUser.alasan_pengajuan_penjual || '-'}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '8px', marginBottom: '16px', padding: '12px', background: '#f8faf8', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <strong style={{ fontSize: '11px' }}>Berkas Lampiran Mahasiswa:</strong>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {reviewingUser.ktm_url ? (
                  <a href={reviewingUser.ktm_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '10px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <FileText size={12} /> <span>Buka Foto KTM ↗</span>
                  </a>
                ) : (
                  <small style={{ color: 'var(--muted)' }}>KTM belum diunggah</small>
                )}
                {reviewingUser.bukti_lain_url ? (
                  <a href={reviewingUser.bukti_lain_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '10px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <FileText size={12} /> <span>Buka Bukti Lainnya ↗</span>
                  </a>
                ) : (
                  <small style={{ color: 'var(--muted)' }}>Bukti lain belum diunggah</small>
                )}
                {reviewingUser.surat_perjanjian_url ? (
                  <a href={reviewingUser.surat_perjanjian_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '10px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <FileSignature size={12} /> <span>Buka Surat Perjanjian ↗</span>
                  </a>
                ) : (
                  <small style={{ color: 'var(--muted)' }}>Surat perjanjian belum diunggah</small>
                )}
              </div>
            </div>

            <div className="field" style={{ marginBottom: '16px' }}>
              <label>Catatan Validasi Admin Web</label>
              <textarea
                rows={2}
                placeholder="Tuliskan catatan persetujuan atau alasan penolakan berkas..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                disabled={processingReview}
                onClick={() => handleRejectSeller(reviewingUser.id)}
              >
                <X size={13} strokeWidth={2.3} /> <span>Tolak Pengajuan</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                disabled={processingReview}
                onClick={() => handleApproveSeller(reviewingUser.id)}
              >
                <Check size={13} strokeWidth={2.5} /> <span>Setujui Sebagai Penjual</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ATUR FORMAT SURAT PERJANJIAN ──────────────────── */}
      {showAgreementModal && (
        <div
          className="overlay show"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAgreementModal(false)
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal" style={{ maxWidth: '700px', padding: '24px' }}>
            <button className="modal-close" onClick={() => setShowAgreementModal(false)} aria-label="Tutup">
              ×
            </button>
            <span className="eyebrow">Pengaturan Admin Web</span>
            <h2 style={{ marginBottom: '8px' }}>Format Surat Perjanjian Penjual</h2>
            <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '14px' }}>
              Format surat ini akan diunduh oleh user pada tab Ajukan Penjual. Placeholder otomatis: <code>{'{{NAMA}}'}</code>, <code>{'{{NIM}}'}</code>, <code>{'{{KAMPUS}}'}</code>, <code>{'{{FAKULTAS_PRODI}}'}</code>, <code>{'{{TELP}}'}</code>, <code>{'{{ALAMAT}}'}</code>, <code>{'{{TANGGAL}}'}</code>.
            </p>

            <form className="listing-form" onSubmit={handleSaveAgreementTemplate}>
              <div
                className="field"
                style={{
                  background: '#f8fbf8',
                  border: '1px solid var(--line)',
                  borderRadius: '14px',
                  padding: '14px',
                }}
              >
                <label>Upload File Template Surat Word (.doc / .docx / .pdf) — Opsional</label>
                <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 8px' }}>
                  Jika file Word diunggah, tombol <b>Download Format Surat Perjanjian</b> milik user akan mengunduh langsung file Word tersebut.
                </p>
                <input
                  type="file"
                  accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                  onChange={(e) => handleUploadAgreementWord(e.target.files?.[0])}
                />
                {uploadingAgreementFile && (
                  <small style={{ color: 'var(--muted)', display: 'block', marginTop: '6px' }}>
                    Mengunggah file template surat...
                  </small>
                )}
                {agreementForm.file_url && (
                  <div
                    style={{
                      marginTop: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      flexWrap: 'wrap',
                      background: '#fff',
                      border: '1px solid var(--line)',
                      padding: '8px 12px',
                      borderRadius: '10px',
                    }}
                  >
                    <a
                      href={agreementForm.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <FileText size={13} strokeWidth={2.2} />
                      <span>Lihat / Unduh File Template Terunggah ↗</span>
                    </a>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ fontSize: '10px', padding: '4px 10px' }}
                      onClick={() => setAgreementForm((prev) => ({ ...prev, file_url: '' }))}
                    >
                      Hapus File Word
                    </button>
                  </div>
                )}
              </div>

              <div className="field">
                <label>Judul Surat Perjanjian</label>
                <input
                  required
                  value={agreementForm.judul}
                  onChange={(e) => setAgreementForm({ ...agreementForm, judul: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Isi / Pasal Surat Perjanjian</label>
                <textarea
                  required
                  rows={10}
                  value={agreementForm.isi}
                  onChange={(e) => setAgreementForm({ ...agreementForm, isi: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Catatan / Petunjuk untuk Calon Penjual</label>
                <input
                  value={agreementForm.catatan}
                  onChange={(e) => setAgreementForm({ ...agreementForm, catatan: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAgreementModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingAgreement || uploadingAgreementFile}>
                  {savingAgreement ? 'Menyimpan...' : 'Simpan Format Surat ↗'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT ARTIKEL (ADMIN WEB) ────────────────────────── */}
      {editingArticle && (
        <div
          className="overlay show"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingArticle(null)
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal" style={{ maxWidth: '700px', padding: '24px' }}>
            <button className="modal-close" onClick={() => setEditingArticle(null)} aria-label="Tutup">
              ×
            </button>
            <span className="eyebrow">Edit Artikel</span>
            <h2 style={{ marginBottom: '14px' }}>{editingArticle.judul}</h2>

            <form className="listing-form" onSubmit={handleSaveEditArticle}>
              <div className="form-row">
                <div className="field">
                  <label>Judul Artikel</label>
                  <input
                    required
                    value={editingArticle.judul || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, judul: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Kategori</label>
                  <select
                    value={editingArticle.kategori || 'Berita ModuLab'}
                    onChange={(e) => setEditingArticle({ ...editingArticle, kategori: e.target.value })}
                  >
                    <option>Berita ModuLab</option>
                    <option>Edukasi Sirkular</option>
                    <option>Tips Mahasiswa</option>
                    <option>Pengumuman</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>Upload Gambar Baru</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => uploadArticleImage(e.target.files?.[0], true)}
                  />
                  {uploadingEditArticleImg && <small style={{ color: 'var(--muted)' }}>Mengunggah gambar...</small>}
                </div>
                <div className="field">
                  <label>URL Gambar</label>
                  <input
                    value={editingArticle.gambar_url || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, gambar_url: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>Ringkasan Singkat</label>
                <textarea
                  rows={2}
                  value={editingArticle.ringkasan || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, ringkasan: e.target.value })}
                />
              </div>

              <div className="field">
                <RichTextEditor
                  label="Isi Berita / Artikel Lengkap"
                  required
                  value={editingArticle.konten || ''}
                  onChange={(val) => setEditingArticle((prev) => ({ ...prev, konten: val }))}
                />
              </div>

              <div className="form-row" style={{ alignItems: 'center' }}>
                <div className="field">
                  <label>Status Publikasi</label>
                  <select
                    value={editingArticle.status || 'published'}
                    onChange={(e) => setEditingArticle({ ...editingArticle, status: e.target.value })}
                  >
                    <option value="published">Tayang (Published)</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setEditingArticle(null)}>
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingEditArticle || uploadingEditArticleImg}
                  >
                    {savingEditArticle ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
