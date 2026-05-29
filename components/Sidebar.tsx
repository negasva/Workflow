'use client'

import { useMemo, useState } from 'react'
import { Kit } from '@/types'

interface SidebarProps {
  kits: Kit[]
  selectedKitId: string | null
  onSelectKit: (id: string) => void
  onAddKit: () => void
  onDuplicateKit: (id: string) => void
  onDeleteKit: (id: string) => void
  onRenameKit: (id: string, nombre: string) => void
  onMoveKit: (draggedId: string, targetId: string) => void
  orderByGroup: boolean
  onToggleOrderByGroup: () => void
}

export default function Sidebar({
  kits,
  selectedKitId,
  onSelectKit,
  onAddKit,
  onDuplicateKit,
  onDeleteKit,
  onRenameKit,
  onMoveKit,
  orderByGroup,
  onToggleOrderByGroup,
}: SidebarProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)

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
    if (editingName.trim()) onRenameKit(id, editingName.trim())
    setEditingId(null)
  }

  const grouped = useMemo(() => {
    const acc: Record<string, Kit[]> = {}
    for (const kit of kits) {
      const group = (kit.grupo ?? 'General').trim() || 'General'
      if (!acc[group]) acc[group] = []
      acc[group].push(kit)
    }
    return Object.entries(acc).sort(([a], [b]) => a.localeCompare(b, 'es'))
  }, [kits])

  const renderKit = (kit: Kit) => (
    <div
      key={kit.id}
      draggable={editingId !== kit.id}
      onDragStart={() => setDraggedId(kit.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => {
        if (draggedId && draggedId !== kit.id) onMoveKit(draggedId, kit.id)
        setDraggedId(null)
      }}
      onClick={() => onSelectKit(kit.id)}
      className={`group flex items-center justify-between px-3 py-2.5 cursor-pointer transition-all border ${
        selectedKitId === kit.id
          ? 'bg-brand text-white border-transparent shadow-drop'
          : 'text-app-text border-transparent hover:bg-app-surface-2 hover:border-app-border'
      }`}
      style={{ borderRadius: 'var(--radius-btn)' }}
    >
      {editingId === kit.id ? (
        <input
          autoFocus
          className="bg-white text-black text-sm px-2 py-1 rounded w-full outline-none border border-app-border"
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
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedKitId === kit.id ? 'bg-white' : 'bg-app-muted'}`} />
            <span className="text-sm font-medium truncate">{kit.nombre}</span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDuplicateKit(kit.id)
              }}
              className="p-1 rounded hover:bg-app-border text-app-muted hover:text-app-text transition-colors"
              title="Duplicar kit"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h10M8 11h10M8 15h6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5h12a2 2 0 012 2v12H8a2 2 0 01-2-2V5z" />
              </svg>
            </button>
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
  )

  return (
    <>
      <aside className="w-64 min-w-[256px] flex flex-col h-full border-r" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <div className="px-5 py-4 border-b border-app-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-title font-semibold text-app-text">Kits</h2>
            <span className="text-xs text-app-muted">{kits.length}</span>
          </div>
          <button
            onClick={onToggleOrderByGroup}
            className="w-full px-3 py-2 rounded-xl border text-xs font-semibold transition-colors bg-app-surface-2"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            {orderByGroup ? 'Ver orden manual' : 'Ordenar por grupos'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <div className="space-y-1 px-2">
            {orderByGroup
              ? grouped.map(([group, groupKits]) => (
                  <div key={group} className="space-y-1">
                    <div className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-app-muted">
                      {group}
                    </div>
                    {groupKits.map(renderKit)}
                  </div>
                ))
              : kits.map(renderKit)}
            {kits.length === 0 && <div className="px-3 py-8 text-center text-xs text-app-muted">Sin kits todavía</div>}
          </div>
        </div>

        <div className="p-3 border-t border-app-border">
          <button
            onClick={onAddKit}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white py-2.5 text-sm font-semibold transition-all shadow-drop hover:shadow-node"
            style={{ borderRadius: 'var(--radius-btn)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo kit
          </button>
        </div>
      </aside>

      {deleteConfirm && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-[100]">
          <div className="shadow-pop p-6 max-w-sm w-full mx-4 border border-app-border" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-card)' }}>
            <h3 className="font-title text-app-text font-semibold text-lg mb-2">¿Eliminar kit?</h3>
            <p className="text-app-muted text-sm mb-5">Se eliminará el kit y todos sus nodos y conexiones. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-app-surface-2 hover:bg-app-border text-app-text border border-app-border py-2.5 text-sm font-medium transition-colors" style={{ borderRadius: 'var(--radius-btn)' }}>
                Cancelar
              </button>
              <button onClick={handleDeleteConfirm} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 text-sm font-medium transition-all shadow-drop" style={{ borderRadius: 'var(--radius-btn)' }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
