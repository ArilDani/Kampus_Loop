import React, { useState, useEffect, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Calendar, Eye, User, Link2, Music2, Phone, Mail } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import ProductModal from '../components/ProductModal'
import { useCart } from '../contexts/CartContext'
import api from '../api'
import { isHtmlContent, sanitizeHtml } from '../utils/sanitizeHtml'

export default function Artikel() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { showToast } = useCart()

  const [articles, setArticles] = useState([])
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [siteSettings, setSiteSettings] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')

  const fetchArticlesAndExtras = async () => {
    setLoading(true)
    try {
      const [artRes, prodRes, setRes] = await Promise.all([
        api.get('/artikel/').catch(() => ({ data: [] })),
        api.get('/produk/featured/').catch(() => ({ data: [] })),
        api.get('/settings/public/').catch(() => ({ data: null })),
      ])
      setArticles(Array.isArray(artRes.data) ? artRes.data : [])
      setFeaturedProducts(Array.isArray(prodRes.data) ? prodRes.data : [])
      if (setRes.data) setSiteSettings(setRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticlesAndExtras()
    window.addEventListener('kampusloop:articlesUpdated', fetchArticlesAndExtras)
    window.addEventListener('kampusloop:settingsUpdated', fetchArticlesAndExtras)
    return () => {
      window.removeEventListener('kampusloop:articlesUpdated', fetchArticlesAndExtras)
      window.removeEventListener('kampusloop:settingsUpdated', fetchArticlesAndExtras)
    }
  }, [])

  useEffect(() => {
    if (!slug) {
      setSelectedArticle(null)
      return
    }
    api.get(`/artikel/${slug}/`)
      .then((res) => setSelectedArticle(res.data))
      .catch(() => setSelectedArticle(null))
  }, [slug])

  const categories = useMemo(() => {
    const cats = new Set(['Semua'])
    articles.forEach((a) => {
      if (a.kategori) cats.add(a.kategori)
    })
    return Array.from(cats)
  }, [articles])

  const featuredArticle = articles[0] || null

  const archiveArticles = useMemo(() => {
    const base = articles.length > 1 ? articles.slice(1) : articles
    return base.filter((a) => {
      if (selectedCategory !== 'Semua' && a.kategori !== selectedCategory) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const txt = `${a.judul} ${a.ringkasan} ${a.konten} ${a.kategori}`.toLowerCase()
        if (!txt.includes(q)) return false
      }
      return true
    })
  }, [articles, selectedCategory, searchQuery])

  const popularArticles = useMemo(() => {
    return [...articles]
      .filter((a) => !selectedArticle || a.id !== selectedArticle.id)
      .sort((a, b) => (b.dilihat || 0) - (a.dilihat || 0))
      .slice(0, 4)
  }, [articles, selectedArticle])

  const otherArticles = useMemo(() => {
    return articles
      .filter((a) => !selectedArticle || a.id !== selectedArticle.id)
      .slice(0, 3)
  }, [articles, selectedArticle])

  const formatDate = (iso, short = false) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: short ? 'short' : 'long',
      year: 'numeric',
    })
  }

  const formatPrice = (p) => 'Rp' + Number(p || 0).toLocaleString('id-ID')

  const waDigits = (siteSettings?.no_wa || '').replace(/[^0-9]/g, '')
  const waHref = waDigits
    ? `https://wa.me/${waDigits.startsWith('0') ? '62' + waDigits.slice(1) : waDigits}`
    : '/contact'

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('Tautan artikel berhasil disalin!')
      })
    }
  }

  // ─── MODE BACA ARTIKEL (GAMBAR 3 — BLOGGER / EDITORIAL LAYOUT) ─────────────
  if (slug && selectedArticle) {
    const htmlMode = isHtmlContent(selectedArticle.konten)
    const coverImg =
      selectedArticle.gambar_url ||
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=85'

    return (
      <main>
        {/* Top Backdrop Hero Banner */}
        <section
          className="artikel-reader-hero"
          style={{ backgroundImage: `url(${coverImg})` }}
        >
          <div className="wrap">
            <div>
              <Link to="/artikel" className="artikel-reader-back">
                ← Kembali ke Semua Artikel
              </Link>
              <span className="artikel-reader-badge">
                {selectedArticle.kategori || 'Berita ModuLab'}
              </span>
            </div>

            <h1 className="artikel-reader-title">{selectedArticle.judul}</h1>

            <div className="artikel-reader-meta">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} /> {formatDate(selectedArticle.tanggal_dibuat)}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Eye size={13} /> {selectedArticle.dilihat || 0} kali dibaca
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <User size={13} /> {selectedArticle.author_nama || 'Admin Web'}
              </span>
            </div>
          </div>
        </section>

        <section className="wrap">
          <div className="artikel-reader-layout">
            {/* Left Column: Main Article */}
            <article className="artikel-reader-main">
              {selectedArticle.ringkasan && (
                <p className="article-lead">{selectedArticle.ringkasan}</p>
              )}

              {htmlMode ? (
                <div
                  className="article-prose"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedArticle.konten) }}
                />
              ) : (
                <div className="article-prose" style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedArticle.konten}
                </div>
              )}

              {/* Share & Action Row */}
              <div style={{ marginTop: '30px', paddingTop: '18px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Bagikan:</span>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: '10px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    onClick={handleCopyLink}
                  >
                    <Link2 size={12} /> <span>Salin Link</span>
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(selectedArticle.judul + ' - ' + window.location.href)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline"
                    style={{ fontSize: '10px', padding: '6px 12px' }}
                  >
                    WhatsApp ↗
                  </a>
                </div>
                <Link to="/shop" className="btn btn-primary" style={{ fontSize: '10px' }}>
                  Belanja di Shop ↗
                </Link>
              </div>
            </article>

            {/* Right Sidebar (Blogger-Style Widgets: Unggulan, List Artikel, Produk Unggulan, Social Media) */}
            <aside className="artikel-reader-sidebar">
              {/* Widget 1: Artikel Unggulan / Populer */}
              <div className="blogger-widget">
                <h3 className="blogger-widget-title">
                  <span>Artikel Unggulan</span>
                  <span style={{ fontSize: '10px', color: 'var(--green)' }}>Populer</span>
                </h3>
                <div className="blogger-post-list">
                  {(popularArticles.length > 0 ? popularArticles : articles.slice(0, 3)).map((art) => (
                    <div
                      key={art.id}
                      className="blogger-post-item"
                      onClick={() => navigate(`/artikel/${art.slug}`)}
                    >
                      <img
                        src={art.gambar_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400'}
                        alt={art.judul}
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400'
                        }}
                      />
                      <div>
                        <small>{formatDate(art.tanggal_dibuat, true)} · {art.dilihat || 0} dibaca</small>
                        <strong>{art.judul}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget 2: Daftar Artikel Terbaru */}
              <div className="blogger-widget">
                <h3 className="blogger-widget-title">
                  <span>List Artikel Terbaru</span>
                  <Link to="/artikel" style={{ fontSize: '10px', color: 'var(--green)' }}>Semua →</Link>
                </h3>
                <div className="blogger-link-list">
                  {articles.slice(0, 5).map((art) => (
                    <Link key={art.id} to={`/artikel/${art.slug}`} className="blogger-link-item">
                      <strong>{art.judul}</strong>
                      <small>{art.kategori} · {formatDate(art.tanggal_dibuat, true)}</small>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Widget 3: Produk Unggulan */}
              <div className="blogger-widget">
                <h3 className="blogger-widget-title">
                  <span>Produk Unggulan</span>
                  <Link to="/shop" style={{ fontSize: '10px', color: 'var(--green)' }}>Shop →</Link>
                </h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {featuredProducts.slice(0, 3).map((prod) => (
                    <div
                      key={prod.id}
                      className="blogger-product-item"
                      onClick={() => setSelectedProduct(prod)}
                    >
                      <img
                        src={prod.foto_display || prod.foto_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200'}
                        alt={prod.nama}
                      />
                      <div style={{ minWidth: 0 }}>
                        <strong>{prod.nama}</strong>
                        <span>{formatPrice(prod.harga)}</span>
                        <small>{prod.kondisi} · {prod.kategori}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget 4: Social Media */}
              <div className="blogger-widget">
                <h3 className="blogger-widget-title">
                  <span>Social Media & Komunitas</span>
                </h3>
                <div className="blogger-social-grid">
                  <a
                    href={siteSettings?.instagram_url || 'https://instagram.com'}
                    target="_blank"
                    rel="noreferrer"
                    className="blogger-social-btn"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>{' '}
                    <span>Instagram</span>
                  </a>
                  <a
                    href={siteSettings?.tiktok_url || 'https://tiktok.com'}
                    target="_blank"
                    rel="noreferrer"
                    className="blogger-social-btn"
                  >
                    <Music2 size={14} /> <span>TikTok</span>
                  </a>
                  {waHref.startsWith('http') ? (
                    <a href={waHref} target="_blank" rel="noreferrer" className="blogger-social-btn">
                      <Phone size={14} /> <span>WhatsApp</span>
                    </a>
                  ) : (
                    <Link to="/contact" className="blogger-social-btn">
                      <Phone size={14} /> <span>Contact</span>
                    </Link>
                  )}
                  <a
                    href={`mailto:${siteSettings?.email_support || 'hello@kampusloop.id'}`}
                    className="blogger-social-btn"
                  >
                    <Mail size={14} /> <span>Email</span>
                  </a>
                </div>
              </div>
            </aside>
          </div>

          {/* Bottom Sections Below Article: Artikel Lainnya + Produk Unggulan + Social */}
          <div className="artikel-reader-bottom">
            {otherArticles.length > 0 && (
              <div>
                <div className="section-head" style={{ marginBottom: '18px' }}>
                  <div>
                    <span className="eyebrow">Baca Selanjutnya</span>
                    <h2>Artikel Lainnya</h2>
                  </div>
                  <Link to="/artikel" className="text-link">Lihat semua artikel →</Link>
                </div>
                <div className="article-grid">
                  {otherArticles.map((art) => (
                    <article
                      key={art.id}
                      className="article-card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/artikel/${art.slug}`)}
                    >
                      <div className="article-cover">
                        <img
                          src={art.gambar_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80'}
                          alt={art.judul}
                        />
                      </div>
                      <div className="article-body">
                        <div className="article-meta">
                          <span className="article-cat">{art.kategori || 'Berita ModuLab'}</span>
                          <span>{formatDate(art.tanggal_dibuat, true)}</span>
                        </div>
                        <h3>{art.judul}</h3>
                        <p>{art.ringkasan}</p>
                        <div className="article-foot">
                          <span>Oleh {art.author_nama || 'Admin Web'}</span>
                          <span className="text-link">Baca selengkapnya →</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {featuredProducts.length > 0 && (
              <div>
                <div className="section-head" style={{ marginBottom: '18px' }}>
                  <div>
                    <span className="eyebrow">Rekomendasi KampusLoop</span>
                    <h2>Produk Unggulan</h2>
                  </div>
                  <Link to="/shop" className="text-link">Buka semua produk →</Link>
                </div>
                <div className="product-grid">
                  {featuredProducts.slice(0, 4).map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onSelect={(p) => setSelectedProduct(p)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {selectedProduct && (
          <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        )}
      </main>
    )
  }

  // ─── HALAMAN DAFTAR ARTIKEL (GAMBAR 1: PILIHAN REDAKSI + GAMBAR 2: ARSIP LIST) ───
  return (
    <main>
      {/* Gambar 1: Artikel Terbaru / Pilihan Redaksi */}
      {featuredArticle && (
        <section className="artikel-featured-section">
          <div className="wrap">
            <span className="artikel-section-kicker">Artikel Terbaru · Pilihan Redaksi</span>
            <article
              className="artikel-featured-card"
              onClick={() => navigate(`/artikel/${featuredArticle.slug}`)}
            >
              <div className="artikel-featured-media">
                <img
                  src={
                    featuredArticle.gambar_url ||
                    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=85'
                  }
                  alt={featuredArticle.judul}
                />
              </div>
              <div className="artikel-featured-body">
                <div className="artikel-featured-meta">
                  <span>{featuredArticle.kategori || 'Berita ModuLab'}</span>
                  <span>·</span>
                  <span>{formatDate(featuredArticle.tanggal_dibuat, true).toUpperCase()}</span>
                </div>
                <h1>{featuredArticle.judul}</h1>
                <p>{featuredArticle.ringkasan}</p>
                <div className="artikel-featured-foot">
                  <span>{featuredArticle.author_nama || 'Admin Web'}</span>
                  <span className="text-link">Baca Berita →</span>
                </div>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* Gambar 2: Arsip Berita / List Artikel */}
      <section className="wrap" style={{ paddingBottom: '85px' }}>
        <div className="artikel-archive-head">
          <div>
            <span className="eyebrow">Arsip Artikel</span>
            <h2>Semua Artikel</h2>
            <p>Jelajahi seluruh kabar ModuLab, edukasi barang bernilai, dan cerita mahasiswa.</p>
          </div>
          <span className="artikel-archive-count">{archiveArticles.length} artikel</span>
        </div>

        {/* Search & Category Filter */}
        <div className="shop-toolbar" style={{ marginBottom: '22px' }}>
          <div className="searchbox">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari artikel atau berita ModuLab..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`btn ${selectedCategory === cat ? 'btn-dark' : 'btn-outline'}`}
                style={{ fontSize: '10px', padding: '8px 14px' }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            Memuat artikel ModuLab...
          </div>
        ) : archiveArticles.length > 0 ? (
          <div className="article-grid">
            {archiveArticles.map((art) => (
              <article
                key={art.id}
                className="article-card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/artikel/${art.slug}`)}
              >
                <div className="article-cover">
                  <img
                    src={
                      art.gambar_url ||
                      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={art.judul}
                    loading="lazy"
                  />
                </div>
                <div className="article-body">
                  <div className="article-meta">
                    <span className="article-cat">{art.kategori || 'Berita ModuLab'}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {formatDate(art.tanggal_dibuat, true).toUpperCase()}
                    </span>
                  </div>
                  <h3>{art.judul}</h3>
                  <p>{art.ringkasan}</p>
                  <div className="article-foot">
                    <span>Oleh {art.author_nama || 'Admin Web'}</span>
                    <span className="text-link">Baca selengkapnya →</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <strong>Belum ada artikel yang sesuai filter.</strong>
            <p style={{ marginTop: '8px', fontSize: '12px' }}>
              Admin Web dapat menambahkan artikel atau berita ModuLab melalui dashboard Admin.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
