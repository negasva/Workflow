'use client'

import { useEffect, useMemo, useState } from 'react'
import { TipoNodo } from '@/types'

interface StatsModalProps {
  open: boolean
  onClose: () => void
}

const USAGE_STORAGE_KEY = 'copyflow-usage'
const USAGE_META_STORAGE_KEY = 'copyflow-usage-meta'

const TIPO_COLOR: Record<TipoNodo, string> = {
  inicio: '#3A63C0',
  yo: '#2C7D69',
  cliente: '#C2562A',
}

interface Row {
  id: string
  count: number
  text: string
  tipo: TipoNodo
}

export default function StatsModal({ open, onClose }: StatsModalProps) {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const rows = useMemo<Row[]>(() => {
    if (!open) return []
    void version
    try {
      const counts: Record<string, number> = JSON.parse(localStorage.getItem(USAGE_STORAGE_KEY) || '{}')
      const meta: Record<string, { text: string; tipo: TipoNodo }> = JSON.parse(localStorage.getItem(USAGE_META_STORAGE_KEY) || '{}')
      return Object.entries(counts)
        .map(([id, count]) => ({ id, count, text: meta[id]?.text ?? '(mensaje eliminado)', tipo: meta[id]?.tipo ?? 'yo' }))
        .filter((r) => r.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
    } catch {
      return []
    }
  }, [open, version])

  const total = rows.reduce((s, r) => s + r.count, 0)
  const max = rows[0]?.count ?? 1

  const handleReset = () => {
    try {
      localStorage.removeItem(USAGE_STORAGE_KEY)
      localStorage.removeItem(USAGE_META_STORAGE_KEY)
    } catch { /* ignore */ }
    setVersion((v) => v + 1)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] modal-backdrop flex items-start justify-center pt-16 sm:pt-24 px-4" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden border border-app-border flex flex-col max-h-[80vh]"
        style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-drop)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border">
          <div>
            <h2 className="font-title text-app-text font-semibold">Top guiones</h2>
            <p className="text-xs text-app-muted mt-0.5">{total} copias registradas</p>
          </div>
          <button onClick={onClose} className="text-app-muted hover:text-app-text p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {rows.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-app-muted">
              Aún no hay copias. Usa el botón Copiar en modo Venta y aquí verás qué guiones usas más.
            </div>
          ) : rows.map((r, i) => {
            const c = TIPO_COLOR[r.tipo]
            return (
              <div key={r.id} className="rounded-xl border border-app-border p-3" style={{ background: 'var(--bg-surface-2)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-app-muted w-5 shrink-0">{i + 1}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0" style={{ background: `${c}22`, color: c }}>{r.tipo}</span>
                  <span className="ml-auto text-sm font-bold text-app-text shrink-0">{r.count}×</span>
                </div>
                <p className="text-sm text-app-text line-clamp-2 mb-2">{r.text}</p>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(r.count / max) * 100}%`, background: c }} />
                </div>
              </div>
            )
          })}
        </div>

        {rows.length > 0 && (
          <div className="px-4 py-3 border-t border-app-border">
            <button
              onClick={handleReset}
              className="w-full py-2.5 text-sm font-medium rounded-lg border border-app-border text-app-muted hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-colors"
            >
              Reiniciar contadores
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
