import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import ProductModal from '../components/ProductModal'
import { useScrollReveal } from '../hooks/useScrollReveal'
import api from '../api'

const CATEGORIES = [
  { name: 'Buku & Akademik', count: '140+ barang', type: 'book', img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80' },
  { name: 'Elektronik', count: '98+ barang', type: 'tech', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80' },
  { name: 'Fashion', count: '210+ barang', type: 'fashion', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80' },
  { name: 'Kos & Living', count: '75+ barang', type: 'dorm', img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80' },
  { name: 'Hobi & Organisasi', count: '45+ barang', type: 'hobby', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80' },
  { name: 'Lainnya', count: '60+ barang', type: 'other', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80' },
]

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const navigate = useNavigate()
  useScrollReveal()

  useEffect(() => {
    // Fetch products from Django API
    api.get('/produk/featured/')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.results || [])
        setFeaturedProducts(data.slice(0, 4))
      })
      .catch(() => {
        // Fallback to all products
        api.get('/produk/')
          .then((res) => {
            const data = Array.isArray(res.data) ? res.data : (res.data?.results || [])
            setFeaturedProducts(data.slice(0, 4))
          })
          .catch(() => {})
      })
  }, [])

  return (
    <main>
      {/* ─── HERO SECTION ────────────────────────────────────────── */}
      <section className="hero">
        <div className="wrap">
          <div className="hero-grid">
            {/* Copy */}
            <div className="hero-copy reveal">
              <span className="eyebrow">Circular Campus Economy</span>
              <h1>
                Reuse more. Spend less.{' '}
                <em>
                  Keep it in the loop.
                </em>
              </h1>
              <p className="hero-desc">
                Marketplace barang preloved terpercaya sesama mahasiswa. Beli buku, elektronik, dan kebutuhan kos dengan harga terjangkau, atau jual barangmu tanpa ribet.
              </p>

              <div className="hero-buttons">
                <Link to="/shop" className="btn btn-primary">
                  Mulai belanja ↗
                </Link>
                <Link to="/auth?mode=register" className="btn btn-dark">
                  Jual barangmu
                </Link>
              </div>

              <div className="hero-note">
                <div className="avatar-stack">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80" alt="Student" />
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80" alt="Student" />
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80" alt="Student" />
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80" alt="Student" />
                </div>
                <span>
                  <strong>1.280+ mahasiswa</strong> aktif bertransaksi hemat
                </span>
              </div>
            </div>

            {/* Visual Collage with Floating Animations */}
            <div className="hero-visual reveal" style={{ transitionDelay: '150ms' }}>
              {/* Main Product */}
              <div className="hero-product hero-main">
                <img
                  src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85"
                  alt="MacBook Air"
                />
              </div>

              {/* Secondary Product A */}
              <div className="hero-product hero-small-a">
                <img
                  src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=85"
                  alt="Buku Manajemen"
                />
              </div>

              {/* Secondary Product B */}
              <div className="hero-product hero-small-b">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=85"
                  alt="Headphones"
                />
              </div>

              {/* Secondary Product C */}
              <div className="hero-product hero-small-c">
                <img
                  src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=85"
                  alt="Backpack"
                />
              </div>

              {/* Floating Tag Top */}
              <div className="float-tag tag-top">
                <div className="tag-icon">✓</div>
                <div>
                  <strong>Mahasiswa Terverifikasi</strong>
                  <small>COD aman di kampus</small>
                </div>
              </div>

              {/* Floating Tag Bottom */}
              <div className="float-tag tag-bottom">
                <div className="tag-icon">✳</div>
                <div>
                  <strong>Hemat Hingga 70%</strong>
                  <small>Kondisi kurasi prima</small>
                </div>
              </div>

              {/* Spinning Circular Sticker */}
              <div className="hero-sticker spinning-sticker">
                <span>∞</span>
                CIRCULAR
                <br />
                CAMPUS
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST STRIP ─────────────────────────────────────────── */}
      <section className="trust-strip">
        <div className="wrap">
          <div className="trust-inner">
            <div className="trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Verifikasi Akun Kampus</span>
            </div>
            <div className="trust-sep" />
            <div className="trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>COD Langsung Bebas Ongkir</span>
            </div>
            <div className="trust-sep" />
            <div className="trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Cepat & Tanpa Potongan Biaya</span>
            </div>
            <div className="trust-sep" />
            <div className="trust-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>100% Circular Economy</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CATEGORY SECTION ────────────────────────────────────── */}
      <section className="section">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <span className="eyebrow">Eksplorasi Kategori</span>
              <h2>Pilihan barang preloved mahasiswa</h2>
            </div>
            <p>
              Dari buku kuliah, perangkat produktivitas, hingga perlengkapan kamar kos yang siap pakai kembali.
            </p>
          </div>

          <div className="category-grid">
            {CATEGORIES.map((cat, i) => (
              <div
                key={cat.name}
                className="category-card reveal"
                style={{ transitionDelay: `${i * 60}ms` }}
                onClick={() => navigate(`/shop?category=${encodeURIComponent(cat.name)}`)}
              >
                <div className={`category-art ${cat.type}`}>
                  <img src={cat.img} alt={cat.name} loading="lazy" />
                </div>
                <div className="category-meta">
                  <strong>{cat.name}</strong>
                  <span>{cat.count}</span>
                </div>
                <div className="category-arrow">↗</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ──────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <span className="eyebrow">Rekomendasi Terpopuler</span>
              <h2>Barang pilihan minggu ini</h2>
            </div>
            <Link to="/shop" className="text-link">
              Lihat semua produk →
            </Link>
          </div>

          <div className="product-grid">
            {featuredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={(prod) => setSelectedProduct(prod)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS SECTION ────────────────────────────────── */}
      <section className="section how-section">
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <span className="eyebrow">Cara Kerja</span>
              <h2>Sederhana, aman, dan tanpa biaya perantara</h2>
            </div>
            <p>
              Tiga langkah mudah untuk bertransaksi barang preloved di lingkungan kampusmu.
            </p>
          </div>

          <div className="steps">
            <div className="step-card reveal" style={{ transitionDelay: '0ms' }}>
              <span className="step-no">01</span>
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3>Temukan yang kamu butuhkan</h3>
              <p>
                Cari buku, gadget, atau perlengkapan kos dari mahasiswa sesama kampusmu dengan filter harga dan kondisi terpercaya.
              </p>
            </div>

            <div className="step-card reveal" style={{ transitionDelay: '100ms' }}>
              <span className="step-no">02</span>
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <h3>COD aman di area kampus</h3>
              <p>
                Sepakati lokasi bertemu di perpustakaan, kantin, atau fakultas. Cek barang secara langsung sebelum pembayaran.
              </p>
            </div>

            <div className="step-card reveal" style={{ transitionDelay: '200ms' }}>
              <span className="step-no">03</span>
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3>Beri barang kesempatan kedua</h3>
              <p>
                Kurangi limbah barang tidak terpakai, hemat pengeluaran kuliahmu, dan jaga sirkulasi barang tetap hidup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── IMPACT BANNER ───────────────────────────────────────── */}
      <section className="section" style={{ paddingBottom: '70px' }}>
        <div className="wrap">
          <div className="impact-banner reveal">
            <div>
              <h2>Punya barang di kos yang sudah tidak terpakai?</h2>
              <p>
                Ubah barang lamamu jadi uang saku tambahan dan bantu mahasiswa lain mendapatkan perlengkapan yang mereka butuhkan.
              </p>
            </div>
            <Link to="/auth?mode=register" className="btn btn-dark">
              Mulai jual sekarang ↗
            </Link>
          </div>
        </div>
      </section>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </main>
  )
}
