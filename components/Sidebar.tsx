'use client'

import { useState } from 'react'
import { Kit } from '@/types'

interface SidebarProps {
  kits: Kit[]
  selectedKitId: string | null
  onSelectKit: (id: string) => void
  onAddKit: () => void
  onDeleteKit: (id: string) => void
  onRenameKit: (id: string, nombre: string) => void
}

export default function Sidebar({
  kits,
  selectedKitId,
  onSelectKit,
  onAddKit,
  onDeleteKit,
  onRenameKit,
}: SidebarProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeleteConfirm(id)
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      onDeleteKit(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

  const handleRenameStart = (e: React.MouseEvent, kit: Kit) => {
    e.stopPropagation()
    setEditingId(kit.id)
    setEditingName(kit.nombre)
  }

  const handleRenameSubmit = (id: string) => {
    if (editingName.trim()) {
      onRenameKit(id, editingName.trim())
    }
    setEditingId(null)
  }

  return (
    <>
      <aside
        className="w-64 min-w-[256px] flex flex-col h-full border-r"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-app-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-app-text">Kits</h2>
            <span className="text-xs text-app-muted">{kits.length}</span>
          </div>
        </div>

        {/* Kits list */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="space-y-1 px-2">
            {kits.map((kit) => (
              <div
                key={kit.id}
                onClick={() => onSelectKit(kit.id)}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 cursor-pointer transition-all border ${
                  selectedKitId === kit.id
                    ? 'bg-brand/10 border-brand/30 text-app-text'
                    : 'text-app-text border-transparent hover:bg-app-surface-2 hover:border-app-border'
                }`}
              >
                {editingId === kit.id ? (
                  <input
                    autoFocus
                    className="bg-app-surface-2 text-app-text text-sm px-2 py-0.5 rounded w-full outline-none border border-app-border"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRenameSubmit(kit.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(kit.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          selectedKitId === kit.id ? 'bg-brand' : 'bg-app-muted'
                        }`}
                      />
                      <span className="text-sm font-medium truncate">{kit.nombre}</span>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <button
                        onClick={(e) => handleRenameStart(e, kit)}
                        className="p-1 rounded hover:bg-app-border text-app-muted hover:text-app-text transition-colors"
                        title="Renombrar"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, kit.id)}
                        className="p-1 rounded hover:bg-red-500/10 text-app-muted hover:text-red-500 transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {kits.length === 0 && (
              <div className="px-3 py-8 text-center text-xs text-app-muted">
                Sin kits todavía
              </div>
            )}
          </div>
        </div>

        {/* Add kit button */}
        <div className="p-3 border-t border-app-border">
          <button
            onClick={onAddKit}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white rounded-xl py-2.5 text-sm font-semibold transition-colors shadow-soft"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo kit
          </button>
        </div>
      </aside>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-[100]">
          <div className="card shadow-pop p-6 max-w-sm w-full mx-4" style={{ background: 'var(--bg-surface)' }}>
            <h3 className="text-app-text font-semibold text-lg mb-2">¿Eliminar kit?</h3>
            <p className="text-app-muted text-sm mb-5">
              Se eliminará el kit y todos sus nodos y conexiones. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-app-surface-2 hover:bg-app-border text-app-text border border-app-border rounded-xl py-2.5 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
