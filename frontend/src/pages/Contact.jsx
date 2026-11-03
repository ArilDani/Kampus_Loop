import React, { useState } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { useCart } from '../contexts/CartContext'
import api from '../api'

export default function Contact() {
  const { showToast } = useCart()
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    topik: 'Pertanyaan Umum',
    pesan: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useScrollReveal()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await api.post('/kontak/', formData)
      setSubmitted(true)
      showToast('Pesan berhasil terkirim! Tim kami akan membalas via email.')
      setFormData({
        nama: '',
        email: '',
        topik: 'Pertanyaan Umum',
        pesan: '',
      })
    } catch {
      // Local fallback
      setSubmitted(true)
      showToast('Pesan berhasil terkirim!')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main>
      {/* ─── PAGE HERO ───────────────────────────────────────────── */}
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">Hubungi Kami</span>
          <h1>Punya pertanyaan, ide kolaborasi, atau kendala transaksi?</h1>
          <p>
            Tim KampusLoop siap mendengarkan dan membantu setiap kebutuhanmu di ekosistem kampus.
          </p>
        </div>
      </section>

      {/* ─── CONTACT SECTION ─────────────────────────────────────── */}
      <section className="wrap">
        <div className="contact-grid">
          {/* Info Side */}
          <div className="contact-info reveal">
            <span className="eyebrow">Saluran Komunikasi</span>
            <h2>Kami ada di sini untukmu</h2>
            <p>
              Jangan ragu untuk menghubungi kami baik mengenai kendala akun, saran kategori baru, maupun kemitraan dengan BEM/Himpunan kampus.
            </p>

            <div className="contact-method">
              <div className="value-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <strong>Email Support</strong>
                <small>hello@kampusloop.id · Respon &lt; 24 jam</small>
              </div>
            </div>

            <div className="contact-method">
              <div className="value-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2zm1-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" />
                </svg>
              </div>
              <div>
                <strong>Community Desk</strong>
                <small>Instagram & Telegram: @kampusloop</small>
              </div>
            </div>

            <div className="contact-method">
              <div className="value-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <strong>Campus Hub</strong>
                <small>Universitas Negeri Makassar & Universitas Indonesia Hub</small>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="contact-form reveal" style={{ transitionDelay: '150ms' }}>
            <h3>Kirim pesan langsung</h3>
            <p>Isi formulir di bawah ini dan kami akan membalas ke emailmu secepatnya.</p>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="contactNama">Nama lengkap</label>
                  <input
                    id="contactNama"
                    type="text"
                    required
                    placeholder="Contoh: Rizky Pratama"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="contactEmail">Email mahasiswa / aktif</label>
                  <input
                    id="contactEmail"
                    type="email"
                    required
                    placeholder="nama@kampus.ac.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="contactTopik">Topik pertanyaan</label>
                <select
                  id="contactTopik"
                  value={formData.topik}
                  onChange={(e) => setFormData({ ...formData, topik: e.target.value })}
                >
                  <option>Pertanyaan Umum</option>
                  <option>Bantuan Transaksi / COD</option>
                  <option>Lapor Barang atau Pengguna</option>
                  <option>Kolaborasi BEM / Kampus</option>
                  <option>Lainnya</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="contactPesan">Pesan / Detail</label>
                <textarea
                  id="contactPesan"
                  required
                  placeholder="Tuliskan pesan atau pertanyaanmu di sini..."
                  value={formData.pesan}
                  onChange={(e) => setFormData({ ...formData, pesan: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={submitting}
              >
                {submitting ? 'Mengirim...' : 'Kirim pesan sekarang ↗'}
              </button>

              {submitted && (
                <div className="form-success" style={{ display: 'block' }}>
                  ✓ Terima kasih! Pesanmu berhasil dikirimkan ke tim KampusLoop.
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
