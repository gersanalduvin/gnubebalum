// Interfaz principal para ConfigTurnos
export interface ConfigTurnos {
  id: number
  uuid: string
  nombre: string
  orden: number
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
}

// Interfaz para cambios de auditoría
export interface CambioAuditoria {
  accion: string
  usuario_id: number
  usuario_email?: string
  fecha: string
  datos_nuevos: Record<string, any>
  datos_anteriores: Record<string, any>
}

// Interfaces para requests
export interface CreateTurnosRequest {
  nombre: string
  orden: number
}

export interface UpdateTurnosRequest {
  nombre: string
  orden: number
}

// Interfaces para responses paginados
export interface TurnosPaginatedResponse {
  success: boolean
  data: {
    current_page: number
    data: ConfigTurnos[]
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
export interface TurnosTableFilters {
  search: string
}

// Interfaces para estado de modales
export interface TurnosModalState {
  open: boolean
  mode: 'create' | 'edit'
  turnos: ConfigTurnos | undefined
}

export interface DeleteConfirmState {
  open: boolean
  turnos: ConfigTurnos | undefined
}

// Interface para parámetros de búsqueda
export interface TurnosSearchParams {
  page?: number
  per_page?: number
  search?: string
}

// Interface para errores de validación
export interface ValidationErrors {
  [key: string]: string[]
}