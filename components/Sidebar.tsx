'use client'

import { useState } from 'react'
import { Kit } from '@/types'

interface SidebarProps {
  kits: Kit[]
  selectedKitId: string | null
  mode: 'venta' | 'editor'
  onSelectKit: (id: string) => void
  onToggleMode: () => void
  onAddKit: () => void
  onDeleteKit: (id: string) => void
  onRenameKit: (id: string, nombre: string) => void
}

export default function Sidebar({
  kits,
  selectedKitId,
  mode,
  onSelectKit,
  onToggleMode,
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
      <aside className="w-64 min-w-[256px] bg-[#111111] border-r border-[#222] flex flex-col h-full">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 4V16C8 17.1046 8.89543 18 10 18L18 18C19.1046 18 20 17.1046 20 16V7.24162C20 6.7034 19.7831 6.18789 19.3982 5.81161L16.0829 2.56999C15.7092 2.2046 15.2074 2 14.6847 2H10C8.89543 2 8 2.89543 8 4Z" stroke="#ffbb00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V9C4 7.89543 4.89543 7 6 7H8" stroke="#ffbb00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-bold text-lg tracking-tight text-white">CopyFlow</span>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="px-4 py-3 border-b border-[#222]">
          <button
            onClick={onToggleMode}
            className="w-full flex items-center justify-between bg-[#1e1e1e] rounded-lg p-1 text-sm font-medium"
          >
            <span
              className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                mode === 'venta'
                  ? 'bg-[#EC4899] text-white shadow'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              💬 VENTA
            </span>
            <span
              className={`flex-1 py-1.5 rounded-md text-center transition-all ${
                mode === 'editor'
                  ? 'bg-[#3B82F6] text-white shadow'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              ✏️ EDITOR
            </span>
          </button>
        </div>

        {/* Kits list */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-4 pb-2 pt-1 text-xs text-[#555] uppercase tracking-wider font-semibold">
            Kits
          </div>
          <div className="space-y-0.5 px-2">
            {kits.map((kit) => (
              <div
                key={kit.id}
                onClick={() => onSelectKit(kit.id)}
                className={`group flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer transition-all ${
                  selectedKitId === kit.id
                    ? 'bg-[#252525] text-white'
                    : 'text-[#aaa] hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                {editingId === kit.id ? (
                  <input
                    autoFocus
                    className="bg-[#333] text-white text-sm px-2 py-0.5 rounded w-full outline-none"
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
                    <span className="text-sm font-medium truncate flex-1">{kit.nombre}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <button
                        onClick={(e) => handleRenameStart(e, kit)}
                        className="p-1 hover:text-blue-400 transition-colors text-[#555]"
                        title="Renombrar"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, kit.id)}
                        className="p-1 hover:text-red-400 transition-colors text-[#555]"
                        title="Eliminar"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add kit button */}
        <div className="p-4 border-t border-[#222]">
          <button
            onClick={onAddKit}
            className="w-full flex items-center justify-center gap-2 bg-[#1e1e1e] hover:bg-[#252525] border border-[#2a2a2a] hover:border-[#3a3a3a] text-[#aaa] hover:text-white rounded-lg py-2.5 text-sm font-medium transition-all"
          >
            <span className="text-lg">+</span>
            Nuevo kit
          </button>
        </div>
      </aside>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-white font-semibold text-lg mb-2">¿Eliminar kit?</h3>
            <p className="text-[#888] text-sm mb-5">
              Se eliminará el kit y todos sus nodos y conexiones. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-[#222] hover:bg-[#2a2a2a] text-[#aaa] rounded-lg py-2.5 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
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
