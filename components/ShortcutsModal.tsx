'use client'

import { useEffect } from 'react'

interface ShortcutsModalProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['Ctrl', 'K'], label: 'Buscar nodo' },
  { keys: ['Ctrl', 'Z'], label: 'Deshacer último movimiento' },
  { keys: ['?'], label: 'Abrir atajos' },
  { keys: ['Esc'], label: 'Cerrar menús / modales' },
  { keys: ['Del'], label: 'Eliminar nodo seleccionado' },
  { keys: ['Click +'], label: 'Crear nodo hijo conectado' },
  { keys: ['Drag handle'], label: 'Crear conexión manual' },
  { keys: ['Click edge'], label: 'Menú: invertir / eliminar' },
]

export default function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] modal-backdrop flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden border border-app-border"
        style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-drop)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border">
          <h2 className="font-title text-app-text font-semibold">Atajos de teclado</h2>
          <button onClick={onClose} className="text-app-muted hover:text-app-text">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="p-5 space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.label} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-app-text">{s.label}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <kbd
                    key={i}
                    className="text-[11px] font-mono font-semibold px-2 py-1 rounded-md border border-app-border bg-app-surface-2 text-app-text shadow-soft"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
