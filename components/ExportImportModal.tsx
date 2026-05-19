'use client'

import { useEffect, useRef, useState } from 'react'
import { Kit, Nodo, Conexion } from '@/types'
import { supabase } from '@/lib/supabase'

interface ExportImportModalProps {
  open: boolean
  kit: Kit | null
  nodos: Nodo[]
  conexiones: Conexion[]
  onClose: () => void
  onImported: () => void
}

interface ExportPayload {
  copyflow: 'kit'
  version: 1
  nombre: string
  nodos: Array<Omit<Nodo, 'id' | 'kit_id' | 'created_at'> & { localId: string }>
  conexiones: Array<{
    localOrigenId: string
    localDestinoId: string
    source_handle?: string | null
    target_handle?: string | null
  }>
}

export default function ExportImportModal({
  open,
  kit,
  nodos,
  conexiones,
  onClose,
  onImported,
}: ExportImportModalProps) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setMessage(null)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleExport = () => {
    if (!kit) return
    const payload: ExportPayload = {
      copyflow: 'kit',
      version: 1,
      nombre: kit.nombre,
      nodos: nodos.map((n) => ({
        localId: n.id,
        tipo: n.tipo,
        texto: n.texto,
        posicion_x: n.posicion_x,
        posicion_y: n.posicion_y,
        ancho: n.ancho,
        alto: n.alto,
      })),
      conexiones: conexiones.map((c) => ({
        localOrigenId: c.nodo_origen_id,
        localDestinoId: c.nodo_destino_id,
        source_handle: c.source_handle,
        target_handle: c.target_handle,
      })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${kit.nombre.replace(/[^a-z0-9-_]+/gi, '_')}.copyflow.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setMessage(`Exportado: ${nodos.length} nodos, ${conexiones.length} conexiones.`)
  }

  const handleImportFile = async (file: File) => {
    setBusy(true)
    setMessage(null)
    try {
      const text = await file.text()
      const data: ExportPayload = JSON.parse(text)
      if (data.copyflow !== 'kit' || !Array.isArray(data.nodos)) {
        throw new Error('Archivo no válido')
      }
      const nombre = `${data.nombre || 'Kit importado'} (import)`
      const { data: newKit, error: kErr } = await supabase
        .from('kits')
        .insert({ nombre })
        .select()
        .single()
      if (kErr || !newKit) throw new Error(kErr?.message || 'No se pudo crear el kit')

      const idMap = new Map<string, string>()
      for (const n of data.nodos) {
        const { data: inserted, error } = await supabase
          .from('nodos')
          .insert({
            kit_id: newKit.id,
            tipo: n.tipo,
            texto: n.texto,
            posicion_x: n.posicion_x,
            posicion_y: n.posicion_y,
            ancho: n.ancho,
            alto: n.alto,
          })
          .select()
          .single()
        if (error || !inserted) throw new Error(error?.message || 'Falló inserción de nodo')
        idMap.set(n.localId, inserted.id)
      }

      for (const c of data.conexiones ?? []) {
        const src = idMap.get(c.localOrigenId)
        const dst = idMap.get(c.localDestinoId)
        if (!src || !dst) continue
        const base = { kit_id: newKit.id, nodo_origen_id: src, nodo_destino_id: dst }
        const tryRes = await supabase
          .from('conexiones')
          .insert({ ...base, source_handle: c.source_handle, target_handle: c.target_handle })
        if (tryRes.error) {
          await supabase.from('conexiones').insert(base)
        }
      }

      setMessage(`Importado como "${nombre}".`)
      onImported()
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-[100] modal-backdrop flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="w-full max-w-md card shadow-pop overflow-hidden"
        style={{ background: 'var(--bg-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border">
          <h2 className="text-app-text font-semibold">Exportar / Importar kit</h2>
          <button onClick={onClose} className="text-app-muted hover:text-app-text">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-app-muted font-semibold mb-2">Exportar kit actual</p>
            <button
              onClick={handleExport}
              disabled={!kit || busy}
              className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Descargar JSON
            </button>
          </div>

          <div className="h-px bg-app-border" />

          <div>
            <p className="text-xs uppercase tracking-wider text-app-muted font-semibold mb-2">Importar desde archivo</p>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f) }}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-app-surface-2 hover:bg-app-border text-app-text rounded-xl py-2.5 text-sm font-semibold border border-app-border transition-colors disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {busy ? 'Importando...' : 'Seleccionar archivo'}
            </button>
          </div>

          {message && (
            <div className={`text-xs px-3 py-2 rounded-lg ${message.startsWith('Error') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-600 border border-green-500/20'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
