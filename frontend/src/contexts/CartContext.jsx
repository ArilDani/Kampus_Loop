import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const showToast = (msg) => {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2800)
  }

  const addToCart = (produk) => {
    const exists = cartItems.find(i => i.id === produk.id)
    if (!exists) {
      setCartItems(prev => [...prev, produk])
      showToast(`"${produk.nama}" ditambahkan ke keranjang!`)
    } else {
      showToast(`"${produk.nama}" sudah ada di keranjang.`)
    }
  }

  const removeFromCart = (produkId) => {
    setCartItems(prev => prev.filter(i => i.id !== produkId))
  }

  const clearCart = () => setCartItems([])

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, clearCart,
      toastMsg, toastVisible, showToast
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
