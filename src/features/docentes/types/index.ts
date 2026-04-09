export * from './asignaciones'
export interface Docente {
  id: number
  email: string
  role_id: number | null
  tipo_usuario: 'docente'
  primer_nombre: string
  segundo_nombre: string
  primer_apellido: string
  segundo_apellido: string
  sexo: 'M' | 'F' | null
  correo_notificaciones: string | null
  fecha_nacimiento?: string | null
  foto_url: string | null
  foto_path: string | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface DocenteFormData {
  id?: number
  primer_nombre: string
  segundo_nombre: string
  primer_apellido: string
  segundo_apellido: string
  email?: string
  tipo_usuario?: 'docente'
  sexo?: 'M' | 'F'
  role_id?: number | null
  correo_notificaciones?: string
  fecha_nacimiento?: string | null
  foto_url?: string | null
  foto_path?: string | null
}

export interface DocentesFilters {
  search?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  estado?: string
}

export interface DocentesResponse {
  data: Docente[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ValidationErrors {
  [key: string]: string[]
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors?: ValidationErrors
}

export interface ApiResponseWithValidation<T> {
  success: boolean
  data: T
  message: string
  errors?: ValidationErrors
}
