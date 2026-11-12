import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

export default function ArticleSection({ eyebrow = 'Artikel & Berita ModuLab', heading = 'Cerita sirkular & potensi barang mahasiswa' }) {
  const [articles, setArticles] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchLatest = () => {
      api.get('/artikel/?limit=3')
        .then((res) => setArticles(Array.isArray(res.data) ? res.data : []))
        .catch(() => setArticles([]))
    }

    fetchLatest()
    window.addEventListener('kampusloop:articlesUpdated', fetchLatest)
    return () => window.removeEventListener('kampusloop:articlesUpdated', fetchLatest)
  }, [])

  const formatDate = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2>{heading}</h2>
          </div>
          <Link to="/artikel" className="text-link">
            Lihat semua artikel →
          </Link>
        </div>

        {articles.length > 0 ? (
          <div className="article-grid">
            {articles.map((art) => (
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
                    <span>{formatDate(art.tanggal_dibuat)}</span>
                  </div>
                  <h3>{art.judul}</h3>
                  <p>{art.ringkasan}</p>
                  <div className="article-foot">
                    <span>{art.author_nama || 'Admin Web'}</span>
                    <span className="text-link">Baca artikel →</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <p style={{ margin: '0 0 12px', color: 'var(--muted)' }}>
              Temukan kabar terbaru dan artikel seputar ekonomi sirkular ModuLab di halaman Artikel.
            </p>
            <Link to="/artikel" className="btn btn-primary">
              Jelajahi Halaman Artikel ↗
            </Link>
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <Link to="/artikel" className="btn btn-outline">
            Baca Semua Artikel & Berita ModuLab ↗
          </Link>
        </div>
      </div>
    </section>
  )
}

