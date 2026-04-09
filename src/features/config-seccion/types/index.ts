// Tipos para el módulo de Configuración de Secciones

export interface ConfigSeccion {
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

export interface CambioAuditoria {
  accion: string
  usuario_id: number
  usuario_email?: string
  fecha: string
  datos_nuevos: Record<string, any>
  datos_anteriores: Record<string, any>
}

export interface CreateSeccionRequest {
  nombre: string
  orden: number
}

export interface UpdateSeccionRequest {
  nombre: string
  orden: number
}

export interface SeccionPaginatedResponse {
  success: boolean
  data: {
    current_page: number
    data: ConfigSeccion[]
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
export interface SeccionTableFilters {
  search: string
}

// Tipos para estados de modales
export interface SeccionModalState {
  open: boolean
  mode: 'create' | 'edit'
  seccion?: ConfigSeccion
}

export interface DeleteConfirmState {
  open: boolean
  seccion?: ConfigSeccion
}

// Tipos para parámetros de búsqueda
export interface SeccionSearchParams {
  page?: number
  size?: number
  per_page?: number
  search?: string
}

// Tipos para errores de validación
export interface ValidationErrors {
  [key: string]: string[]
}