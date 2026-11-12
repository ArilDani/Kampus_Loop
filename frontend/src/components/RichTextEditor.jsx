import React, { useRef, useState, useEffect, useMemo } from 'react'
import {
  Code2,
  Eye,
  Link2,
  Image as ImageIcon,
  Globe,
  Maximize2,
  Minimize2,
  Quote,
  Table2,
  Undo2,
  Redo2,
  List,
  ListOrdered,
  Minus,
} from 'lucide-react'
import api from '../api'

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function highlightHtmlVsc(code) {
  if (!code) return '<span class="vsc-comment">&lt;!-- Tulis atau tempel kode HTML artikel blog di sini... --&gt;</span>'

  const tokenRegex = /(<!--[\s\S]*?-->|<\/?[a-zA-Z0-9-]+(?:\s+[^<>]*)?\/?>|&[a-zA-Z0-9#]+;)/g
  let lastIndex = 0
  let out = ''
  let match

  while ((match = tokenRegex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      out += escapeHtml(code.slice(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith('<!--')) {
      out += `<span class="vsc-comment">${escapeHtml(token)}</span>`
    } else if (token.startsWith('&')) {
      out += `<span class="vsc-entity">${escapeHtml(token)}</span>`
    } else {
      // HTML Tag with attributes
      const tagMatch = token.match(/^(<\/?)([a-zA-Z0-9-]+)([\s\S]*?)(\/?>)$/)
      if (tagMatch) {
        const [, openBr, tagName, attrsRaw, closeBr] = tagMatch
        const highlightedAttrs = attrsRaw.replace(
          /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'>]+)/g,
          (_, attrName, eq, attrVal) =>
            `<span class="vsc-attr">${escapeHtml(attrName)}</span><span class="vsc-eq">${escapeHtml(eq)}</span><span class="vsc-str">${escapeHtml(attrVal)}</span>`
        )
        out += `<span class="vsc-bracket">${escapeHtml(openBr)}</span><span class="vsc-tag">${escapeHtml(tagName)}</span>${highlightedAttrs}<span class="vsc-bracket">${escapeHtml(closeBr)}</span>`
      } else {
        out += escapeHtml(token)
      }
    }

    lastIndex = tokenRegex.lastIndex
  }

  if (lastIndex < code.length) {
    out += escapeHtml(code.slice(lastIndex))
  }

  // Ensure trailing newline renders properly in pre
  if (code.endsWith('\n')) out += '\n'
  return out
}

export default function RichTextEditor({
  label = 'Isi Berita Lengkap',
  required = true,
  value = '',
  onChange,
  placeholder = 'Tulis isi artikel atau berita di sini... Gunakan toolbar di atas atau klik </> untuk mode HTML.',
}) {
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)
  const htmlTextareaRef = useRef(null)
  const htmlPreRef = useRef(null)
  const gutterRef = useRef(null)

  const [htmlMode, setHtmlMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [openMenu, setOpenMenu] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [blockFormat, setBlockFormat] = useState('p')

  useEffect(() => {
    if (!htmlMode && editorRef.current) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || ''
      }
    }
  }, [value, htmlMode])

  const emitChange = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const exec = (command, commandValue = null) => {
    setOpenMenu(null)
    if (htmlMode) return
    editorRef.current?.focus()
    document.execCommand(command, false, commandValue)
    emitChange()
  }

  const handleFormatBlock = (tag) => {
    setBlockFormat(tag)
    exec('formatBlock', `<${tag}>`)
  }

  const handleInsertLink = () => {
    setOpenMenu(null)
    if (htmlMode) return
    const url = window.prompt('Masukkan URL tautan (https://...):', 'https://')
    if (url && url.trim()) {
      exec('createLink', url.trim())
    }
  }

  const handleInsertImageUrl = () => {
    setOpenMenu(null)
    const url = window.prompt('Masukkan URL gambar (https://...):', 'https://')
    if (url && url.trim()) {
      const tag = `<p><img src="${url.trim()}" alt="Gambar artikel" style="max-width:100%;border-radius:10px;" /></p>`
      if (htmlMode) {
        onChange((value || '') + '\n' + tag)
      } else {
        editorRef.current?.focus()
        document.execCommand('insertHTML', false, tag)
        emitChange()
      }
    }
  }

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'articles')
      const res = await api.post('/upload/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const imgTag = `<p><img src="${res.data.url}" alt="Gambar artikel" style="max-width:100%;border-radius:10px;" /></p>`
      if (htmlMode) {
        onChange((value || '') + '\n' + imgTag)
      } else {
        editorRef.current?.focus()
        document.execCommand('insertHTML', false, imgTag)
        emitChange()
      }
    } catch {
      window.alert('Gagal mengunggah gambar.')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  const handleInsertTable = () => {
    setOpenMenu(null)
    const tableHtml = `<table>
  <thead>
    <tr>
      <th>Kolom 1</th>
      <th>Kolom 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data 1</td>
      <td>Data 2</td>
    </tr>
  </tbody>
</table>
<p><br /></p>`
    if (htmlMode) {
      onChange((value || '') + '\n' + tableHtml)
    } else {
      editorRef.current?.focus()
      document.execCommand('insertHTML', false, tableHtml)
      emitChange()
    }
  }

  const handleFormatHtmlSnippet = () => {
    const formatted = String(value || '')
      .replace(/></g, '>\n<')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    if (onChange) onChange(formatted)
  }

  const syncHtmlScroll = () => {
    if (!htmlTextareaRef.current) return
    const { scrollTop, scrollLeft } = htmlTextareaRef.current
    if (htmlPreRef.current) {
      htmlPreRef.current.scrollTop = scrollTop
      htmlPreRef.current.scrollLeft = scrollLeft
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop
    }
  }

  const lineCount = useMemo(() => {
    const count = String(value || '').split('\n').length
    return Math.max(count, 10)
  }, [value])

  const highlightedHtml = useMemo(() => highlightHtmlVsc(value || ''), [value])

  const toggleHtmlMode = () => {
    setOpenMenu(null)
    setHtmlMode((prev) => !prev)
  }

  return (
    <div className={`rte-wrapper ${isFullscreen ? 'rte-fullscreen' : ''}`}>
      {/* Header Label */}
      <div className="rte-label-row">
        <label style={{ margin: 0, fontWeight: 700, fontSize: '12px', color: 'var(--ink)' }}>
          {label}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className={`rte-mode-pill ${htmlMode ? 'active' : ''}`}
            onClick={toggleHtmlMode}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            title="Beralih antara Editor Visual dan Mode HTML"
          >
            {htmlMode ? <Eye size={13} /> : <Code2 size={13} />}
            <span>{htmlMode ? 'Mode Visual' : 'Mode HTML'}</span>
          </button>
          {required && <span className="rte-required-badge">WAJIB</span>}
        </div>
      </div>

      {/* Editor Shell */}
      <div className="rte-box">
        {/* Top Menu Bar (Edit, Insert, Format, Table, Tools) */}
        <div className="rte-menubar">
          <div className="rte-menu-item">
            <button type="button" onClick={() => setOpenMenu(openMenu === 'edit' ? null : 'edit')}>
              Edit
            </button>
            {openMenu === 'edit' && (
              <div className="rte-dropdown">
                <button type="button" onClick={() => exec('undo')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Undo2 size={13} /> Undo
                </button>
                <button type="button" onClick={() => exec('redo')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Redo2 size={13} /> Redo
                </button>
                <button type="button" onClick={() => exec('selectAll')}>Select All</button>
                <button type="button" onClick={() => exec('removeFormat')}>Clear Formatting</button>
              </div>
            )}
          </div>

          <div className="rte-menu-item">
            <button type="button" onClick={() => setOpenMenu(openMenu === 'insert' ? null : 'insert')}>
              Insert
            </button>
            {openMenu === 'insert' && (
              <div className="rte-dropdown">
                <button type="button" onClick={handleInsertLink} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Link2 size={13} /> Insert Link
                </button>
                <button type="button" onClick={() => { setOpenMenu(null); fileInputRef.current?.click() }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={13} /> Upload Gambar
                </button>
                <button type="button" onClick={handleInsertImageUrl} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={13} /> Gambar dari URL
                </button>
                <button type="button" onClick={() => exec('insertHorizontalRule')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Minus size={13} /> Garis Pemisah
                </button>
              </div>
            )}
          </div>

          <div className="rte-menu-item">
            <button type="button" onClick={() => setOpenMenu(openMenu === 'format' ? null : 'format')}>
              Format
            </button>
            {openMenu === 'format' && (
              <div className="rte-dropdown">
                <button type="button" onClick={() => exec('bold')}><b>Bold</b></button>
                <button type="button" onClick={() => exec('italic')}><i>Italic</i></button>
                <button type="button" onClick={() => exec('underline')}><u>Underline</u></button>
                <button type="button" onClick={() => handleFormatBlock('h1')}>Heading 1</button>
                <button type="button" onClick={() => handleFormatBlock('h2')}>Heading 2</button>
                <button type="button" onClick={() => handleFormatBlock('h3')}>Heading 3</button>
                <button type="button" onClick={() => handleFormatBlock('blockquote')}>Blockquote</button>
                <button type="button" onClick={() => handleFormatBlock('p')}>Paragraph</button>
              </div>
            )}
          </div>

          <div className="rte-menu-item">
            <button type="button" onClick={() => setOpenMenu(openMenu === 'table' ? null : 'table')}>
              Table
            </button>
            {openMenu === 'table' && (
              <div className="rte-dropdown">
                <button type="button" onClick={handleInsertTable} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Table2 size={13} /> Sisipkan Tabel (2x2)
                </button>
              </div>
            )}
          </div>

          <div className="rte-menu-item">
            <button type="button" onClick={() => setOpenMenu(openMenu === 'tools' ? null : 'tools')}>
              Tools
            </button>
            {openMenu === 'tools' && (
              <div className="rte-dropdown">
                <button type="button" onClick={toggleHtmlMode} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Code2 size={13} /> {htmlMode ? 'Kembali ke Editor Visual' : 'Edit Source HTML (VS Code)'}
                </button>
                <button type="button" onClick={() => { setOpenMenu(null); setIsFullscreen(!isFullscreen) }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  <span>{isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="rte-toolbar">
          <button type="button" className="rte-btn" onClick={() => exec('undo')} title="Undo" disabled={htmlMode}>
            <Undo2 size={14} />
          </button>
          <button type="button" className="rte-btn" onClick={() => exec('redo')} title="Redo" disabled={htmlMode}>
            <Redo2 size={14} />
          </button>

          <span className="rte-sep" />

          <select
            className="rte-select"
            value={blockFormat}
            disabled={htmlMode}
            onChange={(e) => handleFormatBlock(e.target.value)}
            aria-label="Format paragraf"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="blockquote">Blockquote</option>
            <option value="pre">Code Block</option>
          </select>

          <span className="rte-sep" />

          <button type="button" className="rte-btn" onClick={() => exec('bold')} title="Bold" disabled={htmlMode}>
            <b>B</b>
          </button>
          <button type="button" className="rte-btn" onClick={() => exec('italic')} title="Italic" disabled={htmlMode}>
            <i>I</i>
          </button>
          <button type="button" className="rte-btn" onClick={() => exec('underline')} title="Underline" disabled={htmlMode}>
            <u>U</u>
          </button>

          <span className="rte-sep" />

          <button type="button" className="rte-btn" onClick={() => exec('insertUnorderedList')} title="Bullet list" disabled={htmlMode}>
            <List size={14} />
          </button>
          <button type="button" className="rte-btn" onClick={() => exec('insertOrderedList')} title="Numbered list" disabled={htmlMode}>
            <ListOrdered size={14} />
          </button>
          <button type="button" className="rte-btn" onClick={() => handleFormatBlock('blockquote')} title="Blockquote" disabled={htmlMode}>
            <Quote size={14} />
          </button>

          <span className="rte-sep" />

          <button type="button" className="rte-btn" onClick={handleInsertLink} title="Insert link" disabled={htmlMode}>
            <Link2 size={14} />
          </button>
          <button
            type="button"
            className="rte-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload & sisipkan gambar"
          >
            <ImageIcon size={14} />
          </button>
          <button type="button" className="rte-btn" onClick={handleInsertTable} title="Sisipkan tabel">
            <Table2 size={14} />
          </button>

          <span className="rte-sep" />

          <button type="button" className="rte-btn" onClick={() => exec('removeFormat')} title="Clear formatting" disabled={htmlMode}>
            Tx
          </button>
          <button
            type="button"
            className={`rte-btn ${htmlMode ? 'active' : ''}`}
            onClick={toggleHtmlMode}
            title="Mode Kode HTML (VS Code)"
          >
            &lt;&gt;
          </button>
          <button
            type="button"
            className={`rte-btn ${isFullscreen ? 'active' : ''}`}
            onClick={() => setIsFullscreen(!isFullscreen)}
            title="Layar Penuh"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleUploadImage}
          />
        </div>

        {/* Editor Area: Visual ContentEditable OR VS Code Dark+ Syntax-Highlighted HTML Editor */}
        {htmlMode ? (
          <div className="vsc-editor-shell">
            <div className="vsc-editor-tabbar">
              <div className="vsc-tab">
                <span className="vsc-tab-badge">&lt;&gt;</span>
                <span>artikel.html</span>
              </div>
              <div className="vsc-tab-actions">
                <span>VS Code Dark+</span>
                <button type="button" className="vsc-format-btn" onClick={handleFormatHtmlSnippet}>
                  Format HTML
                </button>
              </div>
            </div>

            <div className="vsc-editor-body">
              <div ref={gutterRef} className="vsc-gutter" aria-hidden="true">
                {Array.from({ length: lineCount }, (_, idx) => (
                  <div key={idx + 1}>{idx + 1}</div>
                ))}
              </div>
              <div className="vsc-code-stage">
                <pre
                  ref={htmlPreRef}
                  className="vsc-highlight-layer"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />
                <textarea
                  ref={htmlTextareaRef}
                  className="vsc-textarea"
                  spellCheck={false}
                  value={value}
                  onScroll={syncHtmlScroll}
                  onChange={(e) => onChange && onChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault()
                      const start = e.target.selectionStart
                      const end = e.target.selectionEnd
                      const next = (value || '').slice(0, start) + '  ' + (value || '').slice(end)
                      if (onChange) onChange(next)
                      requestAnimationFrame(() => {
                        if (htmlTextareaRef.current) {
                          htmlTextareaRef.current.selectionStart = htmlTextareaRef.current.selectionEnd = start + 2
                        }
                      })
                    }
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            ref={editorRef}
            className="rte-content"
            contentEditable
            suppressContentEditableWarning
            data-placeholder={placeholder}
            onInput={emitChange}
            onBlur={emitChange}
          />
        )}
      </div>
    </div>
  )
}
