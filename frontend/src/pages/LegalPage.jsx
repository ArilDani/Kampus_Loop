import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function LegalPage({ type }) {
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

  const configMap = {
    privacy: {
      eyebrow: 'Legal & Privasi',
      title: settings?.kebijakan_privasi_judul || 'Kebijakan Privasi',
      body: settings?.kebijakan_privasi_isi || 'Memuat kebijakan privasi...',
    },
    terms: {
      eyebrow: 'Aturan Platform',
      title: settings?.syarat_ketentuan_judul || 'Syarat & Ketentuan',
      body: settings?.syarat_ketentuan_isi || 'Memuat syarat & ketentuan...',
    },
    security: {
      eyebrow: 'Keamanan Transaksi',
      title: settings?.panduan_keamanan_judul || 'Panduan Keamanan Transaksi',
      body: settings?.panduan_keamanan_isi || 'Memuat panduan keamanan...',
    },
  }

  const current = configMap[type] || configMap.privacy

  return (
    <main>
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">{current.eyebrow}</span>
          <h1>{current.title}</h1>
          <p>
            Ketentuan resmi {settings?.nama_toko || 'KampusLoop'} untuk menjaga transparansi, privasi data mahasiswa, dan keamanan transaksi di kampus.
          </p>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: '75px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '20px', padding: '32px', maxWidth: '860px' }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '13px', lineHeight: 1.85, color: 'var(--ink)' }}>
            {current.body}
          </pre>

          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--line)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <small style={{ color: 'var(--muted)' }}>
              Ada pertanyaan? Hubungi kami di {settings?.email_support || 'hello@kampusloop.id'}
            </small>
            <Link to="/contact" className="btn btn-outline">
              Hubungi Kami →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

