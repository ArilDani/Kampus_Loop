import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { IconStore, IconShield, IconUser } from './Icons'

export default function Navbar() {
  const { user } = useAuth()
  const { cartItems } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const cartCount = cartItems.length

  const handleOpenCart = () => {
    window.dispatchEvent(new CustomEvent('openCartDrawer'))
  }

  const isActive = (path) => location.pathname === path

  return (
    <header className="header">
      <nav className="nav" aria-label="Main Navigation">
        {/* Brand */}
        <Link to="/" className="brand" onClick={() => setMobileOpen(false)}>
          <span className="brand-mark">
            <svg viewBox="0 0 32 32" fill="none">
              <path
                d="M5.2 18.4c2.1-5.2 6.6-8.7 10.6-8.7 3.6 0 5.1 3.1 3.4 6.8-1.8 3.9-6.4 6.8-10 6.8-3.2 0-5.1-2-4-4.9Z"
                stroke="currentColor"
                strokeWidth="2.8"
              />
              <path
                d="M26.8 13.6c-2.1 5.2-6.6 8.7-10.6 8.7-3.6 0-5.1-3.1-3.4-6.8 1.8-3.9 6.4-6.8 10-6.8 3.2 0 5.1 2 4 4.9Z"
                stroke="currentColor"
                strokeWidth="2.8"
              />
            </svg>
          </span>
          KampusLoop
        </Link>

        {/* Navigation Links */}
        <div className={`nav-links ${mobileOpen ? 'open' : ''}`}>
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            Beranda
          </Link>
          <Link
            to="/shop"
            className={`nav-link ${isActive('/shop') ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            E-commerce
          </Link>
          <Link
            to="/about"
            className={`nav-link ${isActive('/about') ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            About
          </Link>
          <Link
            to="/contact"
            className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            Contact
          </Link>
        </div>

        {/* Nav Actions */}
        <div className="nav-actions">
          {/* Cart Button */}
          <button
            className="icon-btn cart-btn"
            onClick={handleOpenCart}
            aria-label="Keranjang belanja"
            title="Buka keranjang"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 01-8 0" />
            </svg>
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>

          {/* User Status / Login Buttons */}
          {user ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              {user.is_staff || user.is_superuser || user.role === 'admin' ? (
                <Link
                  to="/admin"
                  className="btn btn-dark account-nav-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0f172a' }}
                >
                  <IconShield size={16} />
                  <span>Admin Panel</span>
                </Link>
              ) : user.role === 'penjual' || user.is_seller ? (
                <>
                  <Link
                    to="/dashboard/penjual"
                    className="btn btn-primary account-nav-btn"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <IconStore size={16} />
                    <span>Dashboard Penjual</span>
                  </Link>
                  <Link
                    to="/dashboard"
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <IconUser size={14} />
                    <span>{user.name ? user.name.split(' ')[0] : 'Akun'}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/dashboard?tab=seller-apply"
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: '13px', borderColor: '#bbf7d0', color: '#166534', background: '#f0fdf4' }}
                  >
                    Daftar Penjual ↗
                  </Link>
                  <Link
                    to="/dashboard"
                    className="btn btn-dark account-nav-btn"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <IconUser size={16} />
                    <span>{user.name ? user.name.split(' ')[0] : 'Akun'}</span>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              <Link to="/auth?mode=login" className="btn btn-outline">
                Masuk
              </Link>
              <Link to="/auth?mode=register" className="btn btn-primary sell-btn">
                Daftar ↗
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="icon-btn menu-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
      </nav>
    </header>
  )
}
