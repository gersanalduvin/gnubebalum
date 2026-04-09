import { httpClient } from '@/utils/httpClient'
import type { Almacen, CreateAlmacenData, UpdateAlmacenData } from '../types/types_index'

const API_BASE = '/bk/v1/almacenes'

class AlmacenesService {
  // Obtener todos los almacenes
  async getAllAlmacenes(): Promise<Almacen[]> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/getall`)
      return response?.data || []
    } catch (error: any) {
      throw AlmacenesService.handleError(error)
    }
  }

  // Obtener almacén por ID
  async getAlmacenById(id: number): Promise<Almacen> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/${id}`)
      return response.data || {} as Almacen
    } catch (error: any) {
      throw AlmacenesService.handleError(error)
    }
  }

  // Crear nuevo almacén
  async createAlmacen(data: CreateAlmacenData): Promise<Almacen> {
    try {
      const response = await httpClient.post<Almacen>(API_BASE, data)
      return response.data || {} as Almacen
    } catch (error: any) {
      throw AlmacenesService.handleError(error)
    }
  }

  // Actualizar almacén
  async updateAlmacen(id: number, data: UpdateAlmacenData): Promise<Almacen> {
    try {
      const response = await httpClient.put<Almacen>(`${API_BASE}/${id}`, data)
      return response.data || {} as Almacen
    } catch (error: any) {
      throw AlmacenesService.handleError(error)
    }
  }

  // Eliminar almacén
  async deleteAlmacen(id: number): Promise<void> {
    try {
      await httpClient.delete(`${API_BASE}/${id}`)
    } catch (error: any) {
      throw AlmacenesService.handleError(error)
    }
  }

  // Manejo centralizado de errores
  private static handleError(error: any): Error {
    if (error.status === 401) {
      // Token expirado o no válido - solo redirigir si es una llamada API real
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        const isApiCall = error?.config?.url?.includes('/bk/') || true // Asumir API call para servicios
        
        if (!currentPath.includes('/login') && isApiCall) {
          window.location.href = '/auth/login'
        }
      }
      return new Error('Sesión expirada. Por favor, inicie sesión nuevamente.')
    }
    
    return new Error(error?.data?.message || error?.statusText || 'Error desconocido')
  }
}

// Exportar instancia singleton
const almacenesService = new AlmacenesService()
export default almacenesService
