// Interfaces para entidades relacionadas
export interface Grado {
  id: number
  nombre: string
  abreviatura: string
}

export interface Seccion {
  id: number
  nombre: string
}

export interface Turno {
  id: number
  nombre: string
}

export interface Docente {
  id: number
  name: string
  email: string
}

// Interfaz principal para ConfigGrupos
export interface ConfigGrupos {
  id: number
  uuid: string
  grado_id: number
  seccion_id: number
  turno_id: number
  docente_guia: number | null
  is_synced: boolean
  synced_at: string | null
  updated_locally_at: string | null
  version: number
  created_by: number
  updated_by: number | null
  deleted_by: number | null
  deleted_at: string | null
  cambios: CambioAuditoria[]
  created_at: string
  updated_at: string
  grado: Grado
  seccion: Seccion
  turno: Turno
  docente?: Docente | null
}

// Interfaz para auditoría de cambios
export interface CambioAuditoria {
  accion: string
  usuario_id: number
  usuario_email?: string
  fecha: string
  datos_nuevos: Record<string, any>
  datos_anteriores: Record<string, any>
}

// Interfaces para requests
export interface CreateGruposRequest {
  grado_id: number
  seccion_id: number
  turno_id: number
  periodo_lectivo_id: number
  docente_guia?: number | null
}

export interface UpdateGruposRequest {
  grado_id: number
  seccion_id: number
  turno_id: number
  periodo_lectivo_id: number
  docente_guia?: number | null
}

// Interfaces para responses paginados
export interface GruposPaginatedResponse {
  success: boolean
  data: {
    current_page: number
    data: ConfigGrupos[]
    per_page: number
    total: number
    last_page?: number
    from?: number
    to?: number
    links?: PaginationLink[]
  }
  message: string
}

export interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

// Interface genérica para respuestas de API
export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  errors?: ValidationErrors
}

// Interface para respuestas paginadas genéricas
export interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  per_page: number
  total: number
  last_page?: number
  from?: number
  to?: number
  links?: PaginationLink[]
}

// Interfaces para filtros y estado de la tabla
export interface GruposTableFilters {
  search: string
  periodo_lectivo_id?: number
  grado_id?: number
  seccion_id?: number
  turno_id?: number
}

// Interfaces para estado de modales
export interface GruposModalState {
  open: boolean
  mode: 'create' | 'edit'
  grupos: ConfigGrupos | undefined
}

export interface DeleteConfirmState {
  open: boolean
  grupos: ConfigGrupos | undefined
}

// Interface para parámetros de búsqueda
export interface GruposSearchParams {
  page?: number
  per_page?: number
  search?: string
  periodo_lectivo_id?: number
  grado_id?: number
  seccion_id?: number
  turno_id?: number
}

// Interface para errores de validación
export interface ValidationErrors {
  [key: string]: string[]
}

// Interface para opciones de select
export interface SelectOption {
  value: number
  label: string
}