import React, { useEffect } from 'react'
import { useCart } from '../contexts/CartContext'

export default function ProductModal({ product, onClose }) {
  const { addToCart } = useCart()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.classList.add('lock')

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.classList.remove('lock')
    }
  }, [onClose])

  if (!product) return null

  const formatPrice = (price) => {
    return 'Rp' + Number(price || 0).toLocaleString('id-ID')
  }

  const imageSrc =
    product.foto_display ||
    product.foto_url ||
    product.img ||
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800'

  const handleAdd = () => {
    addToCart(product)
    onClose()
  }

  return (
    <div
      className="overlay show"
      id="productOverlay"
      onClick={(e) => {
        if (e.target.id === 'productOverlay') onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal">
        {/* Close button */}
        <button className="modal-close" onClick={onClose} aria-label="Tutup modal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="product-modal-content">
          {/* Modal Image */}
          <div className="modal-image">
            <img src={imageSrc} alt={product.nama || product.name} />
          </div>

          {/* Modal Info */}
          <div className="modal-info">
            <span className="eyebrow">{product.kategori || product.category}</span>
            <h2>{product.nama || product.name}</h2>

            <div className="product-seller">
              <span>◉</span>
              <span>
                {product.seller_nama || product.seller || 'Mahasiswa'} · {product.seller_kampus || product.campus || 'Kampus'}
              </span>
            </div>

            <div className="modal-price">
              {formatPrice(product.harga || product.price)}{' '}
              {(product.harga_asli || product.old) && (
                <span className="old-price">
                  {formatPrice(product.harga_asli || product.old)}
                </span>
              )}
            </div>

            <p>{product.deskripsi || product.desc}</p>

            <div className="modal-spec">
              <span>Kondisi: {product.kondisi || product.condition}</span>
              <span>Lokasi: {product.lokasi || product.location || 'Kampus'}</span>
              <span>COD tersedia*</span>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleAdd}
            >
              Tambah ke keranjang ↗
            </button>

            <p style={{ fontSize: '9px', marginTop: '12px', color: 'var(--muted)' }}>
              *Metode transaksi mengikuti kesepakatan penjual dan pembeli secara aman di lingkungan kampus.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
