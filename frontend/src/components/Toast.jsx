import React from 'react'
import { useCart } from '../contexts/CartContext'

export default function Toast() {
  const { toastMsg, toastVisible } = useCart()

  return (
    <div className={`toast ${toastVisible ? 'show' : ''}`} role="alert" aria-live="polite">
      {toastMsg}
    </div>
  )
}
