import React from 'react'
import { Link } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function About() {
  useScrollReveal()

  return (
    <main>
      {/* ─── PAGE HERO ───────────────────────────────────────────── */}
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">Tentang KampusLoop</span>
          <h1>Membangun ekosistem sirkular di setiap sudut kampus</h1>
          <p>
            Platform preloved terkurasi yang menghubungkan mahasiswa untuk saling bertukar, membeli, dan menjual barang perkuliahan secara berkelanjutan.
          </p>
        </div>
      </section>

      {/* ─── INTRO SECTION ───────────────────────────────────────── */}
      <section className="wrap">
        <div className="about-intro">
          <div className="about-visual reveal">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=85"
              alt="Mahasiswa berdiskusi di kampus"
            />
            <div className="about-caption">
              “Barang yang selesai kita pakai bisa menjadi awal perjalanan baru bagi teman sekampus kita.”
            </div>
          </div>

          <div className="about-text reveal" style={{ transitionDelay: '150ms' }}>
            <span className="eyebrow">Cerita Kami</span>
            <h2>Dari mahasiswa, untuk mahasiswa</h2>
            <p>
              Setiap awal semester, jutaan mahasiswa membeli buku, modul, alat praktikum, dan perlengkapan kos yang seringkali hanya terpakai selama beberapa bulan. Di akhir semester, barang-barang berharga tersebut menumpuk di pojok kos atau berakhir di tempat pembuangan.
            </p>
            <p>
              KampusLoop hadir untuk memutus siklus pemborosan tersebut. Kami percaya bahwa circular marketplace berbasis kampus adalah cara paling cerdas, hemat, dan ramah lingkungan untuk memenuhi kebutuhan mahasiswa.
            </p>
            <div style={{ marginTop: '24px' }}>
              <Link to="/shop" className="btn btn-primary">
                Jelajahi marketplace ↗
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STAT BAND ───────────────────────────────────────────── */}
      <section className="wrap" style={{ marginBottom: '85px' }}>
        <div className="stat-band reveal">
          <div className="stat">
            <strong>1.284+</strong>
            <span>Mahasiswa terdaftar</span>
          </div>
          <div className="stat">
            <strong>846+</strong>
            <span>Barang kembali berputar</span>
          </div>
          <div className="stat">
            <strong>Rp42,8 jt</strong>
            <span>Total perputaran hemat</span>
          </div>
          <div className="stat">
            <strong>0%</strong>
            <span>Potongan komisi perantara</span>
          </div>
        </div>
      </section>

      {/* ─── VALUES SECTION ──────────────────────────────────────── */}
      <section className="section" style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head reveal">
            <div>
              <span className="eyebrow">Nilai Utama</span>
              <h2>Tiga pilar yang kami jaga bersama</h2>
            </div>
            <p>
              Prinsip yang mendasari setiap interaksi dan transaksi di platform KampusLoop.
            </p>
          </div>

          <div className="values-grid">
            <div className="value-card reveal" style={{ transitionDelay: '0ms' }}>
              <div className="value-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3>Sirkular & Berkelanjutan</h3>
              <p>
                Setiap barang preloved yang berpindah tangan memperpanjang siklus guna barang dan mengurangi jejak karbon mahasiswa secara nyata.
              </p>
            </div>

            <div className="value-card reveal" style={{ transitionDelay: '100ms' }}>
              <div className="value-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3>Aman & Transparan</h3>
              <p>
                Profil penjual terverifikasi dengan identitas kampus dan sistem COD transparan di lingkungan kampus yang familiar dan terlindungi.
              </p>
            </div>

            <div className="value-card reveal" style={{ transitionDelay: '200ms' }}>
              <div className="value-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3>Hemat & Cerdas</h3>
              <p>
                Harga jujur yang ramah di kantong mahasiswa, membantu menekan beban biaya perlengkapan kuliah tanpa mengorbankan kualitas.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
