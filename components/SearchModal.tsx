'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Nodo, TipoNodo } from '@/types'

interface SearchModalProps {
  open: boolean
  nodos: Nodo[]
  onClose: () => void
  onSelect: (id: string) => void
}

const TIPO_COLOR: Record<TipoNodo, string> = {
  inicio: '#8B5CF6',
  yo: '#3B82F6',
  cliente: '#10B981',
}

export default function SearchModal({ open, nodos, onClose, onSelect }: SearchModalProps) {
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const results = useMemo(() => {
    if (!q.trim()) return nodos.slice(0, 20)
    const lower = q.toLowerCase()
    return nodos.filter((n) => n.texto.toLowerCase().includes(lower)).slice(0, 30)
  }, [q, nodos])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setIdx((i) => Math.min(i + 1, results.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setIdx((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && results[idx]) {
        onSelect(results[idx].id)
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, idx, onClose, onSelect])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] modal-backdrop flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <div
        className="w-full max-w-xl card shadow-pop overflow-hidden"
        style={{ background: 'var(--bg-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-app-border">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-app-muted"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setIdx(0) }}
            placeholder="Buscar nodo por texto..."
            className="flex-1 bg-transparent outline-none text-app-text placeholder:text-app-muted text-sm"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-app-border text-app-muted">ESC</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-app-muted">Sin resultados</div>
          ) : (
            results.map((n, i) => {
              const c = TIPO_COLOR[n.tipo]
              return (
                <button
                  key={n.id}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => { onSelect(n.id); onClose() }}
                  className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors border-l-2 ${
                    i === idx ? 'bg-app-surface-2 border-l-brand' : 'border-l-transparent'
                  }`}
                >
                  <span
                    className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: `${c}20`, color: c }}
                  >
                    {n.tipo}
                  </span>
                  <span className="text-sm text-app-text line-clamp-2 flex-1">{n.texto || <em className="text-app-muted">(vacío)</em>}</span>
                </button>
              )
            })
          )}
        </div>
        <div className="px-4 py-2 border-t border-app-border flex items-center gap-3 text-[11px] text-app-muted">
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border border-app-border">↑↓</kbd> navegar</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border border-app-border">⏎</kbd> abrir</span>
        </div>
      </div>
    </div>
  )
}
