const HTML_TAG_REGEX = /<\/?(p|h1|h2|h3|h4|h5|h6|ul|ol|li|strong|b|em|i|u|blockquote|table|thead|tbody|tr|th|td|a|img|br|hr|pre|code|div|span)\b[^>]*>/i

export function isHtmlContent(str) {
  return HTML_TAG_REGEX.test(String(str || ''))
}

export function sanitizeHtml(dirty) {
  if (!dirty) return ''
  const raw = String(dirty)

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return raw
  }

  const doc = new DOMParser().parseFromString(raw, 'text/html')

  // Remove dangerous elements
  const blocked = doc.querySelectorAll('script, iframe, object, embed, form, input, button, style, link, meta')
  blocked.forEach((el) => el.remove())

  // Strip inline event handlers and javascript: URIs
  const all = doc.body.querySelectorAll('*')
  all.forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase()
      const val = attr.value.trim().toLowerCase()
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name)
      }
      if ((name === 'href' || name === 'src') && val.startsWith('javascript:')) {
        el.removeAttribute(attr.name)
      }
    })
  })

  return doc.body.innerHTML
}

