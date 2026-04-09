import { httpClient } from '@/utils/httpClient'

export interface Task {
  id: number
  nombre: string
  descripcion?: string
  fecha_entrega?: string
  puntaje_maximo?: number
  evidencia_id?: number
  entrega_en_linea: boolean
  tipo: 'acumulado' | 'examen'
  realizada_en?: 'Aula' | 'Casa'
  archivos: any[]
  links?: string[]
  estudiantes?: any[]
  indicador?: any
}

export const getTasks = async (assignmentId: number, corteId: number) => {
  const response = await httpClient.get<Task[]>(`/bk/v1/tareas/asignacion/${assignmentId}/corte/${corteId}`)
  return response || []
}

export const createTask = async (payload: FormData) => {
  // Using FormData for file uploads
  const response = await httpClient.post<any>('/bk/v1/tareas', payload)
  return response
}

export const updateTask = async (id: number, payload: FormData) => {
  const response = await httpClient.post<any>(`/bk/v1/tareas/${id}`, payload)
  return response
}

export const deleteTask = async (id: number) => {
  const response = await httpClient.delete<any>(`/bk/v1/tareas/${id}`)
  return response
}
