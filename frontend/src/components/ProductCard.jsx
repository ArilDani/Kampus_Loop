import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import api from '../api'

export default function ProductCard({ product }) {
  const { addToCart, showToast } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isWishlisted, setIsWishlisted] = useState(product.is_wishlisted || false)
  const [popHeart, setPopHeart] = useState(false)

  useEffect(() => {
    setIsWishlisted(Boolean(product.is_wishlisted))
  }, [product.is_wishlisted])

  const formatPrice = (price) => {
    return 'Rp' + Number(price || 0).toLocaleString('id-ID')
  }

  const handleWishlist = async (e) => {
    e.stopPropagation()
    if (!user) {
      showToast('Silakan masuk atau daftar sebagai user terlebih dahulu untuk menyimpan wishlist.')
      navigate('/auth?mode=login')
      return
    }

    try {
      const res = await api.post(`/wishlist/toggle/${product.id}/`)
      const nextState = Boolean(res.data?.wishlisted)
      setIsWishlisted(nextState)
      setPopHeart(true)
      setTimeout(() => setPopHeart(false), 400)
      showToast(nextState ? `"${product.nama}" disimpan ke wishlist.` : `"${product.nama}" dihapus dari wishlist.`)
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal memperbarui wishlist.')
    }
  }

  const isSold = Boolean(product && (product.status === 'sold' || (product.stok !== undefined && Number(product.stok) === 0)))

  const handleAddToCart = (e) => {
    e.stopPropagation()
    if (isSold) {
      showToast('Mohon maaf, stok produk ini sedang habis.')
      return
    }
    addToCart(product)
  }

  const handleBuyNow = (e) => {
    e.stopPropagation()
    if (isSold) {
      showToast('Mohon maaf, stok produk ini sedang habis.')
      return
    }
    if (!user) {
      showToast('Silakan masuk atau daftar sebagai user terlebih dahulu untuk membeli.')
      navigate('/auth?mode=login')
      return
    }
    if (user.role === 'admin' || user.is_staff || user.is_superuser) {
      showToast('Akun admin tidak dapat melakukan pemesanan. Silakan gunakan akun user.')
      return
    }
    navigate('/checkout', { state: { items: [product], fromCart: false } })
  }

  const imageSrc =
    product.foto_display ||
    product.foto_url ||
    product.img ||
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600'

  return (
    <article
      className="product-card"
      data-id={product.id}
      onClick={() => navigate(`/produk/${product.id}`)}
      style={{ cursor: 'pointer' }}
    >
      {/* Product Image & Badges */}
      <div className="product-image">
        <img loading="lazy" src={imageSrc} alt={product.nama || product.name} />
        {isSold ? (
          <span className="product-badge" style={{ background: '#dc2626', color: '#fff', fontWeight: 700 }}>
            Habis / Sold
          </span>
        ) : (
          <span className="product-badge">{product.kondisi || product.condition || 'Good'}</span>
        )}

        {/* Wishlist Button */}
        <button
          className={`wish ${isWishlisted ? 'active' : ''} ${popHeart ? 'heart-pop' : ''}`}
          onClick={handleWishlist}
          aria-label="Simpan ke wishlist"
          title="Wishlist"
        >
          <svg
            viewBox="0 0 24 24"
            fill={isWishlisted ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M20.8 8.8c0 5-8.8 10-8.8 10S3.2 13.8 3.2 8.8A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.6Z" />
          </svg>
        </button>
      </div>

      {/* Product Information */}
      <div className="product-info">
        <div className="product-topline">
          <span>{product.kategori || product.category}</span>
          <span className="condition">{product.kondisi || product.condition}</span>
        </div>

        <h3 className="product-name">{product.nama || product.name}</h3>

        <div className="product-seller">
          <span>◉</span>
          <span>
            {product.seller_nama || product.seller || 'Mahasiswa'} · {product.lokasi || product.seller_kampus || product.location || 'Kampus'}
          </span>
        </div>

        <div className="product-bottom">
          <div>
            <span className="price">{formatPrice(product.harga || product.price)}</span>
            {(product.harga_asli || product.old) && (
              <span className="old-price">
                {formatPrice(product.harga_asli || product.old)}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isSold ? (
              <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, padding: '4px 8px', background: '#fee2e2', borderRadius: '6px' }}>
                Habis
              </span>
            ) : (
              <>
                <button
                  type="button"
                  className="mini-buy"
                  onClick={handleBuyNow}
                  title="Beli langsung"
                >
                  Beli
                </button>
                <button
                  type="button"
                  className="mini-add"
                  onClick={handleAddToCart}
                  aria-label="Tambah ke keranjang"
                  title="Tambah ke keranjang"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
