'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Kit, Nodo, Conexion } from '@/types'
import Sidebar from '@/components/Sidebar'
import ModoVenta from '@/components/ModoVenta'
import IconNav from '@/components/IconNav'
import SearchModal from '@/components/SearchModal'
import ShortcutsModal from '@/components/ShortcutsModal'
import ExportImportModal from '@/components/ExportImportModal'
import dynamicImport from 'next/dynamic'

const ModoEditor = dynamicImport(() => import('@/components/ModoEditor'), { ssr: false })

type Theme = 'light' | 'dark'

export default function Home() {
  const [kits, setKits] = useState<Kit[]>([])
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null)
  const [mode, setMode] = useState<'venta' | 'editor'>('venta')
  const [nodos, setNodos] = useState<Nodo[]>([])
  const [conexiones, setConexiones] = useState<Conexion[]>([])
  const [loading, setLoading] = useState(true)
  const [kitLoading, setKitLoading] = useState(false)

  const [theme, setTheme] = useState<Theme>('light')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const selectedKit = kits.find((k) => k.id === selectedKitId)

  // Theme: read from localStorage / system on mount, persist on change
  useEffect(() => {
    try {
      const stored = localStorage.getItem('copyflow-theme') as Theme | null
      const initial: Theme = stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      setTheme(initial)
      document.documentElement.classList.toggle('dark', initial === 'dark')
    } catch { /* ignore */ }
  }, [])

  const handleToggleTheme = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', next === 'dark')
      try { localStorage.setItem('copyflow-theme', next) } catch { /* ignore */ }
      return next
    })
  }, [])

  // Load all kits
  const loadKits = useCallback(async () => {
    const { data } = await supabase
      .from('kits')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) {
      setKits(data)
      if (!selectedKitIdRef.current && data.length > 0) {
        setSelectedKitId(data[0].id)
      }
    }
    setLoading(false)
  }, [])
  const selectedKitIdRef = useRef(selectedKitId)
  useEffect(() => { selectedKitIdRef.current = selectedKitId }, [selectedKitId])

  useEffect(() => {
    loadKits()
  }, [loadKits])

  const loadKitData = useCallback(async (kitId: string) => {
    setKitLoading(true)
    const [nodosRes, conexionesRes] = await Promise.all([
      supabase.from('nodos').select('*').eq('kit_id', kitId).order('created_at', { ascending: true }),
      supabase.from('conexiones').select('*').eq('kit_id', kitId),
    ])
    setNodos(nodosRes.data ?? [])
    setConexiones(conexionesRes.data ?? [])
    setKitLoading(false)
  }, [])

  useEffect(() => {
    if (selectedKitId) loadKitData(selectedKitId)
  }, [selectedKitId, loadKitData])

  const handleSelectKit = useCallback((id: string) => {
    setSelectedKitId(id)
    setSidebarOpen(true)
  }, [])

  const handleAddKit = useCallback(async () => {
    const nombre = `Kit ${kits.length + 1}`
    const { data: kitData, error: kitError } = await supabase
      .from('kits')
      .insert({ nombre })
      .select()
      .single()
    if (kitError || !kitData) return

    await supabase.from('nodos').insert({
      kit_id: kitData.id,
      tipo: 'inicio',
      texto: 'Mensaje inicial — edítame',
      posicion_x: 0,
      posicion_y: 0,
    })

    await loadKits()
    setSelectedKitId(kitData.id)
    setSidebarOpen(true)
  }, [kits.length, loadKits])

  const handleDeleteKit = useCallback(
    async (id: string) => {
      await supabase.from('kits').delete().eq('id', id)
      const updatedKits = kits.filter((k) => k.id !== id)
      setKits(updatedKits)
      if (selectedKitId === id) {
        setSelectedKitId(updatedKits[0]?.id ?? null)
      }
    },
    [kits, selectedKitId]
  )

  const handleRenameKit = useCallback(
    async (id: string, nombre: string) => {
      await supabase.from('kits').update({ nombre }).eq('id', id)
      setKits((ks) => ks.map((k) => (k.id === id ? { ...k, nombre } : k)))
    },
    []
  )

  const handleDataChange = useCallback(() => {
    if (selectedKitId) loadKitData(selectedKitId)
  }, [selectedKitId, loadKitData])

  // Global hotkeys: Ctrl+K (search), ? (shortcuts)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable
      if (e.key === '?' && !isTyping) {
        e.preventDefault()
        setShortcutsOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleSearchSelect = useCallback((nodoId: string) => {
    setMode('editor')
    // ModoEditor's fitView will show the canvas; user clicks node to focus.
    // We could highlight further but keep it simple for now.
    void nodoId
  }, [])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
        <div className="text-center space-y-3">
          <svg className="animate-pulse mx-auto" width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M8 4V16C8 17.1046 8.89543 18 10 18L18 18C19.1046 18 20 17.1046 20 16V7.24162C20 6.7034 19.7831 6.18789 19.3982 5.81161L16.0829 2.56999C15.7092 2.2046 15.2074 2 14.6847 2H10C8.89543 2 8 2.89543 8 4Z" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V9C4 7.89543 4.89543 7 6 7H8" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-app-muted text-sm">Cargando CopyFlow...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--bg-app)' }}>
      <IconNav
        mode={mode}
        theme={theme}
        onSetMode={setMode}
        onAddKit={handleAddKit}
        onToggleTheme={handleToggleTheme}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenExport={() => setExportOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onFocusKits={() => setSidebarOpen((s) => !s)}
      />

      {sidebarOpen && (
        <Sidebar
          kits={kits}
          selectedKitId={selectedKitId}
          onSelectKit={handleSelectKit}
          onAddKit={handleAddKit}
          onDeleteKit={handleDeleteKit}
          onRenameKit={handleRenameKit}
        />
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Kit header */}
        <div
          className="px-6 py-3 border-b flex items-center gap-3 min-h-[56px]"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          {selectedKit ? (
            <>
              <button
                onClick={() => setSidebarOpen((s) => !s)}
                className="text-app-muted hover:text-app-text transition-colors p-1 -ml-1"
                title={sidebarOpen ? 'Ocultar kits' : 'Mostrar kits'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <h1 className="font-title text-app-text font-semibold text-sm">{selectedKit.nombre}</h1>
              <span
                className="text-xs px-2.5 py-0.5 rounded-full border font-medium"
                style={{
                  background: mode === 'venta' ? '#10B98115' : '#3B82F615',
                  color: mode === 'venta' ? '#10B981' : '#3B82F6',
                  borderColor: mode === 'venta' ? '#10B98140' : '#3B82F640',
                }}
              >
                {mode === 'venta' ? 'Modo Venta' : 'Modo Editor'}
              </span>
              <div className="ml-auto flex items-center bg-app-surface-2 border border-app-border p-0.5 text-xs font-medium" style={{ borderRadius: 'var(--radius-btn)' }}>
                <button
                  onClick={() => setMode('venta')}
                  className={`px-3 py-1 transition-all ${
                    mode === 'venta' ? 'bg-brand text-white shadow-drop' : 'text-app-muted hover:text-app-text'
                  }`}
                  style={{ borderRadius: 'calc(var(--radius-btn) - 2px)' }}
                >
                  Venta
                </button>
                <button
                  onClick={() => setMode('editor')}
                  className={`px-3 py-1 transition-all ${
                    mode === 'editor' ? 'bg-brand text-white shadow-drop' : 'text-app-muted hover:text-app-text'
                  }`}
                  style={{ borderRadius: 'calc(var(--radius-btn) - 2px)' }}
                >
                  Editor
                </button>
              </div>
            </>
          ) : (
            <span className="text-app-muted text-sm">Selecciona un kit</span>
          )}
        </div>

        {/* Content */}
        {kitLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-app-muted text-sm animate-pulse">Cargando kit...</div>
          </div>
        ) : !selectedKit ? (
          <div className="flex-1 flex items-center justify-center text-app-muted">
            <div className="text-center">
              <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M8 4V16C8 17.1046 8.89543 18 10 18L18 18C19.1046 18 20 17.1046 20 16V7.24162C20 6.7034 19.7831 6.18789 19.3982 5.81161L16.0829 2.56999C15.7092 2.2046 15.2074 2 14.6847 2H10C8.89543 2 8 2.89543 8 4Z" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V9C4 7.89543 4.89543 7 6 7H8" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>Selecciona o crea un kit</p>
              <button
                onClick={handleAddKit}
                className="mt-4 inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 text-sm font-semibold transition-all shadow-drop hover:shadow-node"
                style={{ borderRadius: 'var(--radius-btn)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Crear primer kit
              </button>
            </div>
          </div>
        ) : mode === 'venta' ? (
          <ModoVenta nodos={nodos} conexiones={conexiones} />
        ) : (
          <ModoEditor
            key={selectedKitId!}
            kit={selectedKit}
            nodos={nodos}
            conexiones={conexiones}
            onDataChange={handleDataChange}
          />
        )}
      </main>

      <SearchModal
        open={searchOpen}
        nodos={nodos}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSearchSelect}
      />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ExportImportModal
        open={exportOpen}
        kit={selectedKit ?? null}
        nodos={nodos}
        conexiones={conexiones}
        onClose={() => setExportOpen(false)}
        onImported={() => { setExportOpen(false); loadKits() }}
      />
    </div>
  )
}
