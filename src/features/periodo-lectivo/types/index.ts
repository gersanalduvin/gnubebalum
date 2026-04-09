// Tipos para el módulo de Período Lectivo

export interface ConfPeriodoLectivo {
  id: number;
  nombre: string;
  prefijo_alumno: string;
  prefijo_docente: string;
  prefijo_familia: string;
  prefijo_admin: string;
  incremento_alumno: number;
  incremento_docente: number;
  incremento_familia: number;
  periodo_nota: boolean;
  periodo_matricula: boolean;
  uuid: string;
  is_synced: boolean;
  synced_at: string | null;
  updated_locally_at: string | null;
  version: number;
  created_by: number;
  updated_by: number | null;
  deleted_by: number | null;
  cambios: CambioAuditoria[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CambioAuditoria {
  accion: string;
  usuario_id: number;
  usuario_email?: string;
  fecha: string;
  datos_nuevos?: any;
  datos_anteriores?: any;
}

// Tipo para crear un nuevo período lectivo
export interface CreatePeriodoLectivoRequest {
  nombre: string;
  prefijo_alumno: string;
  prefijo_docente: string;
  prefijo_familia: string;
  prefijo_admin: string;
  incremento_alumno: number;
  incremento_docente: number;
  incremento_familia: number;
  periodo_nota?: boolean;
  periodo_matricula?: boolean;
}

// Tipo para actualizar un período lectivo
export interface UpdatePeriodoLectivoRequest extends CreatePeriodoLectivoRequest {
  id: number;
}

// Tipo para la respuesta paginada de la API
export interface PeriodoLectivoPaginatedResponse {
  current_page: number;
  data: ConfPeriodoLectivo[];
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

// Tipos para respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  last_page: number;
}

// Tipos para filtros de tabla
export interface PeriodoLectivoTableFilters {
  page?: number;
  per_page?: number;
  search?: string;
}

// Tipos para el estado del modal
export interface PeriodoLectivoModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  periodoLectivo?: ConfPeriodoLectivo;
}

export interface DeleteConfirmState {
  isOpen: boolean;
  periodoLectivo?: ConfPeriodoLectivo;
}

// Tipos para parámetros de búsqueda
export interface PeriodoLectivoSearchParams {
  per_page?: number;
  search?: string;
  page?: number;
}

// Tipos para validación
export interface ValidationErrors {
  [key: string]: string[];
}