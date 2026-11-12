import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import api from '../api'

export default function Footer() {
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    const loadSettings = () => {
      api.get('/settings/public/')
        .then((res) => setSettings(res.data))
        .catch(() => {})
    }
    loadSettings()
    window.addEventListener('kampusloop:settingsUpdated', loadSettings)
    return () => window.removeEventListener('kampusloop:settingsUpdated', loadSettings)
  }, [])

  const waDigits = (settings?.no_wa || '').replace(/[^0-9]/g, '')
  const waHref = waDigits
    ? `https://wa.me/${waDigits.startsWith('0') ? '62' + waDigits.slice(1) : waDigits}`
    : null

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
              {settings?.nama_toko || 'KampusLoop'}
            </Link>
            <p className="footer-copy">
              {settings?.footer_deskripsi ||
                'Marketplace barang preloved khusus mahasiswa. Temukan barang yang kamu butuhkan, jual yang tak lagi digunakan, dan biarkan semuanya terus berputar.'}
            </p>
          </div>

          {/* Explore Links */}
          <div>
            <h4>Explore</h4>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/about">About</Link>
              <Link to="/shop">Shop</Link>
              <Link to="/artikel">Artikel</Link>
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
              Ikuti kabar terbaru dan cerita dari komunitas mahasiswa {settings?.nama_toko || 'KampusLoop'}.
            </p>
            <div className="footer-social">
              <a
                href={settings?.instagram_url || 'https://instagram.com'}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                title={`Instagram ${settings?.instagram_handle || ''}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href={settings?.tiktok_url || 'https://tiktok.com'}
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                title="TikTok"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" />
                  <path d="M14 4c.8 2.5 2.7 4 5 4" />
                </svg>
              </a>
              {waHref && (
                <a href={waHref} target="_blank" rel="noreferrer" aria-label="WhatsApp" title={settings?.no_wa}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L4 20l1.1-4.1A8.5 8.5 0 1 1 21 11.5Z" />
                    <path d="M9.5 9.2c.3-.5.7-.5 1-.2l.9 1.1c.2.3.2.6 0 .9l-.4.5c.6 1 1.4 1.8 2.4 2.4l.5-.4c.3-.2.6-.2.9 0l1.1.9c.3.3.3.7-.2 1-.7.5-1.6.6-2.5.2-1.8-.8-3.9-2.9-4.7-4.7-.4-.9-.3-1.8.2-2.5Z" />
                  </svg>
                </a>
              )}
              <a href={`mailto:${settings?.email_support || 'hello@kampusloop.id'}`} aria-label="Email" title={settings?.email_support || 'hello@kampusloop.id'}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2.5" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <span>{settings?.footer_copyright || '© 2026 KampusLoop. Reuse more, waste less.'}</span>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/kebijakan-privasi" style={{ color: '#a5b5aa' }}>
              {settings?.kebijakan_privasi_judul || 'Kebijakan Privasi'}
            </Link>
            <Link to="/syarat-ketentuan" style={{ color: '#a5b5aa' }}>
              {settings?.syarat_ketentuan_judul || 'Syarat & Ketentuan'}
            </Link>
            <Link to="/panduan-keamanan" style={{ color: '#a5b5aa' }}>
              {settings?.panduan_keamanan_judul || 'Panduan Keamanan'}
            </Link>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              {(settings?.footer_tagline_bawah || 'Made with care for campus communities').replace(/♡/g, '').trim()}
              <Heart size={12} strokeWidth={2.2} />
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
