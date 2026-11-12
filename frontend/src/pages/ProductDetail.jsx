import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Eye, MapPin, Check, CreditCard, Heart } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import api from '../api'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, showToast } = useCart()
  const { user } = useAuth()

  const [product, setProduct] = useState(null)
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isWishlisted, setIsWishlisted] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/produk/${id}/`).catch(() => ({ data: null })),
      api.get('/produk/').catch(() => ({ data: [] })),
    ])
      .then(([detailRes, allRes]) => {
        if (detailRes.data) {
          setProduct(detailRes.data)
          setIsWishlisted(Boolean(detailRes.data.is_wishlisted))
        } else {
          setProduct(null)
        }
        setAllProducts(Array.isArray(allRes.data) ? allRes.data : [])
      })
      .finally(() => setLoading(false))
  }, [id])

  const similarProducts = useMemo(() => {
    if (!product) return []
    return allProducts
      .filter((p) => p.id !== product.id && p.kategori === product.kategori)
      .slice(0, 4)
  }, [allProducts, product])

  const otherProducts = useMemo(() => {
    if (!product) return []
    const simIds = new Set(similarProducts.map((p) => p.id))
    return allProducts
      .filter((p) => p.id !== product.id && !simIds.has(p.id))
      .slice(0, 4)
  }, [allProducts, product, similarProducts])

  const formatPrice = (p) => 'Rp' + Number(p || 0).toLocaleString('id-ID')

  const handleBuyNow = () => {
    if (!user) {
      showToast('Silakan masuk atau daftar sebagai user terlebih dahulu untuk memesan.')
      navigate('/auth?mode=login')
      return
    }
    if (user.role === 'admin' || user.is_staff || user.is_superuser) {
      showToast('Akun admin tidak dapat melakukan pemesanan. Silakan gunakan akun user.')
      return
    }
    navigate('/checkout', { state: { items: [product], fromCart: false } })
  }

  const handleToggleWishlist = async () => {
    if (!user) {
      showToast('Silakan masuk atau daftar sebagai user terlebih dahulu untuk menyimpan wishlist.')
      navigate('/auth?mode=login')
      return
    }
    try {
      const res = await api.post(`/wishlist/toggle/${product.id}/`)
      const nextState = Boolean(res.data?.wishlisted)
      setIsWishlisted(nextState)
      showToast(nextState ? `"${product.nama}" disimpan ke wishlist.` : `"${product.nama}" dihapus dari wishlist.`)
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal memperbarui wishlist.')
    }
  }

  if (loading) {
    return (
      <main className="wrap" style={{ padding: '70px 0', textAlign: 'center', color: 'var(--muted)' }}>
        Memuat detail produk...
      </main>
    )
  }

  if (!product) {
    return (
      <main className="wrap" style={{ padding: '70px 0' }}>
        <div className="empty-state">
          <strong>Produk tidak ditemukan atau sudah terjual.</strong>
          <div style={{ marginTop: '14px' }}>
            <Link to="/shop" className="btn btn-primary">
              Kembali ke Shop ↗
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const imageSrc =
    product.foto_display ||
    product.foto_url ||
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=900'

  const codSpots = (product.cod_lokasi || 'Perpustakaan Pusat, Kantin Fakultas, Gerbang Utama Kampus')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const paymentOpts = product.payment_options || {
    cod_enabled: true,
    qris_enabled: true,
    bank_enabled: true,
  }

  const discountPct =
    product.harga_asli && product.harga_asli > product.harga
      ? Math.round(((product.harga_asli - product.harga) / product.harga_asli) * 100)
      : 0

  return (
    <main>
      <section className="wrap" style={{ paddingTop: '28px', paddingBottom: '75px' }}>
        <div style={{ marginBottom: '18px' }}>
          <Link to="/shop" className="article-back-link">
            ← Kembali ke Shop
          </Link>
        </div>

        {/* Product Detail 2-Column Card */}
        <div className="product-detail-shell">
          <div className="product-detail-gallery">
            <img src={imageSrc} alt={product.nama} />
            <span className="product-badge">{product.kondisi || 'Good'}</span>
          </div>

          <div className="product-detail-info">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
              <span className="article-cat">{product.kategori}</span>
              <span className="status-pill status-green">{product.kondisi}</span>
              <small style={{ color: 'var(--muted)', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={12} /> {product.dilihat || 0} kali dilihat
              </small>
            </div>

            <h1 className="product-detail-title">{product.nama}</h1>

            <div className="product-detail-price-row">
              <strong>{formatPrice(product.harga)}</strong>
              {product.harga_asli && (
                <span className="old-price" style={{ fontSize: '14px' }}>
                  {formatPrice(product.harga_asli)}
                </span>
              )}
              {discountPct > 0 && (
                <span className="status-pill status-orange">Hemat {discountPct}%</span>
              )}
            </div>

            {/* Seller & Location Box */}
            <div className="product-detail-meta-card">
              <div>
                <small>Penjual Terverifikasi</small>
                <strong>{product.seller_nama || 'KampusLoop'}</strong>
                <span>{product.seller_kampus || 'Kampus Terverifikasi'}</span>
              </div>
              <div>
                <small>Lokasi Barang</small>
                <strong>{product.lokasi || product.seller_kampus || 'Area Kampus'}</strong>
                <span>Siap COD / Antar</span>
              </div>
            </div>

            {/* COD Locations */}
            <div className="product-detail-block">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} strokeWidth={2.2} />
                <span>Lokasi COD yang Tersedia</span>
              </h4>
              <div className="cod-chip-list">
                {codSpots.map((spot, idx) => (
                  <span key={idx} className="cod-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Check size={12} strokeWidth={2.4} />
                    <span>{spot}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Accepted Payment Methods */}
            <div className="product-detail-block">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={15} strokeWidth={2.2} />
                <span>Metode Pembayaran yang Didukung</span>
              </h4>
              <div className="cod-chip-list">
                {paymentOpts.cod_enabled !== false && <span className="cod-chip">COD (Bayar di Tempat)</span>}
                {paymentOpts.qris_enabled && <span className="cod-chip">QRIS</span>}
                {paymentOpts.bank_enabled && (
                  <span className="cod-chip">Transfer Bank ({paymentOpts.bank_name || 'Bank'})</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="product-detail-block">
              <h4>Informasi & Kondisi Produk</h4>
              <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.75, color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>
                {product.deskripsi}
              </p>
            </div>

            {/* Actions */}
            <div className="product-detail-actions">
              <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={handleBuyNow}>
                Beli Sekarang ↗
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => addToCart(product)}
              >
                + Keranjang
              </button>
              <button
                type="button"
                className={`btn btn-outline ${isWishlisted ? 'active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                onClick={handleToggleWishlist}
                title="Simpan ke wishlist"
              >
                <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} strokeWidth={2.2} />
                <span>{isWishlisted ? 'Disimpan' : 'Simpan'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div style={{ marginTop: '54px' }}>
            <div className="section-head" style={{ marginBottom: '18px' }}>
              <div>
                <span className="eyebrow">Produk Serupa</span>
                <h2>Pilihan lain di kategori {product.kategori}</h2>
              </div>
              <Link to={`/shop?category=${encodeURIComponent(product.kategori)}`} className="text-link">
                Lihat kategori ini →
              </Link>
            </div>
            <div className="product-grid">
              {similarProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Other Products */}
        {otherProducts.length > 0 && (
          <div style={{ marginTop: '48px' }}>
            <div className="section-head" style={{ marginBottom: '18px' }}>
              <div>
                <span className="eyebrow">Jelajahi Lainnya</span>
                <h2>Produk lainnya di KampusLoop</h2>
              </div>
              <Link to="/shop" className="text-link">
                Buka semua produk →
              </Link>
            </div>
            <div className="product-grid">
              {otherProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

