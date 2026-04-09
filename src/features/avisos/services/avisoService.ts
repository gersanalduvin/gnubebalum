import { httpClient } from '@/utils/httpClient'

export interface Aviso {
  id?: number
  user_id?: number
  titulo: string
  contenido: string
  links?: { url: string; label: string }[]
  adjuntos?: { nombre: string; key: string; type: string; size: number; url?: string }[]
  prioridad: 'baja' | 'normal' | 'alta'
  fecha_vencimiento?: string
  para_todos: boolean
  created_at?: string
  updated_at?: string
  user?: any
  destinatarios?: any[]
  leido_por_mi?: boolean
}

export interface AvisoStats {
  id?: number
  titulo?: string
  total_destinatarios: number
  total_lecturas: number
  porcentaje_lectura: number
  detalles: {
    usuario: string
    leido: boolean
    fecha_lectura: string
  }[]
}

// Helper to append data to FormData
const appendToFormData = (formData: FormData, data: any, parentKey?: string) => {
  if (data instanceof File) {
    if (parentKey) formData.append(parentKey, data)
  } else if (Array.isArray(data)) {
    data.forEach((item, index) => {
      const formKey = parentKey ? `${parentKey}[${index}]` : `${index}`
      appendToFormData(formData, item, formKey)
    })
  } else if (data && typeof data === 'object' && !(data instanceof Date)) {
    Object.keys(data).forEach(key => {
      const value = data[key]
      const formKey = parentKey ? `${parentKey}[${key}]` : key
      appendToFormData(formData, value, formKey)
    })
  } else if (data !== null && data !== undefined) {
    let value = String(data)
    if (data instanceof Date) {
      value = data.toISOString()
    } else if (typeof data === 'boolean') {
      value = data ? '1' : '0'
    }
    if (parentKey) formData.append(parentKey, value)
  }
}

export const getAvisos = async () => {
  const response: any = await httpClient.get(`/bk/v1/avisos`)
  return response.data?.data || response.data || []
}

export const markAvisoAsRead = async (id: number) => {
  const response: any = await httpClient.post(`/bk/v1/avisos/${id}/read`)
  return response.data
}

export const getAvisoStatistics = async (id: number) => {
  const response: any = await httpClient.get(`/bk/v1/avisos/${id}/statistics`)
  return response.data?.data || response.data || []
}

export const getAviso = async (id: number) => {
  const response: any = await httpClient.get(`/bk/v1/avisos/${id}`)
  return response.data?.data || response.data
}

export const createAviso = async (data: any) => {
  const formData = new FormData()

  const { adjuntos, ...restData } = data

  // Append files
  if (adjuntos && Array.isArray(adjuntos)) {
    adjuntos.forEach(file => {
      if (file instanceof File) {
        formData.append('adjuntos[]', file)
      }
    })
  }

  appendToFormData(formData, restData)

  const response: any = await httpClient.post('/bk/v1/avisos', formData)
  return response.data
}

export const updateAviso = async (id: number, data: any) => {
  const formData = new FormData()

  // Method spoofing for PHP to handle multipart/form-data with PUT
  formData.append('_method', 'PUT')

  const { adjuntos, ...restData } = data

  if (adjuntos && Array.isArray(adjuntos)) {
    adjuntos.forEach(file => {
      if (file instanceof File) {
        formData.append('adjuntos[]', file)
      }
    })
  }

  appendToFormData(formData, restData)

  const response: any = await httpClient.post(`/bk/v1/avisos/${id}`, formData)
  return response.data
}

export const deleteAviso = async (id: number) => {
  const response: any = await httpClient.delete(`/bk/v1/avisos/${id}`)
  return response.data
}

export const getAvailableGroups = async () => {
  const response = await httpClient.get<any>('/bk/v1/mensajes/grupos')
  const groups = response?.data?.data || response?.data || []
  return groups
}
