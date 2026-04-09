import { httpClient } from '@/utils/httpClient'

export interface Student {
  id: number
  nombre_completo: string
  codigo_unico: string
  grado?: string
  seccion?: string
  foto_url?: string
}

export interface Task {
  id?: number
  nombre: string
  descripcion?: string
  asignatura_nombre?: string
  fecha: string | null
  fecha_entrega?: string | null
  puntaje_maximo: number
  nota_estudiante?: number | null
  nota_cualitativa?: string | null
  observacion?: string | null
  retroalimentacion?: string | null
  corte_nombre?: string
  realizada_en?: string | null
  archivos?: any[]
  links?: any[]
  is_daily?: boolean
  indicadores_logrados?: Record<string, boolean>
}

export interface Corte {
  corte_id: number
  nombre: string
  acumulado: number
  examen: number
  total: number
  escala: string
  observacion?: string
  tareas: Task[]
  publicacion_inicio?: string | null
  publicacion_fin?: string | null
  orden: number
}

export interface Grade {
  asignatura: string
  promedio_final: number
  es_inicial: boolean
  cortes: Corte[]
  todas_tareas: Task[]
}

export interface Attendance {
  fecha: string
  estado: 'presente' | 'ausente' | 'tardanza' | 'justificado'
  observacion?: string
}

export interface ScheduleItem {
  dia: string
  hora_inicio: string
  hora_fin: string
  materia: string
  aula?: string
}

export interface AccountStatus {
  id: number
  concepto: string
  monto: number
  pagado: number
  saldo: number
  fecha_vencimiento: string
  estado: 'pendiente' | 'pagado' | 'parcial'
}

export interface MaterialResource {
  id: number
  titulo: string
  descripcion?: string
  tipo: 'archivo' | 'enlace'
  contenido?: string
  fecha: string
  corte_id?: number
  corte_nombre: string
  asignatura_id: number
  asignatura_nombre: string
  archivos: {
    id: number
    nombre: string
    url: string
    tipo_mime: string
    size: number
  }[]
}

const BASE = '/bk/v1/familias'

const parentService = {
  getMyChildren: async (): Promise<Student[]> => {
    const res: any = await httpClient.get(`${BASE}/hijos`)
    return res?.data || (Array.isArray(res) ? res : [])
  },

  getChildGrades: async (studentId: number): Promise<Grade[]> => {
    const res: any = await httpClient.get(`${BASE}/hijos/${studentId}/notas`)
    return res?.data || (Array.isArray(res) ? res : [])
  },

  getChildAttendance: async (studentId: number): Promise<Attendance[]> => {
    const res: any = await httpClient.get(`${BASE}/hijos/${studentId}/asistencias`)
    return res?.data || (Array.isArray(res) ? res : [])
  },

  getChildSchedule: async (studentId: number): Promise<ScheduleItem[]> => {
    const res: any = await httpClient.get(`${BASE}/hijos/${studentId}/horario`)
    return res?.data || (Array.isArray(res) ? res : [])
  },

  getChildAccountStatus: async (studentId: number): Promise<AccountStatus[]> => {
    const res: any = await httpClient.get(`${BASE}/hijos/${studentId}/estado-cuenta`)
    return res?.data || (Array.isArray(res) ? res : [])
  },

  getChildResources: async (studentId: number): Promise<MaterialResource[]> => {
    const res: any = await httpClient.get(`${BASE}/hijos/${studentId}/recursos`)
    return res?.data || (Array.isArray(res) ? res : [])
  }
}

export default parentService
