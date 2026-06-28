'use client'

import { useState } from 'react'
import { Kit } from '@/types'

interface SidebarProps {
  kits: Kit[]
  groupedKits: Record<string, Kit[]>
  allGroups: string[]
  orderedGroupNames: string[]
  selectedKitId: string | null
  onClose: () => void
  onSelectKit: (id: string) => void
  onAddKit: () => void
  onDuplicateKit: (id: string) => void
  onDeleteKit: (id: string) => void
  onRenameKit: (id: string, nombre: string) => void
  onChangeKitGroup: (id: string, grupo: string) => void
  onMoveKit: (draggedId: string, targetId: string) => void
  onMoveGroup: (draggedGroup: string, targetGroup: string) => void
}

export default function Sidebar({
  kits,
  groupedKits,
  allGroups,
  orderedGroupNames,
  selectedKitId,
  onClose,
  onSelectKit,
  onAddKit,
  onDuplicateKit,
  onDeleteKit,
  onRenameKit,
  onChangeKitGroup,
  onMoveKit,
  onMoveGroup,
}: SidebarProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [draggedGroup, setDraggedGroup] = useState<string | null>(null)
  const [newGroup, setNewGroup] = useState('')

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

  const handleCreateGroup = () => {
    if (!newGroup.trim() || !selectedKitId) return
    onChangeKitGroup(selectedKitId, newGroup.trim())
    setNewGroup('')
  }

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
      className={`group cursor-pointer transition-all border ${
        selectedKitId === kit.id
          ? 'bg-brand text-white border-transparent shadow-drop'
          : 'bg-app-surface text-app-text border-app-border/60 hover:bg-app-surface-2 hover:border-app-border'
      }`}
      style={{ borderRadius: '16px' }}
    >
      {editingId === kit.id ? (
        <input
          autoFocus
          className="bg-white text-black text-sm px-3 py-2 rounded-xl w-full outline-none border border-app-border"
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
        <div className="p-3.5">
          <div className="flex items-start gap-2">
            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${selectedKitId === kit.id ? 'bg-white' : 'bg-orange-500'}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold leading-tight truncate">{kit.nombre}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${selectedKitId === kit.id ? 'border-white/25 bg-white/10' : 'border-app-border bg-app-surface-2 text-app-muted'}`}>
                  {kit.grupo ?? 'General'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            <select
              value={kit.grupo ?? 'General'}
              onChange={(e) => {
                e.stopPropagation()
                onChangeKitGroup(kit.id, e.target.value)
              }}
              onClick={(e) => e.stopPropagation()}
              className={`flex-1 min-w-0 text-[11px] px-2 py-2 rounded-lg border ${selectedKitId === kit.id ? 'bg-white/15 text-white border-white/25' : 'bg-app-surface-2 text-app-text border-app-border'}`}
            >
              {allGroups.map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDuplicateKit(kit.id)
              }}
              className={`w-9 h-9 rounded-lg transition-colors flex items-center justify-center shrink-0 ${selectedKitId === kit.id ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-app-surface-2 text-app-muted hover:text-app-text hover:bg-app-border'}`}
              title="Duplicar kit"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h10M8 11h10M8 15h6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5h12a2 2 0 012 2v12H8a2 2 0 01-2-2V5z" />
              </svg>
            </button>
            <button
              onClick={(e) => handleRenameStart(e, kit)}
              className={`w-9 h-9 rounded-lg transition-colors flex items-center justify-center shrink-0 ${selectedKitId === kit.id ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-app-surface-2 text-app-muted hover:text-app-text hover:bg-app-border'}`}
              title="Renombrar"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={(e) => handleDeleteClick(e, kit.id)}
              className={`w-9 h-9 rounded-lg transition-colors flex items-center justify-center shrink-0 ${selectedKitId === kit.id ? 'bg-white/15 text-white hover:bg-red-500/40' : 'bg-app-surface-2 text-app-muted hover:text-red-400 hover:bg-red-500/15'}`}
              title="Eliminar"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Drawer backdrop — mobile only */}
      <div
        className="fixed inset-0 z-30 bg-black/60 md:hidden"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed md:static z-40 top-0 bottom-0 left-16 md:left-auto w-[78vw] max-w-[300px] md:w-64 md:min-w-[256px] md:max-w-none flex flex-col h-full border-r"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="px-4 md:px-5 py-3.5 md:py-4 border-b border-app-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-title font-semibold text-app-text text-base">Kits</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-app-muted">{kits.length}</span>
              <button
                onClick={onClose}
                className="md:hidden text-app-muted hover:text-app-text p-1 -mr-1"
                title="Cerrar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              placeholder="Nuevo grupo"
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border bg-app-surface-2 text-app-text placeholder:text-app-muted text-sm outline-none focus:border-brand"
              style={{ borderColor: 'var(--border)' }}
            />
            <button
              type="button"
              onClick={handleCreateGroup}
              className="px-3.5 py-2.5 rounded-xl border text-sm font-semibold bg-app-surface-2 hover:bg-app-border transition-colors shrink-0"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Crear
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <div className="space-y-2 px-2">
            {orderedGroupNames.map((group) => (
              <div
                key={group}
                className="space-y-1"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedGroup && draggedGroup !== group) onMoveGroup(draggedGroup, group)
                  setDraggedGroup(null)
                }}
              >
                <div
                  draggable
                  onDragStart={() => setDraggedGroup(group)}
                  className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-app-muted cursor-grab select-none"
                >
                  {group}
                </div>
                {groupedKits[group]?.map(renderKit)}
              </div>
            ))}
            {kits.length === 0 && <div className="px-3 py-8 text-center text-xs text-app-muted">Sin kits todavía</div>}
          </div>
        </div>

        <div className="p-3 border-t border-app-border">
          <button
            onClick={onAddKit}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white py-3.5 text-sm font-semibold transition-all shadow-drop hover:shadow-node"
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
