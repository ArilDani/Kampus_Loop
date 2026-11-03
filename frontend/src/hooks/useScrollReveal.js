import { useEffect, useRef } from 'react'

/**
 * Hook untuk mengaktifkan Intersection Observer pada elemen dengan class reveal/slide-in
 * Menambahkan class 'visible' ketika elemen masuk viewport
 */
export function useScrollReveal(selector = '.reveal, .slide-in-left, .slide-in-right, .scale-in') {
  const containerRef = useRef(null)

  useEffect(() => {
    const elements = document.querySelectorAll(selector)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            // Don't unobserve so it stays visible
          }
        })
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    elements.forEach((el) => observer.observe(el))

    return () => {
      elements.forEach((el) => observer.unobserve(el))
    }
  }, [selector])

  return containerRef
}

/**
 * Hook untuk mendeteksi scroll pada header (add shadow saat scroll)
 */
export function useHeaderScroll() {
  useEffect(() => {
    const header = document.querySelector('.header')
    if (!header) return

    const handler = () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled')
      } else {
        header.classList.remove('scrolled')
      }
    }

    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])
}
