import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'

// Components
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import Toast from './components/Toast'

// Pages
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Checkout from './pages/Checkout'
import About from './pages/About'
import Artikel from './pages/Artikel'
import Contact from './pages/Contact'
import Auth from './pages/Auth'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import LegalPage from './pages/LegalPage'

// Scroll restoration on route change
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])
  return null
}

function MainLayout() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin')

  return (
    <>
      <ScrollToTop />
      {/* Subtle Noise Texture */}
      <div className="noise" />

      {/* Global Navbar */}
      <Navbar />

      {/* Main Pages Routing */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/produk/:id" element={<ProductDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/about" element={<About />} />
        <Route path="/artikel" element={<Artikel />} />
        <Route path="/artikel/:slug" element={<Artikel />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/kebijakan-privasi" element={<LegalPage type="privacy" />} />
        <Route path="/syarat-ketentuan" element={<LegalPage type="terms" />} />
        <Route path="/panduan-keamanan" element={<LegalPage type="security" />} />
        <Route path="*" element={<Home />} />
      </Routes>

      {/* Global Slide-In Cart Drawer & Toast Notifications */}
      <CartDrawer />
      <Toast />

      {/* Footer on public pages */}
      {!isDashboard && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}
