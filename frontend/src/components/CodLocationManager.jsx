import React, { useState } from 'react'
import { MapPin, Plus, X } from 'lucide-react'

const DEFAULT_PRESETS = [
  'Perpustakaan Pusat',
  'Kantin Fakultas',
  'Gerbang Utama Kampus',
  'Lobi Gedung Rektorat',
  'Masjid Kampus',
]

export default function CodLocationManager({
  value = '',
  onChange,
  label = 'Opsi Titik Lokasi COD',
  helperText = 'Tambahkan satu atau lebih lokasi pertemuan COD yang tersedia untuk pembeli.',
  presets = DEFAULT_PRESETS,
}) {
  const [draft, setDraft] = useState('')

  const items = String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const commitList = (nextItems) => {
    const unique = []
    const seen = new Set()
    nextItems.forEach((loc) => {
      const clean = String(loc || '').trim()
      if (clean && !seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase())
        unique.push(clean)
      }
    })
    onChange(unique.join(', '))
  }

  const handleAdd = () => {
    const clean = draft.trim()
    if (!clean) return
    const parts = clean.split(',').map((s) => s.trim()).filter(Boolean)
    commitList([...items, ...parts])
    setDraft('')
  }

  const handleRemove = (index) => {
    commitList(items.filter((_, i) => i !== index))
  }

  const handleTogglePreset = (preset) => {
    const exists = items.some((i) => i.toLowerCase() === preset.toLowerCase())
    if (exists) {
      commitList(items.filter((i) => i.toLowerCase() !== preset.toLowerCase()))
    } else {
      commitList([...items, preset])
    }
  }

  return (
    <div className="field">
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <MapPin size={13} strokeWidth={2.2} />
        <span>{label}</span>
      </label>

      {items.length > 0 && (
        <div className="cod-chip-list" style={{ marginBottom: '8px' }}>
          {items.map((loc, idx) => (
            <span
              key={`${loc}-${idx}`}
              className="cod-chip"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                paddingRight: '8px',
              }}
            >
              <MapPin size={11} strokeWidth={2.2} />
              <span>{loc}</span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                aria-label={`Hapus ${loc}`}
                style={{
                  border: 0,
                  background: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <X size={12} strokeWidth={2.4} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Ketik lokasi COD baru (mis. Taman Fakultas Teknik)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <button
          type="button"
          className="btn btn-outline"
          style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '10px 14px' }}
          onClick={handleAdd}
        >
          <Plus size={14} strokeWidth={2.2} />
          <span>Tambah</span>
        </button>
      </div>

      {presets && presets.length > 0 && (
        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <small style={{ color: 'var(--muted)', fontSize: '10px', fontWeight: 600 }}>Preset cepat:</small>
          {presets.map((preset) => {
            const active = items.some((i) => i.toLowerCase() === preset.toLowerCase())
            return (
              <button
                key={preset}
                type="button"
                className={`cod-chip-btn ${active ? 'active' : ''}`}
                style={{ fontSize: '10px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                onClick={() => handleTogglePreset(preset)}
              >
                <MapPin size={10} />
                <span>{preset}</span>
              </button>
            )
          })}
        </div>
      )}

      {helperText && (
        <small style={{ color: 'var(--muted)', display: 'block', marginTop: '6px', fontSize: '10.5px' }}>
          {helperText}
        </small>
      )}
    </div>
  )
}

