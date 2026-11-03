import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import ProductModal from '../components/ProductModal'
import { useScrollReveal } from '../hooks/useScrollReveal'
import api from '../api'
import { IconFilter } from '../components/Icons'

const CATEGORIES = [
  'Semua',
  'Buku & Akademik',
  'Elektronik',
  'Fashion',
  'Kos & Living',
  'Hobi & Organisasi',
  'Lainnya',
]

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCat = searchParams.get('category') || 'Semua'

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(initialCat)
  const [selectedConditions, setSelectedConditions] = useState([])
  const [priceFilter, setPriceFilter] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useScrollReveal()

  // Sync category param if URL changes
  useEffect(() => {
    const cat = searchParams.get('category')
    if (cat && CATEGORIES.includes(cat)) {
      setSelectedCategory(cat)
    }
  }, [searchParams])

  // Fetch products from API
  useEffect(() => {
    setLoading(true)
    api.get('/produk/')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.results || [])
        setProducts(data)
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : []
    let result = [...list]

    // Category
    if (selectedCategory !== 'Semua') {
      result = result.filter(
        (p) => (p.kategori || p.category) === selectedCategory
      )
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((p) => {
        const text = `${p.nama || p.name} ${p.kategori || p.category} ${p.deskripsi || p.desc} ${p.seller_nama || p.seller || ''} ${p.lokasi || p.location || ''}`.toLowerCase()
        return text.includes(q)
      })
    }

    // Condition
    if (selectedConditions.length > 0) {
      result = result.filter((p) =>
        selectedConditions.includes(p.kondisi || p.condition)
      )
    }

    // Price
    if (priceFilter === 'under100') {
      result = result.filter((p) => Number(p.harga || p.price) < 100000)
    } else if (priceFilter === '100to500') {
      result = result.filter(
        (p) => Number(p.harga || p.price) >= 100000 && Number(p.harga || p.price) <= 500000
      )
    } else if (priceFilter === 'over500') {
      result = result.filter((p) => Number(p.harga || p.price) > 500000)
    }

    // Sort
    if (sortBy === 'low') {
      result.sort((a, b) => Number(a.harga || a.price) - Number(b.harga || b.price))
    } else if (sortBy === 'high') {
      result.sort((a, b) => Number(b.harga || b.price) - Number(a.harga || a.price))
    } else if (sortBy === 'new') {
      result.reverse()
    }

    return result
  }, [products, selectedCategory, searchQuery, selectedConditions, priceFilter, sortBy])

  const handleConditionToggle = (cond) => {
    if (selectedConditions.includes(cond)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== cond))
    } else {
      setSelectedConditions([...selectedConditions, cond])
    }
  }

  const handleResetFilters = () => {
    setSelectedCategory('Semua')
    setSearchQuery('')
    setSelectedConditions([])
    setPriceFilter('all')
    setSortBy('featured')
    setSearchParams({})
  }

  return (
    <main>
      {/* ─── PAGE HERO ───────────────────────────────────────────── */}
      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">Etalase Kampus</span>
          <h1>Jelajahi barang berkualitas dengan harga mahasiswa</h1>
          <p>
            Semua barang preloved siap pakai dari mahasiswa terverifikasi. Transaksi aman tanpa potongan komisi, COD langsung di kampus.
          </p>
        </div>
      </section>

      {/* ─── SHOP CONTENT ────────────────────────────────────────── */}
      <section className="wrap">
        {/* Toolbar */}
        <div className="shop-toolbar">
          <div className="searchbox">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari buku, kalkulator, headphone, jaket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-outline mobile-filter"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Filter</span>
              <IconFilter size={14} />
            </button>

            <select
              className="selectbox"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Urutkan produk"
            >
              <option value="featured">Rekomendasi</option>
              <option value="low">Harga: Rendah ke Tinggi</option>
              <option value="high">Harga: Tinggi ke Rendah</option>
              <option value="new">Paling Baru Diunggah</option>
            </select>
          </div>
        </div>

        {/* Layout: Sidebar + Grid */}
        <div className="shop-layout">
          {/* Filters Sidebar */}
          <aside className={`filters ${mobileFilterOpen ? 'mobile-open' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div className="filter-title">Filter Produk</div>
              <button className="filter-reset" onClick={handleResetFilters}>
                Reset
              </button>
            </div>

            {/* Category Filter */}
            <div className="filter-group">
              <h4>Kategori</h4>
              {CATEGORIES.map((cat) => {
                const list = Array.isArray(products) ? products : []
                const count =
                  cat === 'Semua'
                    ? list.length
                    : list.filter((p) => (p.kategori || p.category) === cat).length

                return (
                  <label key={cat} className="filter-option">
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="radio"
                        name="category"
                        value={cat}
                        checked={selectedCategory === cat}
                        onChange={() => {
                          setSelectedCategory(cat)
                          if (cat === 'Semua') setSearchParams({})
                          else setSearchParams({ category: cat })
                        }}
                      />
                      <span>{cat}</span>
                    </label>
                    <span>{count}</span>
                  </label>
                )
              })}
            </div>

            {/* Condition Filter */}
            <div className="filter-group">
              <h4>Kondisi Barang</h4>
              {['Like New', 'Good', 'Fair'].map((cond) => (
                <label key={cond} className="filter-option">
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      value={cond}
                      checked={selectedConditions.includes(cond)}
                      onChange={() => handleConditionToggle(cond)}
                    />
                    <span>{cond}</span>
                  </label>
                </label>
              ))}
            </div>

            {/* Price Filter */}
            <div className="filter-group">
              <h4>Rentang Harga</h4>
              <label className="filter-option">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="radio"
                    name="price"
                    value="all"
                    checked={priceFilter === 'all'}
                    onChange={() => setPriceFilter('all')}
                  />
                  <span>Semua Harga</span>
                </label>
              </label>
              <label className="filter-option">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="radio"
                    name="price"
                    value="under100"
                    checked={priceFilter === 'under100'}
                    onChange={() => setPriceFilter('under100')}
                  />
                  <span>Di bawah Rp100.000</span>
                </label>
              </label>
              <label className="filter-option">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="radio"
                    name="price"
                    value="100to500"
                    checked={priceFilter === '100to500'}
                    onChange={() => setPriceFilter('100to500')}
                  />
                  <span>Rp100.000 - Rp500.000</span>
                </label>
              </label>
              <label className="filter-option">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="radio"
                    name="price"
                    value="over500"
                    checked={priceFilter === 'over500'}
                    onChange={() => setPriceFilter('over500')}
                  />
                  <span>Di atas Rp500.000</span>
                </label>
              </label>
            </div>
          </aside>

          {/* Product Grid Area */}
          <div>
            <div className="results-line">
              <span>
                Menampilkan <strong>{filteredProducts.length}</strong> produk
              </span>
              {(selectedCategory !== 'Semua' || searchQuery || selectedConditions.length > 0 || priceFilter !== 'all') && (
                <button
                  className="filter-reset"
                  onClick={handleResetFilters}
                  style={{ cursor: 'pointer' }}
                >
                  Hapus semua filter
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
                Memuat barang preloved...
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="shop-grid">
                {filteredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onSelect={(prod) => setSelectedProduct(prod)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⌕</div>
                <strong style={{ fontSize: '15px' }}>Belum ada produk yang cocok.</strong>
                <p style={{ margin: '8px 0 16px', fontSize: '12px' }}>
                  Coba kata kunci pencarian atau ubah filter kategori/kondisi.
                </p>
                <button className="btn btn-outline" onClick={handleResetFilters}>
                  Reset semua filter
                </button>
              </div>
            )}
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
