import { httpClient } from '@/utils/httpClient'

// Define the Event type based on backend model
export interface AgendaEvent {
  id?: number
  title: string
  description?: string
  start_date: string
  end_date: string
  location?: string
  color?: string
  all_day?: boolean
  event_url?: string
  created_by?: number
  created_at?: string
  updated_at?: string
  grupos?: any[]
  grupos_ids?: number[]
}

// Map frontend params to backend expected params
// FullCalendar sends 'start' and 'end' as ISO strings
export const getEvents = async (start: string, end: string) => {
  const response: any = await httpClient.get(`/bk/v1/agenda/eventos?start=${start}&end=${end}`)
  return response.data
}

export const createEvent = async (event: Omit<AgendaEvent, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'grupos'>) => {
  const response: any = await httpClient.post('/bk/v1/agenda/eventos', event)
  return response.data
}

export const updateEvent = async (id: number, event: Partial<AgendaEvent>) => {
  const response: any = await httpClient.put(`/bk/v1/agenda/eventos/${id}`, event)
  return response.data
}

export const deleteEvent = async (id: number) => {
  const response: any = await httpClient.delete(`/bk/v1/agenda/eventos/${id}`)
  return response.data
}

export const getAgendaGruposDisponibles = async () => {
  const response: any = await httpClient.get('/bk/v1/agenda/grupos-disponibles')
  return response.data
}
