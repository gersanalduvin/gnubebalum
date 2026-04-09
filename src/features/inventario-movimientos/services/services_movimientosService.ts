import { httpClient } from '@/utils/httpClient';
import type {
    CreateMovimientoData,
    MovimientoFilters,
    MovimientoInventario,
    MovimientosEstadisticas,
    PaginatedMovimientosResponse,
    ResumenStock,
    TipoMovimiento,
    UpdateMovimientoData
} from '../types/types_index';

const API_BASE = '/bk/v1/movimientos-inventario'

class MovimientosService {
  private static inflightRequests = new Map<string, Promise<any>>()

  // Obtener movimientos con paginación y filtros
  static async getMovimientos(params: MovimientoFilters & { page?: number; per_page?: number } = {}): Promise<PaginatedMovimientosResponse> {
    try {
      // Crear clave única para el cache basada en los parámetros
      const cacheKey = JSON.stringify(params)

      // Verificar si ya hay una petición en curso para estos parámetros
      const existing = this.inflightRequests.get(cacheKey)
      if (existing) {
        return await existing
      }

      // Construir URL con parámetros
      const searchParams = new URLSearchParams()

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const url = `${API_BASE}?${searchParams.toString()}`

      const request = (async (): Promise<PaginatedMovimientosResponse> => {
        const response = await httpClient.get<{ success: boolean; data: PaginatedMovimientosResponse; message: string }>(url)
        
        if (response?.data) {
          return response.data
        }

        return {
          current_page: 1,
          data: [],
          first_page_url: '',
          from: 0,
          last_page: 1,
          last_page_url: '',
          links: [],
          next_page_url: undefined,
          path: '',
          per_page: 15,
          prev_page_url: undefined,
          to: 0,
          total: 0
        }
      })()

      this.inflightRequests.set(cacheKey, request)
      try {
        const data = await request
        return data
      } finally {
        this.inflightRequests.delete(cacheKey)
      }
    } catch (error: any) {
      throw MovimientosService.handleError(error)
    }
  }

  // Obtener todos los movimientos sin paginación
  static async getAllMovimientos(params: MovimientoFilters = {}): Promise<MovimientoInventario[]> {
    try {
      const searchParams = new URLSearchParams()

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const url = `${API_BASE}/getall?${searchParams.toString()}`
      const response = await httpClient.get<{ success: boolean; data: MovimientoInventario[]; message: string }>(url)
      return response?.data || []
    } catch (error: any) {
      throw MovimientosService.handleError(error)
    }
  }

  // Obtener movimiento por ID
  static async getMovimientoById(id: number): Promise<MovimientoInventario> {
    try {
      const cacheKey = `movimiento-${id}`
      const existing = this.inflightRequests.get(cacheKey)
      if (existing) return await existing

      const request = (async () => {
        const response = await httpClient.get<{ success: boolean; data: MovimientoInventario; message: string }>(`${API_BASE}/${id}`)
        return response?.data || ({} as MovimientoInventario)
      })()

      this.inflightRequests.set(cacheKey, request)
      try {
        const data = await request
        return data
      } finally {
        this.inflightRequests.delete(cacheKey)
      }
    } catch (error: any) {
      throw MovimientosService.handleError(error)
    }
  }

  // Crear nuevo movimiento
  async createMovimiento(data: CreateMovimientoData): Promise<{ success: boolean; data: MovimientoInventario; message: string; errors?: any }> {
    try {
      const response = await httpClient.post<{ success: boolean; data: MovimientoInventario; message: string }>(`${API_BASE}`, data)
      
      // The response IS the body (httpClient returns parsed JSON)
      const body = response as any
      
      if (body && body.success) {
        return {
          success: body.success,
          data: body.data,
          message: body.message,
          errors: undefined
        }
      } else {
        throw new Error(body?.message || 'Error al crear el movimiento')
      }
    } catch (error: any) {
      // Manejo directo de errores que preserva las validaciones (igual que sección)
      return {
        success: false,
        data: {} as MovimientoInventario,
        message: error.data?.message || error.message || 'Error al crear el movimiento',
        errors: error.data?.errors
      }
    }
  }

