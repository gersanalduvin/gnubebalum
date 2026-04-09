// Tipos para el módulo de Configuración de Grados

export interface ConfigGrado {
  id: number;
  uuid: string;
  nombre: string;
  abreviatura: string;
  orden: number;
  modalidad_id?: number;
  is_synced: boolean;
  synced_at: string | null;
  updated_locally_at: string | null;
  version: number;
  created_by: number;
  updated_by: number | null;
  deleted_by: number | null;
  deleted_at: string | null;
  cambios: CambioAuditoria[];
  created_at: string;
  updated_at: string;
}

export interface CambioAuditoria {
  accion: string;
  usuario: string;
  fecha: string;
  version: number;
  cambios?: Record<string, { anterior: any; nuevo: any }>;
}

// Tipo para crear un nuevo grado
export interface CreateGradoRequest {
  nombre: string;
  abreviatura: string;
  orden: number;
  modalidad_id: number;
}

// Tipo para actualizar un grado
export interface UpdateGradoRequest extends CreateGradoRequest {
  id: number;
}

// Respuesta paginada de la API
export interface GradoPaginatedResponse {
  current_page: number;
  data: ConfigGrado[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

// Respuesta genérica de la API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: Record<string, string[]>;
}

// Opciones de modalidades para selects
export interface ModalidadOption {
  id: number;
  nombre: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  last_page: number;
}

// Filtros para la tabla
export interface GradoTableFilters {
  page?: number;
  per_page?: number;
  search?: string;
}

// Estado del modal
export interface GradoModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  grado?: ConfigGrado;
}

export interface DeleteConfirmState {
  isOpen: boolean;
  grado?: ConfigGrado;
}

// Parámetros de búsqueda
export interface GradoSearchParams {
  per_page?: number;
  search?: string;
  page?: number;
}

// Errores de validación
export interface ValidationErrors {
  [key: string]: string[];
}