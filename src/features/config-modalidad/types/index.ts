// Tipos para el módulo de Configuración de Modalidades

export interface ConfigModalidad {
  id: number
  uuid: string
  nombre: string
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

export interface CambioAuditoria {
  accion: string
  usuario: string
  fecha: string
  version: number
}

export interface CreateModalidadRequest {
  nombre: string
}

export interface UpdateModalidadRequest {
  nombre: string
}

export interface ModalidadPaginatedResponse {
  success: boolean
  data: {
    current_page: number
    data: ConfigModalidad[]
    per_page: number
    total: number
  }
  message: string
}

export interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  errors?: ValidationErrors
}

export interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  per_page: number
  total: number
  last_page: number
  from: number
  to: number
  links: PaginationLink[]
}

// Tipos para filtros de tabla
export interface ModalidadTableFilters {
  search: string
}

// Tipos para estados de modales
export interface ModalidadModalState {
  open: boolean
  mode: 'create' | 'edit'
  modalidad?: ConfigModalidad
}

export interface DeleteConfirmState {
  open: boolean
  modalidad?: ConfigModalidad
}

// Tipos para parámetros de búsqueda
export interface ModalidadSearchParams {
  page?: number
  size?: number
  per_page?: number
  search?: string
}

// Tipos para errores de validación
export interface ValidationErrors {
  [key: string]: string[]
}