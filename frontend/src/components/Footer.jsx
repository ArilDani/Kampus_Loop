import React from 'react'
import { Link } from 'react-router-dom'
import { IconHeart } from './Icons'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          {/* Brand & Mission */}
          <div>
            <Link to="/" className="brand" style={{ color: 'white' }}>
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
            <p className="footer-copy">
              Marketplace barang preloved khusus mahasiswa. Temukan barang yang kamu butuhkan, jual yang tak lagi digunakan, dan biarkan semuanya terus berputar.
            </p>
          </div>

          {/* Explore Links */}
          <div>
            <h4>Explore</h4>
            <div className="footer-links">
              <Link to="/">Beranda</Link>
              <Link to="/about">About</Link>
              <Link to="/shop">E-commerce</Link>
              <Link to="/contact">Contact</Link>
            </div>
          </div>

          {/* Categories Links */}
          <div>
            <h4>Categories</h4>
            <div className="footer-links">
              <Link to="/shop?category=Buku+%26+Akademik">Buku & Akademik</Link>
              <Link to="/shop?category=Elektronik">Elektronik</Link>
              <Link to="/shop?category=Fashion">Fashion</Link>
              <Link to="/shop?category=Kos+%26+Living">Kos & Living</Link>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h4>Stay in the loop</h4>
            <p className="footer-copy" style={{ marginTop: 0 }}>
              Ikuti kabar terbaru dan cerita dari komunitas mahasiswa KampusLoop.
            </p>
            <div className="footer-social">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                ig
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok">
                tk
              </a>
              <a href="mailto:hello@kampusloop.id" aria-label="Email">
                @
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <span>© 2026 KampusLoop. Reuse more, waste less.</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Made with care for campus communities <IconHeart size={13} style={{ color: '#10b981' }} />
          </span>
        </div>
      </div>
    </footer>
  )
}
