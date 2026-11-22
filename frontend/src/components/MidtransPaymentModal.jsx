import React, { useState, useEffect } from 'react'
import {
  QrCode,
  Landmark,
  CheckCircle2,
  Copy,
  Clock,
  Sparkles,
  Download,
  X,
  Minus,
  Maximize2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  RefreshCw,
} from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import api from '../api'

export default function MidtransPaymentModal({
  order,
  onClose,
  onSuccess,
  onPaymentSuccess,
  showToast,
  onCancelOrder,
}) {
  const cart = useCart()
  const notify = showToast || cart?.showToast || ((m) => alert(m))

  // Start minimized if Snap token is available, so Snap pop-up is clean and not blocked by the backdrop modal
  const [isMinimized, setIsMinimized] = useState(() => {
    const token = order?.midtrans_snap_token
    return Boolean(token && !token.startsWith('midtrans-snap-') && order?.payment_status !== 'paid')
  })
  const [simulating, setSimulating] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [paidSuccess, setPaidSuccess] = useState(order?.payment_status === 'paid')
  const [copied, setCopied] = useState(false)

  // Countdown timer state (seconds remaining)
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const expTime = order?.midtrans_expiry_time || order?.tripay_expired_time
    if (expTime) {
      const exp = new Date(expTime).getTime()
      const now = Date.now()
      return Math.max(0, Math.floor((exp - now) / 1000))
    }
    return 24 * 3600 // 24 hours fallback
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-launch Midtrans Snap popup if valid snapToken exists
  useEffect(() => {
    const token = order?.midtrans_snap_token
    if (
      window.snap &&
      token &&
      token.length > 10 &&
      !token.startsWith('midtrans-snap-') &&
      !paidSuccess
    ) {
      const autoTimer = setTimeout(() => {
        handleOpenSnap()
      }, 350)
      return () => clearTimeout(autoTimer)
    }
  }, [order?.midtrans_snap_token])

  const formatTimer = (secs) => {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0')
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
    const s = String(secs % 60).padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  if (!order) return null

  const paymentMethodStr = String(
    order.midtrans_payment_type ||
      order.tripay_payment_method ||
      order.payment_method ||
      ''
  ).toUpperCase()

  const isQris = paymentMethodStr.includes('QRIS') || paymentMethodStr.includes('GOPAY') || !paymentMethodStr.includes('VA')
  const payCode =
    order.midtrans_va_number ||
    order.tripay_pay_code ||
    order.order_number

  const redirectUrl =
    order.midtrans_redirect_url ||
    order.tripay_checkout_url ||
    ''

  const snapToken = order.midtrans_snap_token || ''
  const formatPrice = (p) => 'Rp' + Number(p || 0).toLocaleString('id-ID')

  const qrImageSrc =
    order.midtrans_qr_url ||
    order.tripay_qr_url ||
    `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
      payCode || order.order_number
    )}`

  const handleCopyCode = (e) => {
    if (e) e.stopPropagation()
    if (payCode) {
      navigator.clipboard?.writeText(payCode)
      setCopied(true)
      notify('Nomor Virtual Account / Kode bayar Midtrans berhasil disalin!')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleDownloadQr = (e) => {
    if (e) e.stopPropagation()
    try {
      const a = document.createElement('a')
      a.href = qrImageSrc
      a.download = `QRIS_Midtrans_${order.order_number}.png`
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      notify('Gambar QRIS Midtrans sedang diunduh!')
    } catch {
      window.open(qrImageSrc, '_blank')
    }
  }

  const handleOpenSnap = (e) => {
    if (e) e.stopPropagation()
    if (window.snap && snapToken && snapToken.length > 10 && !snapToken.startsWith('midtrans-snap-')) {
      window.snap.pay(snapToken, {
        onSuccess: async (result) => {
          notify('Pembayaran Snap Midtrans berhasil!')
          try {
            const vRes = await api.post(`/pesanan/${order.id}/verify-midtrans-client`, { result })
            setPaidSuccess(true)
            setIsMinimized(false)
            window.dispatchEvent(new CustomEvent('kampusloop:dataUpdated'))
            if (onPaymentSuccess) onPaymentSuccess(vRes.data?.order || order)
            else if (onSuccess) onSuccess(vRes.data?.order || order)
          } catch {
            handleSimulatePayment()
          }
        },
        onPending: () => {
          notify('Transaksi Snap dibuat. Silakan selesaikan pembayaran.')
        },
        onError: () => {
          notify('Pembayaran Snap ditolak atau gagal.')
        },
        onClose: () => {
          notify('Popup Midtrans ditutup.')
        },
      })
    } else if (redirectUrl) {
      window.open(redirectUrl, '_blank')
    } else {
      handleSimulatePayment()
    }
  }

  const handleCheckStatus = async (e) => {
    if (e) e.stopPropagation()
    setCheckingStatus(true)
    try {
      const res = await api.get(`/pesanan/${order.id}/check-midtrans-status`)
      if (res.data?.verified || res.data?.payment_status === 'paid') {
        setPaidSuccess(true)
        setIsMinimized(false)
        notify(res.data.message || 'Pembayaran Midtrans berhasil diverifikasi!')
        window.dispatchEvent(new CustomEvent('kampusloop:dataUpdated'))
        if (onPaymentSuccess) onPaymentSuccess(res.data.order)
        else if (onSuccess) onSuccess(res.data.order)
      } else {
        notify(res.data?.message || 'Status pembayaran di Midtrans belum selesai.')
      }
    } catch (err) {
      notify(err.response?.data?.error || 'Gagal memeriksa status pembayaran ke Midtrans.')
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleSimulatePayment = async () => {
    setSimulating(true)
    try {
      const res = await api.post(`/pesanan/${order.id}/confirm-payment`)
      if (res.data?.success) {
        setPaidSuccess(true)
        setIsMinimized(false)
        notify(res.data.message || 'Pembayaran berhasil diverifikasi!')
        window.dispatchEvent(new CustomEvent('kampusloop:dataUpdated'))
        if (onPaymentSuccess) onPaymentSuccess(res.data.order)
        else if (onSuccess) onSuccess(res.data.order)
      } else {
        notify(res.data?.error || 'Gagal memverifikasi pembayaran.')
      }
    } catch (err) {
      notify(err.response?.data?.error || 'Gagal menghubungi server.')
    } finally {
      setSimulating(false)
    }
  }

  const handleCancelOrder = async (e) => {
    if (e) e.stopPropagation()
    if (onCancelOrder) {
      await onCancelOrder(order.id)
      return
    }

    if (
      !window.confirm(
        `Yakin ingin membatalkan pesanan #${order.order_number}? Produk akan dikembalikan ke etalase.`
      )
    ) {
      return
    }

    setCancelling(true)
    try {
      const res = await api.post(`/pesanan/${order.id}/cancel`)
      if (res.data?.success) {
        notify(res.data.message || 'Pesanan berhasil dibatalkan.')
        window.dispatchEvent(new CustomEvent('kampusloop:dataUpdated'))
        onClose()
      } else {
        notify(res.data?.error || 'Gagal membatalkan pesanan.')
      }
    } catch (err) {
      notify(err.response?.data?.error || 'Gagal membatalkan pesanan.')
    } finally {
      setCancelling(false)
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
     1. MINIMIZED STATE: FLOATING NOTIFICATION BAR ABOVE / ALONGSIDE NAVIGATION
     ───────────────────────────────────────────────────────────────────────── */
  if (isMinimized) {
    return (
      <div
        className="floating-payment-bar"
        style={{
          position: 'fixed',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(1120px, calc(100% - 28px))',
          zIndex: 9999,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid #0284c7',
          borderRadius: '16px',
          boxShadow: '0 12px 36px rgba(2, 132, 199, 0.22), 0 2px 8px rgba(0,0,0,0.06)',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={() => setIsMinimized(false)}
        title="Klik untuk membuka kembali popup rincian pembayaran Midtrans"
      >
        {/* Left Side: Order & Amount info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#0284c7',
              boxShadow: '0 0 0 4px rgba(2, 132, 199, 0.2)',
              animation: 'pulse 1.8s infinite',
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#0369a1',
                  background: '#e0f2fe',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  letterSpacing: '0.4px',
                }}
              >
                Midtrans Payment
              </span>
              <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>#{order.order_number}</strong>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#16a34a', marginTop: '1px' }}>
              {formatPrice(order.harga_bayar || order.total_bayar)}
            </div>
          </div>
        </div>

        {/* Center: Live Animated Time Clock */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '5px 12px',
            borderRadius: '99px',
            color: '#b45309',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.5px',
          }}
        >
          <Clock size={14} style={{ animation: 'pulse 1.2s infinite' }} />
          <span>Sisa Waktu: {formatTimer(secondsLeft)}</span>
        </div>

        {/* Right: Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{
              fontSize: '10px',
              padding: '6px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: '#16a34a',
              borderColor: '#16a34a',
            }}
            onClick={(e) => {
              e.stopPropagation()
              handleSimulatePayment()
            }}
            disabled={simulating}
            title="Konfirmasi bahwa Anda sudah menyelesaikan pembayaran"
          >
            <CheckCircle2 size={13} />
            <span>{simulating ? 'Memverifikasi...' : 'Saya Sudah Bayar'}</span>
          </button>

          <button
            type="button"
            className="btn"
            style={{
              fontSize: '10px',
              padding: '6px 11px',
              background: '#f0fdf4',
              color: '#15803d',
              borderColor: '#86efac',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 700,
            }}
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard?.writeText('4811111111111114')
              notify('Nomor kartu uji coba disalin: 4811 1111 1111 1114')
            }}
            title="Salin nomor kartu kredit uji coba Midtrans Sandbox"
          >
            <CreditCard size={12} color="#16a34a" />
            <span>Salin No. Kartu</span>
          </button>

          {redirectUrl && (
            <button
              type="button"
              className="btn btn-primary"
              style={{
                fontSize: '10px',
                padding: '6px 11px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#0284c7',
                borderColor: '#0284c7',
              }}
              onClick={handleOpenSnap}
            >
              <ExternalLink size={12} />
              <span>Bayar Snap</span>
            </button>
          )}

          {isQris ? (
            <button
              type="button"
              className="btn btn-outline"
              style={{
                fontSize: '10px',
                padding: '6px 11px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderColor: '#0284c7',
                color: '#0284c7',
              }}
              onClick={handleDownloadQr}
            >
              <Download size={13} />
              <span>Download QR</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-outline"
              style={{
                fontSize: '10px',
                padding: '6px 11px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderColor: '#0284c7',
                color: '#0284c7',
              }}
              onClick={handleCopyCode}
            >
              <Copy size={13} />
              <span>{copied ? 'Tersalin!' : 'Salin VA'}</span>
            </button>
          )}

          <button
            type="button"
            className="btn"
            style={{
              fontSize: '10px',
              padding: '6px 11px',
              background: '#fff1f2',
              color: '#e11d48',
              borderColor: '#fecdd3',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onClick={handleCancelOrder}
            disabled={cancelling}
          >
            <XCircle size={13} />
            <span>{cancelling ? 'Membatalkan...' : 'Batalkan'}</span>
          </button>

          <button
            type="button"
            className="btn btn-outline"
            style={{
              fontSize: '10px',
              padding: '6px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onClick={(e) => {
              e.stopPropagation()
              setIsMinimized(false)
            }}
          >
            <Maximize2 size={12} />
            <span>Buka Detail ↗</span>
          </button>
        </div>
      </div>
    )
  }

  /* ─────────────────────────────────────────────────────────────────────────
     2. MAXIMIZED STATE: PROMINENT CENTERED POPUP MODAL DIALOG
     ───────────────────────────────────────────────────────────────────────── */
  return (
    <div
      className="midtrans-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        className="midtrans-modal-card"
        style={{
          maxWidth: '520px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 30px 70px rgba(0,0,0,0.35)',
          background: '#ffffff',
          position: 'relative',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Top Control Bar: Minimize & Close */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            style={{
              background: '#f1f5f9',
              border: 0,
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
              transition: 'background 0.2s',
            }}
            title="Minimize ke notifikasi mengambang"
            aria-label="Minimize"
          >
            <Minus size={17} strokeWidth={2.4} />
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 0,
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
              transition: 'background 0.2s',
            }}
            title="Tutup Popup"
            aria-label="Tutup"
          >
            <X size={17} strokeWidth={2.4} />
          </button>
        </div>

        {paidSuccess ? (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: '#e8f5e9',
                color: '#16a34a',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <CheckCircle2 size={42} strokeWidth={2.5} />
            </div>
            <span className="eyebrow" style={{ color: '#16a34a', fontWeight: 800 }}>
              PEMBAYARAN MIDTRANS BERHASIL
            </span>
            <h2 style={{ fontSize: '22px', margin: '8px 0 10px', color: '#0f172a' }}>
              Pembayaran Berhasil Diverifikasi!
            </h2>
            <p
              style={{
                color: 'var(--muted)',
                fontSize: '13px',
                margin: '0 0 20px',
                lineHeight: 1.5,
              }}
            >
              Pesanan <b>#{order.order_number}</b> telah terbayar lunas. Penjual telah menerima notifikasi dan akan segera mengemas barangmu.
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--line)',
                borderRadius: '14px',
                padding: '14px',
                marginBottom: '22px',
                textAlign: 'left',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--muted)' }}>Total Dibayar</span>
                <b>{formatPrice(order.harga_bayar || order.total_bayar)}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--muted)' }}>Status Pembayaran</span>
                <span className="status-pill status-green">● LUNAS (Midtrans)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Status Pengiriman</span>
                <span className="status-pill status-orange">Sedang Diproses</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', background: '#0284c7', borderColor: '#0284c7' }}
              onClick={onClose}
            >
              Selesai & Ke Dashboard ↗
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                className="eyebrow"
                style={{
                  color: '#0369a1',
                  background: '#e0f2fe',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: 800,
                }}
              >
                Midtrans Payment
              </span>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700 }}>
                #{order.order_number}
              </span>
            </div>

            <h2 style={{ fontSize: '21px', margin: '4px 0 12px', paddingRight: '80px', color: '#0f172a' }}>
              {isQris ? 'Pembayaran QRIS Instan (Midtrans)' : 'Pembayaran Transfer Virtual Account'}
            </h2>

            {/* Countdown Timer Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '16px',
                color: '#92400e',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} style={{ animation: 'pulse 1.2s infinite', color: '#b45309' }} />
                <span>Batas Waktu Bayar:</span>
              </div>
              <span
                style={{
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  color: '#b45309',
                }}
              >
                {formatTimer(secondsLeft)}
              </span>
            </div>

            {/* Price Highlight */}
            <div
              style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
                border: '1px solid #93c5fd',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div>
                <small style={{ color: '#0369a1', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Pembayaran
                </small>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>
                  {formatPrice(order.harga_bayar || order.total_bayar)}
                </div>
              </div>
              <span className="status-pill status-orange">Menunggu Pembayaran</span>
            </div>

            {/* Payment Verification Action Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                border: '1.5px solid #38bdf8',
                borderRadius: '14px',
                padding: '14px',
                marginBottom: '16px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.08)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: '#0284c7',
                  fontWeight: 800,
                  fontSize: '13px',
                  marginBottom: '4px',
                }}
              >
                <ShieldCheck size={16} color="#16a34a" />
                <span>Konfirmasi Pembayaran Midtrans</span>
              </div>
              <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 12px', lineHeight: 1.4 }}>
                Setelah menyelesaikan transfer atau scan kode QR, klik tombol di bawah untuk verifikasi pembayaran Anda secara langsung.
              </p>

              {/* Snap Pop-up Button */}
              {redirectUrl && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    marginBottom: '10px',
                    fontSize: '13px',
                    padding: '10px 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#0284c7',
                    borderColor: '#0284c7',
                    fontWeight: 800,
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                  }}
                  onClick={handleOpenSnap}
                >
                  <CreditCard size={16} />
                  <span>Buka Layanan Pembayaran Snap Pop-up ↗</span>
                </button>
              )}

              {/* Quick Card Sandbox Helper */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  marginBottom: '10px',
                  fontSize: '11px',
                  color: '#334155',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0369a1' }}>
                    <CreditCard size={12} color="#0284c7" /> Kartu Uji Coba Midtrans:
                  </strong>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      fontSize: '9px',
                      padding: '2px 7px',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      borderColor: '#bae6fd',
                      fontWeight: 700,
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      navigator.clipboard?.writeText('4811111111111114')
                      notify('Nomor kartu uji coba disalin: 4811 1111 1111 1114')
                    }}
                  >
                    Salin No. Kartu
                  </button>
                </div>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                  Di Snap pop-up pilih Kartu Kredit: <b>4811 1111 1111 1114</b> · Exp: <b>01/28</b> · CVV: <b>123</b> · OTP: <b>112233</b>
                </span>
                <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span style={{ color: '#475569' }}>Atau simulasi pembayaran via Simulator:</span>
                  <a
                    href={isQris ? 'https://simulator.sandbox.midtrans.com/v2/qris/index' : 'https://simulator.sandbox.midtrans.com/bca/va/index'}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'underline' }}
                  >
                    Buka Simulator Midtrans ↗
                  </a>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{
                    background: '#f0fdf4',
                    borderColor: '#86efac',
                    color: '#15803d',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    padding: '8px 12px',
                    fontWeight: 700,
                  }}
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                  title="Konfirmasi bahwa Anda telah menyelesaikan pembayaran"
                >
                  <CheckCircle2 size={13} color="#16a34a" />
                  <span>{simulating ? 'Memverifikasi...' : 'Saya Sudah Bayar'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    padding: '8px 12px',
                    borderColor: '#0284c7',
                    color: '#0284c7',
                    fontWeight: 700,
                  }}
                  onClick={handleCheckStatus}
                  disabled={checkingStatus}
                  title="Periksa pembaruan status pembayaran"
                >
                  <RefreshCw size={12} className={checkingStatus ? 'spin' : ''} />
                  <span>{checkingStatus ? 'Memeriksa...' : 'Cek Status'}</span>
                </button>
              </div>
            </div>

            {/* QRIS / VA Core Box */}
            {isQris ? (
              <div style={{ textAlign: 'center', padding: '4px 0 12px' }}>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '12px',
                    background: 'white',
                    borderRadius: '16px',
                    border: '2px dashed #38bdf8',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
                  }}
                >
                  <img
                    src={qrImageSrc}
                    alt="QRIS Midtrans"
                    style={{
                      width: '200px',
                      height: '200px',
                      display: 'block',
                      borderRadius: '8px',
                    }}
                  />
                </div>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{
                      fontSize: '11px',
                      padding: '6px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      borderColor: '#0284c7',
                      color: '#0284c7',
                      fontWeight: 600,
                    }}
                    onClick={handleDownloadQr}
                  >
                    <Download size={13} />
                    <span>Download QR</span>
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px' }}>
                  Scan melalui aplikasi GoPay, OVO, Dana, ShopeePay, BCA Mobile, Livin, atau m-Banking Anda, lalu tekan tombol <b>Saya Sudah Bayar</b> di atas.
                </p>
              </div>
            ) : (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '14px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Landmark size={18} color="#0284c7" />
                  <strong style={{ fontSize: '13px' }}>
                    {order.midtrans_payment_type || order.tripay_payment_method || 'Virtual Account Bank (Midtrans)'}
                  </strong>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Nomor Virtual Account:</span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginTop: '6px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '19px',
                      fontWeight: 900,
                      letterSpacing: '1px',
                      fontFamily: 'monospace',
                      color: '#0f172a',
                    }}
                  >
                    {payCode}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{
                      fontSize: '11px',
                      padding: '6px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    onClick={handleCopyCode}
                  >
                    <Copy size={13} />
                    <span>{copied ? 'Tersalin!' : 'Salin Norek'}</span>
                  </button>
                </div>
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
                  <span>Petunjuk: Salin nomor Virtual Account di atas, lakukan pembayaran via ATM atau m-Banking, kemudian tekan <b>Saya Sudah Bayar</b> di atas.</span>
                </div>
              </div>
            )}

            {/* Rincian Biaya Transparan */}
            <div
              style={{
                background: '#fafafa',
                borderRadius: '12px',
                padding: '12px 14px',
                border: '1px solid var(--line)',
                fontSize: '11px',
                display: 'grid',
                gap: '6px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Subtotal Produk</span>
                <span>{formatPrice(order.subtotal_produk)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Biaya Layanan Platform (2%)</span>
                <span>{formatPrice(order.service_fee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>
                  Ongkos Kirim {order.distance_km ? `(${order.distance_km} km)` : ''}
                </span>
                <span>{formatPrice(order.shipping_cost)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--line)',
                  paddingTop: '6px',
                  fontWeight: 800,
                }}
              >
                <span>Total Bayar</span>
                <span>{formatPrice(order.harga_bayar || order.total_bayar)}</span>
              </div>
            </div>

            {/* Bottom Actions: Cancel Order & Minimize */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className="btn"
                style={{
                  background: '#fff1f2',
                  borderColor: '#fecdd3',
                  color: '#e11d48',
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
                onClick={handleCancelOrder}
                disabled={cancelling}
              >
                <XCircle size={14} />
                <span>{cancelling ? 'Membatalkan...' : 'Batalkan Pesanan'}</span>
              </button>

              <button
                type="button"
                className="btn btn-outline"
                style={{
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
                onClick={() => setIsMinimized(true)}
              >
                <Minus size={14} />
                <span>Perkecil Notifikasi</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


