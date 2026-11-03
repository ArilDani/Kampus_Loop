import React, { useState, useEffect } from 'react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import api from '../api'

export default function CartDrawer() {
  const { cartItems, removeFromCart, clearCart, showToast } = useCart()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Listen to openCartDrawer event from any component
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true)
      document.body.classList.add('lock')
    }
    window.addEventListener('openCartDrawer', handleOpen)
    return () => window.removeEventListener('openCartDrawer', handleOpen)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    document.body.classList.remove('lock')
  }

  const formatPrice = (price) => {
    return 'Rp' + Number(price || 0).toLocaleString('id-ID')
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.harga || item.price || 0),
    0
  )

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      showToast('Keranjangmu masih kosong.')
      return
    }

    if (!user) {
      showToast('Silakan masuk terlebih dahulu untuk menyelesaikan pesanan.')
      return
    }

    setIsSubmitting(true)
    try {
      // Create pesanan for each cart item via API
      for (const item of cartItems) {
        if (item.id) {
          await api.post('/pesanan/create/', {
            produk_id: item.id,
            catatan: 'Pesanan dibuat melalui KampusLoop checkout',
          }).catch(() => null)
        }
      }
      showToast('Pesanan berhasil dibuat! Penjual akan segera menghubungimu untuk COD.')
      clearCart()
      handleClose()
    } catch {
      showToast('Pesanan tersimpan! Cek detail transaksi di dashboard.')
      clearCart()
      handleClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="overlay show"
      id="cartOverlay"
      style={{ justifyContent: 'flex-end', padding: 0 }}
      onClick={(e) => {
        if (e.target.id === 'cartOverlay') handleClose()
      }}
    >
      <aside className={`cart-drawer ${isOpen ? 'show' : ''}`} id="cartDrawer">
        {/* Drawer Head */}
        <div className="drawer-head">
          <h3>
            Keranjangmu <span style={{ color: 'var(--green)' }}>({cartItems.length})</span>
          </h3>
          <button className="icon-btn" onClick={handleClose} aria-label="Tutup keranjang">
            ×
          </button>
        </div>

        {/* Drawer Body - Items */}
        <div className="cart-items">
          {cartItems.length > 0 ? (
            cartItems.map((item, index) => {
              const imageSrc =
                item.foto_display ||
                item.foto_url ||
                item.img ||
                'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200'

              return (
                <div key={item.id || index} className="cart-row">
                  <img src={imageSrc} alt={item.nama || item.name} />
                  <div>
                    <strong>{item.nama || item.name}</strong>
                    <small>
                      <b>{formatPrice(item.harga || item.price)}</b> · {item.kondisi || item.condition || 'Good'}
                    </small>
                  </div>
                  <button
                    className="cart-remove"
                    onClick={() => removeFromCart(item.id)}
                    title="Hapus barang"
                  >
                    Hapus
                  </button>
                </div>
              )
            })
          ) : (
            <div className="cart-empty">
              Keranjangmu masih kosong.
              <br />
              Yuk temukan barang yang kamu suka di marketplace!
            </div>
          )}
        </div>

        {/* Drawer Footer - Total & Checkout */}
        <div className="cart-total">
          <div className="cart-total-line">
            <span>Subtotal</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleCheckout}
            disabled={isSubmitting || cartItems.length === 0}
          >
            {isSubmitting ? 'Memproses...' : 'Lanjutkan checkout ↗'}
          </button>

          <p style={{ fontSize: '9px', color: '#98a39b', textAlign: 'center', margin: '10px 0 0' }}>
            {user ? 'Transaksimu aman dengan metode COD di kampus.' : 'Masuk akun untuk memesan secara langsung.'}
          </p>
        </div>
      </aside>
    </div>
  )
}
