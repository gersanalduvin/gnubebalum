import { httpClient } from '@/utils/httpClient'
import type {
    ApiResponse,
    CategoriaArbolResponse,
    CategoriaEstadisticasResponse,
    CategoriaPaginatedResponse,
    CategoriaSearchParams,
    CreateCategoriaRequest,
    InventarioCategoria,
    SyncCategoriaRequest,
    SyncResponse,
    UpdateCategoriaRequest
} from '../types/types_index'

class CategoriasService {
  private readonly baseEndpoint = '/bk/v1/inventario-categorias'

  // Obtener categorías con paginación
  async getCategorias(params: CategoriaSearchParams = {}): Promise<CategoriaPaginatedResponse> {
    try {
      const queryParams = new URLSearchParams()

      if (params.per_page) {
        queryParams.append('per_page', params.per_page.toString())
      }

      if (params.search) {
        queryParams.append('search', params.search)
      }

      if (params.activo !== undefined) {
        queryParams.append('activo', params.activo.toString())
      }

      if (params.categoria_padre_id) {
        queryParams.append('categoria_padre_id', params.categoria_padre_id.toString())
      }

      const url = queryParams.toString()
        ? `${this.baseEndpoint}?${queryParams.toString()}`
        : this.baseEndpoint

      const response = await httpClient.get<any>(url)
      return response as CategoriaPaginatedResponse
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Obtener todas las categorías sin paginación
  async getAllCategorias(): Promise<InventarioCategoria[]> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/all/list`)
      return response?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Obtener árbol de categorías
  async getArbolCategorias(): Promise<InventarioCategoria[]> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/arbol`)
      const apiResponse = response?.data as CategoriaArbolResponse
      return apiResponse?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Obtener categoría por ID
  async getCategoriaById(id: number): Promise<InventarioCategoria> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/${id}`)
      const apiResponse = response?.data as unknown as ApiResponse<InventarioCategoria>
      return apiResponse?.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Obtener categoría por código
  async getCategoriaByCodigo(codigo: string): Promise<InventarioCategoria> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/codigo/${codigo}`)
      const apiResponse = response?.data as unknown as ApiResponse<InventarioCategoria>
      return apiResponse?.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Crear nueva categoría
  async createCategoria(data: CreateCategoriaRequest): Promise<ApiResponse<InventarioCategoria>> {
    try {
      const response = await httpClient.post<any>(this.baseEndpoint, data)
      return response as ApiResponse<InventarioCategoria>
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Actualizar categoría
  async updateCategoria(id: number, data: UpdateCategoriaRequest): Promise<ApiResponse<InventarioCategoria>> {
    try {
      const response = await httpClient.put<any>(`${this.baseEndpoint}/${id}`, data)
      return response as ApiResponse<InventarioCategoria>
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Eliminar categoría
  async deleteCategoria(id: number): Promise<void> {
    try {
      await httpClient.delete(`${this.baseEndpoint}/${id}`)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Obtener estadísticas de categorías
  async getEstadisticas(): Promise<CategoriaEstadisticasResponse['data']> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/estadisticas`)
      const apiResponse = response?.data as CategoriaEstadisticasResponse
      return apiResponse?.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Sincronizar categorías
  async syncCategorias(data: SyncCategoriaRequest): Promise<SyncResponse> {
    try {
      const response = await httpClient.post<any>(`${this.baseEndpoint}/sync`, data)
      return response?.data as SyncResponse
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Obtener categorías no sincronizadas
  async getCategoriasNoSincronizadas(): Promise<InventarioCategoria[]> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/no-sincronizadas`)
      const apiResponse = response?.data as ApiResponse<InventarioCategoria[]>
      return apiResponse?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Obtener categorías actualizadas después de una fecha
  async getCategoriasActualizadasDespues(fecha: string): Promise<InventarioCategoria[]> {
    try {
      const response = await httpClient.get<any>(`${this.baseEndpoint}/actualizadas-despues/${fecha}`)
      const apiResponse = response?.data as ApiResponse<InventarioCategoria[]>
      return apiResponse?.data || []
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Marcar categoría como sincronizada
  async marcarComoSincronizada(uuid: string): Promise<void> {
    try {
      await httpClient.patch(`${this.baseEndpoint}/marcar-sincronizada/${uuid}`)
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Manejo de errores
  private handleError(error: any): Error {
    if (error?.status === 401) {
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

    if (error?.status === 403) {
      return new Error('No tienes permisos para realizar esta acción')
    }

    if (error?.status === 422) {
      // Errores de validación
      const validationErrors = error?.data?.errors || {}
      const firstError = Object.values(validationErrors)[0] as string[]
      return new Error(firstError?.[0] || 'Error de validación')
    }

    if (error?.status === 404) {
      return new Error('Categoría no encontrada')
    }

    if (error?.status >= 500) {
      return new Error('Error interno del servidor')
    }

    return new Error(error?.data?.message || 'Error desconocido')
  }
}

const categoriasService = new CategoriasService()
export default categoriasService