  // Crear movimientos masivamentes
  async createMassive(data: { items: any[], observaciones?: string }): Promise<{ success: boolean; count: number; data: MovimientoInventario[]; message: string; errors?: any }> {
    try {
      const response = await httpClient.post<{ success: boolean; count: number; data: MovimientoInventario[]; message: string }>(`${API_BASE}/masivo`, data)
      const body = response as any

      if (body && body.success) {
        return {
          success: body.success,
          count: body.count,
          data: body.data,
          message: body.message,
          errors: undefined
        }
      } else {
        throw new Error(body?.message || 'Error al procesar entrada masiva')
      }
    } catch (error: any) {
        return {
            success: false,
            count: 0,
            data: [],
            message: error.data?.message || error.message || 'Error al procesar entrada masiva',
            errors: error.data?.errors
        }
    }
  }

  // Actualizar movimiento existente
  async updateMovimiento(id: number, data: UpdateMovimientoData): Promise<{ success: boolean; data: MovimientoInventario; message: string; errors?: any }> {
    try {
      const response = await httpClient.put<{ success: boolean; data: MovimientoInventario; message: string }>(`${API_BASE}/${id}`, data)
      
      // The response IS the body
      const body = response as any
      
      if (body && body.success) {
        return {
          success: body.success,
          data: body.data,
          message: body.message,
          errors: undefined
        }
      } else {
        throw new Error(body?.message || 'Error al actualizar el movimiento')
      }
    } catch (error: any) {
      // Manejo directo de errores que preserva las validaciones (igual que sección)
      return {
        success: false,
        data: {} as MovimientoInventario,
        message: error.data?.message || error.message || 'Error al actualizar el movimiento',
        errors: error.data?.errors
      }
    }
  }

