import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import api from '../api'
import {
  IconShoppingBag,
  IconHeart,
  IconGraduationCap,
  IconUser,
  IconPackage,
  IconShield,
  IconLogout,
  IconCheck,
  IconX,
  IconClock,
  IconBadgeCheck,
  IconExternalLink,
  IconAlertTriangle,
} from '../components/Icons'

export default function UserDashboard() {
  const { user, logout, setUser } = useAuth()
  const { showToast } = useCart()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialTab = searchParams.get('tab') || 'orders'
  const [activeTab, setActiveTab] = useState(initialTab)

  const [stats, setStats] = useState({
    total_orders: 0,
    total_spent: 0,
    wishlist_count: 0,
    seller_status: 'none',
    role: 'user',
  })

  const [orders, setOrders] = useState([])
  const [wishlistItems, setWishlistItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Seller Application Form State
  const [applyForm, setApplyForm] = useState({
    kampus: '',
    nim: '',
    fakultas_prodi: '',
    telp: '',
    ktm_url: '',
    alasan_jual: '',
  })
  const [submittingApply, setSubmittingApply] = useState(false)

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

    setApplyForm({
      kampus: user.kampus || '',
      nim: user.nim || '',
      fakultas_prodi: user.fakultas_prodi || '',
      telp: user.telp || '',
      ktm_url: user.ktm_url || '',
      alasan_jual: user.alasan_jual || '',
    })

    loadUserData()
  }, [user, navigate])

  const loadUserData = async () => {
    setLoading(true)
    try {
      const [statsRes, ordersRes, wishlistRes] = await Promise.all([
        api.get('/user/stats/').catch(() => ({ data: null })),
        api.get('/pesanan/').catch(() => ({ data: [] })),
        api.get('/wishlist/').catch(() => ({ data: [] })),
      ])

      if (statsRes.data) setStats(statsRes.data)
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.results || []))
      setWishlistItems(Array.isArray(wishlistRes.data) ? wishlistRes.data : (wishlistRes.data?.results || []))
    } catch {
      // Handled
    } finally {
      setLoading(false)
    }
  }

  // SUBMIT SELLER APPLICATION (VERIFIKASI BERKAS MAHASISWA AKTIF)
  const handleApplySeller = async (e) => {
    e.preventDefault()
    if (!applyForm.kampus || !applyForm.nim || !applyForm.telp) {
      showToast('Universitas, NIM, dan No WhatsApp wajib diisi!')
      return
    }

    setSubmittingApply(true)
    try {
      const res = await api.post('/user/apply-seller/', applyForm)
      showToast('Pengajuan verifikasi penjual berhasil dikirim! Menunggu konfirmasi admin.')
      if (res.data.user) {
        setUser(res.data.user)
        localStorage.setItem('kampusloop_session', JSON.stringify(res.data.user))
      }
      loadUserData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal mengirim pengajuan verifikasi.')
    } finally {
      setSubmittingApply(false)
    }
  }

  // CANCEL ORDER
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Batalkan pesanan ini?')) return
    try {
      await api.post(`/pesanan/${orderId}/status/`, { status: 'cancelled' })
      showToast('Pesanan berhasil dibatalkan.')
      loadUserData()
    } catch {
      showToast('Gagal membatalkan pesanan.')
    }
  }

  // REMOVE FROM WISHLIST
  const handleRemoveWishlist = async (produkId) => {
    try {
      await api.post(`/wishlist/toggle/${produkId}/`)
      showToast('Dihapus dari wishlist.')
      setWishlistItems(wishlistItems.filter((item) => item.produk?.id !== produkId))
    } catch {
      // Handled
    }
  }

  // SAVE PROFILE
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await api.post('/user/profile/update/', profileForm)
      showToast('Profil berhasil diperbarui!')
      if (res.data.user) {
        setUser(res.data.user)
        localStorage.setItem('kampusloop_session', JSON.stringify(res.data.user))
      }
    } catch {
      showToast('Gagal memperbarui profil.')
    } finally {
      setSavingProfile(false)
    }
  }

  const formatPrice = (p) => 'Rp' + Number(p || 0).toLocaleString('id-ID')
  const initial = (user?.name ? user.name[0] : 'M').toUpperCase()

  const isSeller = user?.role === 'penjual' || user?.is_seller || user?.seller_status === 'approved'
  const isPendingSeller = user?.seller_status === 'pending'
  const isRejectedSeller = user?.seller_status === 'rejected'

  return (
    <main className="dashboard-page">
      <div className="dashboard-wrap">
        {/* ─── SIDEBAR ────────────────────────────────────────────── */}
        <aside className="dash-sidebar user-sidebar">
          <Link to="/" className="dash-brand">
            <span className="brand-mark">
              <IconShoppingBag size={20} />
            </span>
            <span>
              Kampus<span>Loop</span>
              <small>STUDENT DASHBOARD</small>
            </span>
          </Link>

          <div className="dash-profile-mini">
            <div className="profile-initial">{initial}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '13px' }}>{user.name}</strong>
                {isSeller ? (
                  <span className="badge badge-approved" style={{ fontSize: '9px', padding: '2px 6px' }}>
                    <IconBadgeCheck size={11} />
                    <span>Penjual</span>
                  </span>
                ) : (
                  <span className="badge badge-user" style={{ fontSize: '9px', padding: '2px 6px' }}>
                    Mahasiswa
                  </span>
                )}
              </div>
              <small>{user.kampus || 'Mahasiswa Kampus'}</small>
            </div>
          </div>

          <span className="dash-nav-label">AREA MAHASISWA</span>
          <button
            className={`dash-nav ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <IconShoppingBag size={18} />
            <span>Belanjaan Saya</span>
            <i>{orders.length}</i>
          </button>
          <button
            className={`dash-nav ${activeTab === 'wishlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('wishlist')}
          >
            <IconHeart size={18} />
            <span>Wishlist Disimpan</span>
            <i>{wishlistItems.length}</i>
          </button>
          <button
            className={`dash-nav ${activeTab === 'seller-apply' ? 'active' : ''}`}
            onClick={() => setActiveTab('seller-apply')}
            style={isPendingSeller ? { color: '#d97706', fontWeight: 700 } : {}}
          >
            <IconGraduationCap size={18} />
            <span>{isSeller ? 'Status Penjual' : 'Daftar Jadi Penjual'}</span>
          </button>
          <button
            className={`dash-nav ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <IconUser size={18} />
            <span>Profil Saya</span>
          </button>

          <span className="dash-nav-label" style={{ marginTop: '20px' }}>AKSES KHUSUS</span>
          {isSeller && (
            <Link to="/dashboard/penjual" className="dash-nav" style={{ color: '#059669', fontWeight: 700 }}>
              <IconPackage size={18} />
              <span>Buka Dashboard Penjual</span>
            </Link>
          )}
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
              <span className="dash-eyebrow">DASHBOARD MAHASISWA / PEMBELI</span>
              <h1>
                {activeTab === 'orders' && 'Pesanan & Riwayat Pembelian'}
                {activeTab === 'wishlist' && 'Wishlist & Barang Disimpan'}
                {activeTab === 'seller-apply' && 'Pendaftaran Penjual (Verifikasi Mahasiswa Aktif)'}
                {activeTab === 'profile' && 'Pengaturan Profil Akun'}
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/shop" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Mulai Belanja</span>
                <IconExternalLink size={14} />
              </Link>
              {isSeller && (
                <Link to="/dashboard/penjual" className="btn btn-dark" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <IconPackage size={16} />
                  <span>Dashboard Penjual</span>
                </Link>
              )}
            </div>
          </div>

          {/* Banner Status Penjual */}
          {!isSeller && !isPendingSeller && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)' }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  Mau jual buku, gadget, atau perlengkapan kosanmu?
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Daftar sebagai Penjual (User Admin) dengan verifikasi berkas mahasiswa aktif. Mudah dan langsung aktif setelah disetujui admin!
                </p>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setActiveTab('seller-apply')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderColor: '#059669', color: '#059669' }}
              >
                <span>Ajukan Verifikasi Mahasiswa</span>
                <IconExternalLink size={13} />
              </button>
            </div>
          )}

          {isPendingSeller && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '16px', padding: '18px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ color: '#d97706', flexShrink: 0 }}>
                <IconClock size={28} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 800, color: '#92400e' }}>
                  Pengajuan Verifikasi Penjual Sedang Ditinjau Admin
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#b45309' }}>
                  Berkas KTM dan identitas mahasiswa Anda sedang diproses oleh admin KampusLoop. Anda akan otomatis mendapat akses Dashboard Penjual setelah disetujui.
                </p>
              </div>
            </div>
          )}

          {isSeller && (
            <div style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '18px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: '#059669', flexShrink: 0 }}>
                  <IconBadgeCheck size={28} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 800, color: '#166534' }}>
                    Status Akun: Penjual Mahasiswa Terverifikasi
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#15803d' }}>
                    Anda dapat mengelola produk, melihat pesanan masuk, dan mengatur pencatatan penjualan di Dashboard Penjual.
                  </p>
                </div>
              </div>
              <Link to="/dashboard/penjual" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <IconPackage size={14} />
                <span>Buka Dashboard Penjual</span>
              </Link>
            </div>
          )}

          {/* ─── TAB: ORDERS (BELANJAAN SAYA) ────────────────────── */}
          {activeTab === 'orders' && (
            <div className="dash-panel">
              <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>
                Riwayat Pembelian & Pesanan Saya
              </h3>

              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '12px' }}>
                    <IconShoppingBag size={40} />
                  </div>
                  <h3 style={{ margin: '0 0 6px', color: '#0f172a' }}>Belum ada pembelian</h3>
                  <p style={{ margin: '0 0 16px', fontSize: '14px' }}>Temukan buku, elektronik, dan kebutuhan kos murah dari sesama mahasiswa di kampusmu.</p>
                  <Link to="/shop" className="btn btn-primary">
                    Mulai Belanja di KampusLoop
                  </Link>
                </div>
              ) : (
                <div className="dash-table-wrapper">
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>No. Order</th>
                        <th>Barang</th>
                        <th>Penjual & Kontak COD</th>
                        <th>Total Bayar</th>
                        <th>Status</th>
                        <th>Tanggal</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((ord) => (
                        <tr key={ord.id}>
                          <td><strong>#{ord.order_number}</strong></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img
                                src={ord.produk_detail?.foto_display || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200'}
                                alt=""
                                style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                              />
                              <div>
                                <strong>{ord.produk_detail?.nama || 'Produk'}</strong>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>{ord.produk_detail?.kategori}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong>{ord.seller_nama || 'Penjual'}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{ord.produk_detail?.lokasi || ord.produk_detail?.seller_kampus}</div>
                            {ord.produk_detail?.seller_telp && (
                              <a
                                href={`https://wa.me/${ord.produk_detail.seller_telp.replace(/^0/, '62')}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '11px', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}
                              >
                                <span>Hubungi Penjual</span>
                                <IconExternalLink size={11} />
                              </a>
                            )}
                          </td>
                          <td><strong>{formatPrice(ord.harga_bayar)}</strong></td>
                          <td>
                            <span className={`badge badge-${ord.status}`}>
                              {ord.status === 'pending' && 'Menunggu Konfirmasi'}
                              {ord.status === 'confirmed' && 'Dikonfirmasi'}
                              {ord.status === 'cod_waiting' && 'Siap COD'}
                              {ord.status === 'completed' && 'Selesai'}
                              {ord.status === 'cancelled' && 'Dibatalkan'}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: '#64748b' }}>
                            {ord.tanggal_pesan ? new Date(ord.tanggal_pesan).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td>
                            {ord.status === 'confirmed' || ord.status === 'pending' ? (
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleCancelOrder(ord.id)}
                                style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                              >
                                Batalkan
                              </button>
                            ) : ord.status === 'completed' ? (
                              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <IconCheck size={14} />
                                <span>Transaksi Selesai</span>
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>-</span>
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

          {/* ─── TAB: WISHLIST ───────────────────────────────────── */}
          {activeTab === 'wishlist' && (
            <div className="dash-panel">
              <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>
                Wishlist & Barang Yang Disimpan
              </h3>

              {wishlistItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                  <div style={{ color: '#94a3b8', marginBottom: '12px' }}>
                    <IconHeart size={40} />
                  </div>
                  <h3 style={{ margin: '0 0 6px', color: '#0f172a' }}>Wishlist Anda masih kosong</h3>
                  <p style={{ margin: '0 0 16px', fontSize: '14px' }}>Simpan barang favorit saat menjelajahi katalog agar mudah ditemukan nanti.</p>
                  <Link to="/shop" className="btn btn-primary">
                    Jelajahi Produk
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                  {wishlistItems.map((item) => {
                    const prod = item.produk
                    if (!prod) return null
                    return (
                      <div key={item.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                        <img
                          src={prod.foto_display || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'}
                          alt={prod.nama}
                          style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                        />
                        <div style={{ padding: '16px' }}>
                          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {prod.kategori}
                          </span>
                          <h4 style={{ margin: '4px 0 8px', fontSize: '15px', fontWeight: 700 }}>{prod.nama}</h4>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                            {formatPrice(prod.harga)}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Link to="/shop" className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <span>Lihat Detail</span>
                              <IconExternalLink size={12} />
                            </Link>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleRemoveWishlist(prod.id)}
                              title="Hapus dari wishlist"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <IconX size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: SELLER APPLY (VERIFIKASI MAHASISWA AKTIF) ──── */}
          {activeTab === 'seller-apply' && (
            <div className="dash-panel" style={{ maxWidth: '760px' }}>
              <div style={{ marginBottom: '24px' }}>
                <span className="badge badge-approved" style={{ marginBottom: '8px' }}>
                  <IconGraduationCap size={13} />
                  <span>VERIFIKASI PENJUAL MAHASISWA</span>
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '6px 0', color: '#0f172a' }}>
                  Daftar Sebagai Penjual (User Admin)
                </h2>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                  Semua pengguna baru terdaftar sebagai Mahasiswa/Pembeli reguler. Untuk dapat menjual barang dan mendapatkan akses ke <strong>Dashboard Penjual</strong>, Anda perlu melakukan verifikasi bahwa Anda adalah mahasiswa aktif dengan mengunggah bukti berkas Kartu Tanda Mahasiswa (KTM).
                </p>
              </div>

              {/* Status Box */}
              {isSeller ? (
                <div style={{ background: '#ecfdf5', border: '1px solid #86efac', borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
                  <div style={{ color: '#059669', marginBottom: '12px' }}>
                    <IconBadgeCheck size={48} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#166534', margin: '0 0 6px' }}>
                    Selamat! Anda Telah Terverifikasi Sebagai Penjual
                  </h3>
                  <p style={{ color: '#15803d', fontSize: '14px', margin: '0 0 20px' }}>
                    Akun Anda memiliki izin penuh untuk mengunggah produk, mengelola harga, dan mencatat transaksi penjualan.
                  </p>
                  <Link to="/dashboard/penjual" className="btn btn-primary" style={{ padding: '12px 24px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <IconPackage size={16} />
                    <span>Buka Dashboard Penjual (User Admin)</span>
                  </Link>
                </div>
              ) : isPendingSeller ? (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ color: '#d97706' }}>
                      <IconClock size={32} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#92400e' }}>
                        Berkas Sedang Ditinjau Admin KampusLoop
                      </h4>
                      <small style={{ color: '#b45309' }}>Estimasi proses review 1 x 24 jam</small>
                    </div>
                  </div>

                  <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #fef3c7', fontSize: '13px', lineHeight: 1.8 }}>
                    <div><strong>Kampus:</strong> {user.kampus}</div>
                    <div><strong>NIM:</strong> {user.nim}</div>
                    <div><strong>Fakultas / Prodi:</strong> {user.fakultas_prodi || '-'}</div>
                    <div><strong>No WhatsApp:</strong> {user.telp}</div>
                    <div><strong>Rencana Jualan:</strong> {user.alasan_jual || '-'}</div>
                    {user.ktm_url && (
                      <div style={{ marginTop: '10px' }}>
                        <strong>Bukti KTM:</strong>
                        <div style={{ marginTop: '6px' }}>
                          <img
                            src={user.ktm_url}
                            alt="Bukti KTM"
                            style={{ maxHeight: '140px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleApplySeller} style={{ display: 'grid', gap: '18px' }}>
                  {isRejectedSeller && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 18px', color: '#b91c1c', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconAlertTriangle size={18} />
                      <div>
                        <strong>Pengajuan Sebelumnya Ditolak:</strong> {user.seller_reject_reason || 'Mohon lengkapi foto identitas mahasiswa yang jelas.'} Silakan ajukan ulang dengan berkas yang benar.
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="dash-label">Nama Lengkap</label>
                      <input
                        type="text"
                        className="dash-input"
                        value={user.nama || user.name}
                        disabled
                        style={{ background: '#f8fafc', color: '#64748b' }}
                      />
                    </div>
                    <div>
                      <label className="dash-label">Email Terdaftar</label>
                      <input
                        type="email"
                        className="dash-input"
                        value={user.email}
                        disabled
                        style={{ background: '#f8fafc', color: '#64748b' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="dash-label">Universitas / Kampus Asal</label>
                      <input
                        type="text"
                        className="dash-input"
                        placeholder="Contoh: Universitas Negeri Makassar"
                        value={applyForm.kampus}
                        onChange={(e) => setApplyForm({ ...applyForm, kampus: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="dash-label">NIM (Nomor Induk Mahasiswa)</label>
                      <input
                        type="text"
                        className="dash-input"
                        placeholder="Contoh: 21020450102"
                        value={applyForm.nim}
                        onChange={(e) => setApplyForm({ ...applyForm, nim: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="dash-label">Fakultas & Program Studi</label>
                      <input
                        type="text"
                        className="dash-input"
                        placeholder="Contoh: Teknik Informatika / FEB"
                        value={applyForm.fakultas_prodi}
                        onChange={(e) => setApplyForm({ ...applyForm, fakultas_prodi: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="dash-label">Nomor WhatsApp Aktif (Untuk COD)</label>
                      <input
                        type="text"
                        className="dash-input"
                        placeholder="Contoh: 081234567890"
                        value={applyForm.telp}
                        onChange={(e) => setApplyForm({ ...applyForm, telp: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="dash-label">Link / URL Foto Kartu Tanda Mahasiswa (KTM) atau Berkas Aktif</label>
                    <input
                      type="url"
                      className="dash-input"
                      placeholder="https://... (Foto KTM, KRS aktif, atau Kartu Mahasiswa)"
                      value={applyForm.ktm_url}
                      onChange={(e) => setApplyForm({ ...applyForm, ktm_url: e.target.value })}
                    />
                    <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      Tip: Masukkan URL foto kartu identitas mahasiswa aktif yang jelas agar admin dapat memverifikasi lebih cepat.
                    </small>
                    {applyForm.ktm_url && (
                      <div style={{ marginTop: '10px' }}>
                        <img
                          src={applyForm.ktm_url}
                          alt="Preview KTM"
                          style={{ height: '110px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                          onError={(e) => (e.target.style.display = 'none')}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="dash-label">Rencana / Alasan Jualan di KampusLoop</label>
                    <textarea
                      rows={3}
                      className="dash-input"
                      placeholder="Barang apa saja yang ingin Anda jual? (misal: Buku kuliah semester 1-4, tas ransel, monitor, perlengkapan kosan...)"
                      value={applyForm.alasan_jual}
                      onChange={(e) => setApplyForm({ ...applyForm, alasan_jual: e.target.value })}
                    />
                  </div>

                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
                    <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input type="checkbox" required style={{ marginTop: '3px' }} />
                      <span>
                        Saya menyatakan data yang saya kirimkan adalah benar dan saya berkomitmen mematuhi etika transaksi preloved yang jujur dan amanah di lingkungan kampus.
                      </span>
                    </label>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submittingApply}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>{submittingApply ? 'Mengirim Berkas...' : 'Kirim Berkas Pengajuan Verifikasi'}</span>
                      <IconExternalLink size={14} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ─── TAB: PROFILE ────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <div className="dash-panel" style={{ maxWidth: '640px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>Profil Pengguna</h3>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
                Perbarui informasi akun, universitas, dan nomor kontak Anda.
              </p>

              <form onSubmit={handleSaveProfile} style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label className="dash-label">Nama Lengkap</label>
                  <input
                    type="text"
                    className="dash-input"
                    value={profileForm.nama}
                    onChange={(e) => setProfileForm({ ...profileForm, nama: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="dash-label">Universitas / Kampus</label>
                    <input
                      type="text"
                      className="dash-input"
                      value={profileForm.kampus}
                      onChange={(e) => setProfileForm({ ...profileForm, kampus: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="dash-label">Nomor WhatsApp / Telp</label>
                    <input
                      type="text"
                      className="dash-input"
                      value={profileForm.telp}
                      onChange={(e) => setProfileForm({ ...profileForm, telp: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="dash-label">NIM</label>
                    <input
                      type="text"
                      className="dash-input"
                      value={profileForm.nim}
                      onChange={(e) => setProfileForm({ ...profileForm, nim: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="dash-label">Fakultas / Prodi</label>
                    <input
                      type="text"
                      className="dash-input"
                      value={profileForm.fakultas_prodi}
                      onChange={(e) => setProfileForm({ ...profileForm, fakultas_prodi: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="dash-label">Alamat / Area Domisili Kos</label>
                  <input
                    type="text"
                    className="dash-input"
                    value={profileForm.alamat}
                    onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })}
                    placeholder="Contoh: Jl. Pettarani No. 12, Makassar"
                  />
                </div>

                <div>
                  <label className="dash-label">Bio Singkat</label>
                  <textarea
                    rows={3}
                    className="dash-input"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Deskripsi singkat tentang dirimu..."
                  />
                </div>

                <div style={{ marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                    {savingProfile ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
