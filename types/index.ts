export type TipoNodo = 'yo' | 'cliente' | 'inicio'

export interface Kit {
  id: string
  nombre: string
  grupo?: string | null
  created_at: string
}

export interface Nodo {
  id: string
  kit_id: string
  origin_id?: string | null
  tipo: TipoNodo
  texto: string
  posicion_x: number
  posicion_y: number
  ancho?: number
  alto?: number
  font_size?: number
  color?: string | null
  created_at: string
}

export interface Conexion {
  id: string
  kit_id: string
  origin_source_id?: string | null
  origin_target_id?: string | null
  nodo_origen_id: string
  nodo_destino_id: string
  source_handle?: string | null
  target_handle?: string | null
}
