import { httpClient } from '@/utils/httpClient'
import type { ConfigGrado, ConfigGradoFormData, ConfigGradoResponse, ConfigGradoFilters, ModalidadOption } from '../types'

const API_BASE = '/bk/v1/config-grado'

export const configGradoService = {
  // Obtener lista paginada
  getAll: async (page: number = 1, filters: ConfigGradoFilters = {}): Promise<ConfigGradoResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      ...(filters.search && { search: filters.search })
    })

    const response = await httpClient.get(`${API_BASE}?${params}`)
    // El backend devuelve { success: true, data: { current_page, data: [...], ... } }
    // Necesitamos extraer la estructura de paginación
    return response.data
  },

  // Obtener por ID
  getById: async (id: number): Promise<ConfigGrado> => {
    const response = await httpClient.get(`${API_BASE}/${id}`)
    return response.data
  },

  // Crear nuevo
  create: async (data: ConfigGradoFormData): Promise<ConfigGrado> => {
    const response = await httpClient.post(API_BASE, data)
    return response.data
  },

  // Actualizar
  update: async (id: number, data: ConfigGradoFormData): Promise<ConfigGrado> => {
    const response = await httpClient.put(`${API_BASE}/${id}`, data)
    return response.data
  },

  // Eliminar
  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`${API_BASE}/${id}`)
  },

  // Obtener opciones de modalidades
  getModalidadesOptions: async (): Promise<ModalidadOption[]> => {
    const response = await httpClient.get(`${API_BASE}/opciones/modalidades`)
    // El httpClient retorna el JSON del backend directamente: { success, data }
    // Debemos devolver el arreglo en response.data
    return response.data || []
  }
}
