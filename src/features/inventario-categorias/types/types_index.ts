// Tipos para el módulo de Inventario - Categorías

export interface InventarioCategoria {
  id: number
  uuid: string
  codigo: string
  nombre: string
  descripcion: string | null
  categoria_padre_id: number | null
  activo: boolean
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
  // Relaciones
  categoria_padre?: {
    id: number
    codigo: string
    nombre: string
  } | null
  categorias_hijas?: InventarioCategoria[]
}

export interface CambioAuditoria {
  accion: string
  usuario_id: number
  usuario_email?: string
  fecha: string
  datos_nuevos: Record<string, any>
  datos_anteriores: Record<string, any>
}

export interface CreateCategoriaRequest {
  codigo: string
  nombre: string
  descripcion?: string | null
  categoria_padre_id?: number | null
  activo: boolean
}

export interface UpdateCategoriaRequest {
  codigo?: string
  nombre?: string
  descripcion?: string | null
  categoria_padre_id?: number | null
  activo?: boolean
}

export interface CategoriaPaginatedResponse {
  success: boolean
  data: {
    current_page: number
    data: InventarioCategoria[]
    per_page: number
    total: number
    last_page: number
    from: number
    to: number
  }
  message: string
}

export interface CategoriaArbolResponse {
  success: boolean
  data: InventarioCategoria[]
  message: string
}

export interface CategoriaEstadisticasResponse {
  success: boolean
  data: {
    total: number
    activas: number
    inactivas: number
    raices: number
    con_hijas: number
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

export interface CategoriaTableFilters {
  search: string
  activo?: boolean
  categoria_padre_id?: number
}

export interface CategoriaModalState {
  open: boolean
  mode: 'create' | 'edit'
  categoria?: InventarioCategoria
}

export interface DeleteConfirmState {
  open: boolean
  categoria?: InventarioCategoria
}

export interface CategoriaSearchParams {
  page?: number
  size?: number
  per_page?: number
  search?: string
  activo?: boolean
  categoria_padre_id?: number
}

export interface ValidationErrors {
  [key: string]: string[]
}

export interface SyncCategoriaRequest {
  categorias: InventarioCategoria[]
}

export interface SyncResponse {
  success: boolean
  data: {
    created: number
    updated: number
    errors: any[]
  }
  message: string
}

// Constantes para opciones de formulario
export const ESTADOS_CATEGORIA = [
  { value: true, label: 'Activo' },
  { value: false, label: 'Inactivo' }
] as const

// Interfaces adicionales para compatibilidad
export interface CategoriaCatalogo extends InventarioCategoria {}

export interface CategoriaPaginatedData {
  current_page: number
  data: CategoriaCatalogo[]
  per_page: number
  total: number
}

export interface CategoriaSearchResponse {
  data?: CategoriaPaginatedData
  message?: string
}

export interface CategoriaSearchParamsExtended extends CategoriaSearchParams {
  q?: string // Para búsqueda por query
}

// Estados para el modal de cambios de auditoría
export interface ChangesModalState {
  open: boolean
  categoria?: InventarioCategoria
}