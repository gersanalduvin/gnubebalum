export interface ConfigGrado {
  id: number
  uuid: string
  nombre: string
  formato?: 'cuantitativo' | 'cualitativo'
  abreviatura: string
  orden: number
  modalidad_id?: number
  is_synced: boolean
  synced_at: string | null
  updated_locally_at: string | null
  version: number
  created_by: number
  updated_by: number | null
  deleted_by: number | null
  deleted_at: string | null
  cambios: any[]
  created_at: string
  updated_at: string
}

export interface ConfigGradoFormData {
  nombre: string
  formato: 'cuantitativo' | 'cualitativo'
  abreviatura: string
  orden: number
  modalidad_id: number
}

export interface ConfigGradoFilters {
  search?: string
  per_page?: number
}

export interface ConfigGradoResponse {
  data: ConfigGrado[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

// Tipo para errores de validación del backend
export interface ValidationErrors {
  [key: string]: string[]
}

export interface ModalidadOption {
  id: number
  nombre: string
}
