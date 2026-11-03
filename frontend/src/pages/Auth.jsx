import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { IconEye, IconEyeOff, IconCheck } from '../components/Icons'

export default function Auth() {
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login'
  const [isRegister, setIsRegister] = useState(initialMode === 'register')

  const { login, register } = useAuth()
  const { showToast } = useCart()
  const navigate = useNavigate()

  // Form states
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerCampus, setRegisterCampus] = useState('Universitas Negeri Makassar')
  const [registerPassword, setRegisterPassword] = useState('')
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)

  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleDemoFill = (role) => {
    if (role === 'penjual') {
      setLoginEmail('penjual@kampusloop.id')
      setLoginPassword('kampus123')
    } else if (role === 'user') {
      setLoginEmail('mahasiswa@kampusloop.id')
      setLoginPassword('kampus123')
    } else if (role === 'applicant') {
      setLoginEmail('nadia@kampusloop.id')
      setLoginPassword('kampus123')
    } else {
      setLoginEmail('admin@kampusloop.id')
      setLoginPassword('admin123')
    }
    setErrorMsg('')
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSubmitting(true)

    try {
      const data = await login(loginEmail.trim().toLowerCase(), loginPassword)
      showToast(`Selamat datang kembali, ${data.user.name.split(' ')[0]}!`)
      if (data.user.role === 'admin' || data.user.is_superuser || data.user.is_staff) {
        navigate('/admin')
      } else if (data.user.role === 'penjual' || data.user.is_seller) {
        navigate('/dashboard/penjual')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
          'Email atau kata sandi belum sesuai. Silakan gunakan akun demo atau daftar akun baru.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSubmitting(true)

    try {
      const data = await register(
        registerName.trim(),
        registerEmail.trim().toLowerCase(),
        registerCampus,
        registerPassword
      )
      showToast(`Akun berhasil dibuat! Selamat datang di KampusLoop, ${data.user.name.split(' ')[0]}.`)
      navigate('/dashboard')
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
          'Gagal mendaftar. Pastikan format email valid dan belum terdaftar.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page wrap">
      <div className="auth-shell">
        {/* ─── VISUAL SIDE ────────────────────────────────────────── */}
        <div className={`auth-visual ${isRegister ? 'auth-visual-register' : ''}`}>
          <div className="auth-visual-orb orb-one" />
          <div className="auth-visual-orb orb-two" />

          <div>
            <Link to="/" className="brand" style={{ color: '#fff' }}>
              <span className="brand-mark">∞</span>
              KampusLoop
            </Link>

            <div className="auth-visual-copy">
              <span className="eyebrow">{isRegister ? 'Gabung Komunitas' : 'Sirkular Marketplace'}</span>
              <h1>
                {isRegister ? (
                  <>
                    Mulai jual & beli <em>secara sirkular.</em>
                  </>
                ) : (
                  <>
                    Selamat datang <em>kembali.</em>
                  </>
                )}
              </h1>
              <p>
                Platform marketplace preloved antar mahasiswa. Hemat pengeluaran kuliah dan berikan barangmu kesempatan kedua.
              </p>
            </div>
          </div>

          {/* Photo stack animation */}
          <div className="auth-photo-stack">
            <div className="auth-photo photo-large">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600"
                alt="Students"
              />
            </div>
            <div className="auth-photo photo-small">
              <img
                src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"
                alt="Books"
              />
            </div>
            <div className="auth-floating-note">
              <span>✓</span>
              <div>
                <strong>1.280+ Mahasiswa</strong>
                <small>Terverifikasi aman & terpercaya</small>
              </div>
            </div>
          </div>

          <div className="auth-visual-foot">
            <span>KAMPUSLOOP STUDENT SPACE</span>
            <span>MAKASSAR · INDONESIA</span>
          </div>
        </div>

        {/* ─── FORM SIDE ──────────────────────────────────────────── */}
        <div className="auth-form-side">
          <Link to="/" className="auth-back">
            ← Kembali ke beranda
          </Link>

          {!isRegister ? (
            /* LOGIN FORM */
            <div className="auth-form-wrap">
              <div className="auth-mini-mark">∞</div>
              <div className="auth-heading">
                <span className="eyebrow">Student & Admin Access</span>
                <h2>Masuk ke akunmu</h2>
                <p>Akses inventaris barang, pantau pesanan, atau kelola platform.</p>
              </div>

              {errorMsg && <div className="auth-error">{errorMsg}</div>}

              <form className="auth-form" onSubmit={handleLoginSubmit}>
                <div className="field">
                  <label htmlFor="loginEmail">Email mahasiswa atau kampus</label>
                  <input
                    id="loginEmail"
                    type="email"
                    required
                    placeholder="nama@kampusloop.id"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div className="field">
                  <div className="label-row">
                    <label htmlFor="loginPassword">Kata sandi</label>
                  </div>
                  <div className="password-wrap">
                    <input
                      id="loginPassword"
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="Masukkan kata sandi..."
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label="Toggle password"
                    >
                      {showLoginPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary auth-submit"
                  disabled={submitting}
                >
                  <span>{submitting ? 'Memeriksa...' : 'Masuk sekarang'}</span>
                  <span>↗</span>
                </button>
              </form>

              {/* Demo Accounts Quick-Fill */}
              <div className="auth-divider">PILIH LOGIN DEMO SESUAI ROLE DASHBOARD</div>
              <div className="demo-accounts" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <button
                  type="button"
                  className="demo-account"
                  onClick={() => handleDemoFill('admin')}
                  title="Dashboard Super Admin Web & Django"
                >
                  <span className="demo-avatar admin-avatar" style={{ background: '#0284c7' }}>SA</span>
                  <span>
                    <strong>Super Admin</strong>
                    <small>Console Web & Django</small>
                  </span>
                  <b>↗</b>
                </button>

                <button
                  type="button"
                  className="demo-account"
                  onClick={() => handleDemoFill('penjual')}
                  title="Dashboard User Admin / Penjual"
                >
                  <span className="demo-avatar" style={{ background: '#ecfdf5', color: '#059669' }}>P</span>
                  <span>
                    <strong>Penjual (User Admin)</strong>
                    <small>Rizky Pratama (Terverifikasi)</small>
                  </span>
                  <b>↗</b>
                </button>

                <button
                  type="button"
                  className="demo-account"
                  onClick={() => handleDemoFill('user')}
                  title="Dashboard User Mahasiswa Reguler"
                >
                  <span className="demo-avatar">M</span>
                  <span>
                    <strong>Mahasiswa (User)</strong>
                    <small>Budi Santoso (Pembeli)</small>
                  </span>
                  <b>↗</b>
                </button>
              </div>

              <p className="auth-switch">
                Belum punya akun?{' '}
                <button type="button" onClick={() => setIsRegister(true)}>
                  Daftar sekarang
                </button>
              </p>
            </div>
          ) : (
            /* REGISTER FORM */
            <div className="auth-form-wrap register-form-wrap">
              <div className="auth-mini-mark">✳</div>
              <div className="auth-heading">
                <span className="eyebrow">Daftar Akun Baru</span>
                <h2>Buat akun KampusLoop</h2>
                <p>
                  Pendaftaran terbuka untuk semua email (pribadi atau kampus). Semua pendaftar otomatis menjadi Mahasiswa/Pembeli reguler dan dapat mengajukan verifikasi penjual di Dashboard.
                </p>
              </div>

              {errorMsg && <div className="auth-error">{errorMsg}</div>}

              <form className="auth-form register-form" onSubmit={handleRegisterSubmit}>
                <div className="field">
                  <label htmlFor="registerName">Nama lengkap</label>
                  <input
                    id="registerName"
                    type="text"
                    required
                    placeholder="Contoh: Alya Rahman"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="field">
                    <label htmlFor="registerEmail">Email (Bebas: Gmail, Yahoo, Kampus, dll.)</label>
                    <input
                      id="registerEmail"
                      type="email"
                      required
                      placeholder="nama@gmail.com / nama@kampus.id"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="registerCampus">Kampus / Universitas</label>
                    <select
                      id="registerCampus"
                      value={registerCampus}
                      onChange={(e) => setRegisterCampus(e.target.value)}
                    >
                      <option>Universitas Negeri Makassar</option>
                      <option>Universitas Hasanuddin</option>
                      <option>Universitas Indonesia</option>
                      <option>Institut Teknologi Bandung</option>
                      <option>Universitas Gadjah Mada</option>
                      <option>Universitas Airlangga</option>
                      <option>Universitas Brawijaya</option>
                      <option>Lainnya</option>
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="registerPassword">Kata sandi (min. 6 karakter)</label>
                  <div className="password-wrap">
                    <input
                      id="registerPassword"
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Buat kata sandi aman..."
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      aria-label="Toggle password"
                    >
                      {showRegisterPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary auth-submit"
                  disabled={submitting}
                >
                  <span>{submitting ? 'Mendaftarkan...' : 'Buat akun sekarang'}</span>
                  <span>↗</span>
                </button>
              </form>

              <p className="auth-switch">
                Sudah punya akun?{' '}
                <button type="button" onClick={() => setIsRegister(false)}>
                  Masuk di sini
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