  // Eliminar movimiento
  async deleteMovimiento(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await httpClient.delete<{ success: boolean; message: string }>(`${API_BASE}/${id}`)
      return response?.data || { success: false, message: 'Error en la respuesta' }
    } catch (error: any) {
      throw MovimientosService.handleError(error)
    }
  }

  // Obtener movimientos por tipo
  static async getMovimientosByTipo(tipo: TipoMovimiento, params: MovimientoFilters = {}): Promise<MovimientoInventario[]> {
    try {
      const searchParams = new URLSearchParams()

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const url = `${API_BASE}/tipo/${tipo}?${searchParams.toString()}`
      const response = await httpClient.get<{ success: boolean; data: MovimientoInventario[]; message: string }>(url)
      return response?.data || []
    } catch (error: any) {
      throw MovimientosService.handleError(error)
    }
  }

  // Obtener movimientos por producto
  static async getMovimientosByProducto(productoId: number, params: MovimientoFilters = {}): Promise<MovimientoInventario[]> {
    try {
      const searchParams = new URLSearchParams()

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const url = `${API_BASE}/producto/${productoId}?${searchParams.toString()}`
      const response = await httpClient.get<{ success: boolean; data: MovimientoInventario[]; message: string }>(url)
      return response?.data || []
    } catch (error: any) {
      throw MovimientosService.handleError(error)
    }
  }

  // Obtener movimientos por almacén
  static async getMovimientosByAlmacen(almacenId: number, params: MovimientoFilters = {}): Promise<MovimientoInventario[]> {
    try {
      const searchParams = new URLSearchParams()

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const url = `${API_BASE}/almacen/${almacenId}?${searchParams.toString()}`
      const response = await httpClient.get<{ success: boolean; data: MovimientoInventario[]; message: string }>(url)
      return response?.data || []
    } catch (error: any) {
      throw MovimientosService.handleError(error)
    }
  }

  // Obtener movimientos por usuario
  static async getMovimientosByUsuario(usuarioId: number, params: MovimientoFilters = {}): Promise<MovimientoInventario[]> {
    try {
      const searchParams = new URLSearchParams()

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const url = `${API_BASE}/usuario/${usuarioId}?${searchParams.toString()}`
      const response = await httpClient.get<{ success: boolean; data: MovimientoInventario[]; message: string }>(url)
      return response?.data || []
    } catch (error: any) {
      throw MovimientosService.handleError(error)
    }
  }

  // Obtener movimientos por rango de fechas
  static async getMovimientosByFechas(fechaDesde: string, fechaHasta: string, params: MovimientoFilters = {}): Promise<MovimientoInventario[]> {
    try {
      const searchParams = new URLSearchParams()

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      searchParams.append('fecha_desde', fechaDesde)
      searchParams.append('fecha_hasta', fechaHasta)

      const url = `${API_BASE}/fechas?${searchParams.toString()}`
      const response = await httpClient.get<{ success: boolean; data: MovimientoInventario[]; message: string }>(url)
      return response?.data || []
    } catch (error: any) {
      throw MovimientosService.handleError(error)
    }
  }

  // Recalcular stock historial
  async recalculateStock(productoId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await httpClient.post<{ success: boolean; message: string }>(`${API_BASE}/sync/recalcular`, { producto_id: productoId })
      const body = response as any
      return body || { success: false, message: 'Error en la respuesta' }
    } catch (error: any) {
      throw MovimientosService.handleError(error)
    }
  }

  // Buscar movimientos
  static async searchMovimientos(params: {
    q?: string;
    numero_documento?: string;
    observaciones?: string;
    tipo_movimiento?: TipoMovimiento;
    producto_nombre?: string
  }): Promise<MovimientoInventario[]> {
    try {
      const searchParams = new URLSearchParams()

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const url = `${API_BASE}/search?${searchParams.toString()}`
      const response = await httpClient.get<{ success: boolean; data: MovimientoInventario[]; message: string }>(url)
      return response?.data || []
    } catch (error: any) {
      throw MovimientosService.handleError(error)
    }
  }

  // Obtener estadísticas de movimientos
  static async getEstadisticas(): Promise<MovimientosEstadisticas> {
    try {
      const response = await httpClient.get<{ success: boolean; data: MovimientosEstadisticas; message: string }>(`${API_BASE}/estadisticas`)
      return response?.data || {
        total_movimientos: 0,
        movimientos_por_tipo: {
          entrada: 0,
          salida: 0,
          ajuste_positivo: 0,
          ajuste_negativo: 0,
          transferencia: 0
        },
        valor_total_movimientos: {
          USD: '0.00',
          NIO: '0.00'
        },
        movimientos_mes_actual: 0,
        productos_con_movimientos: 0
      }
    } catch (error: any) {
      throw MovimientosService.handleError(error)
    }
  }

  // Obtener resumen de stock
  static async getResumenStock(): Promise<ResumenStock[]> {
    try {
      const response = await httpClient.get<{ success: boolean; data: ResumenStock[]; message: string }>(`${API_BASE}/stock`)
      return response?.data || []
    } catch (error: any) {
      throw MovimientosService.handleError(error)
    }
  }

  // Validar movimiento
  async validateMovimiento(data: CreateMovimientoData): Promise<{ success: boolean; message: string; errors?: any }> {
    try {
      const response = await httpClient.post<{ success: boolean; message: string; errors?: any }>(`${API_BASE}/validate`, data)
      return response?.data || { success: false, message: 'Error en la validación' }
    } catch (error: any) {
      throw MovimientosService.handleError(error)
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

    if (error.status === 403) {
      return new Error('No tiene permisos para realizar esta acción.')
    }

    if (error.status === 404) {
      return new Error('Recurso no encontrado.')
    }

    if (error.status === 422) {
      // Error de validación
      const errorData = error.data || {}
      const message = errorData.message || 'Error de validación'
      const validationError = new Error(message) as any
      validationError.errors = errorData.errors || {}
      validationError.status = 422
      validationError.data = errorData
      return validationError
    }

    if (error.status >= 500) {
      return new Error('Error interno del servidor. Por favor, intente más tarde.')
    }

    // El httpClient lanza errores con la estructura: { status, statusText, data }
    const errorData = error.data || {}
    return new Error(errorData.message || error.statusText || 'Error desconocido')
  }
}

// Exportar instancia singleton
const movimientosService = new MovimientosService()
export { MovimientosService };
export default movimientosService
