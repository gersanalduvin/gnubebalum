import { httpClient } from '@/utils/httpClient'
import type {
    ApiResponse,
    CategoriaOption,
    CreateProductoRequest,
    CuentaContableOption,
    InventarioProducto,
    PaginatedResponse,
    ProductoSearchParams,
    UpdateProductoRequest,
    UpdateStockRequest
} from '../types/types_index'

const API_BASE = '/bk/v1/productos'

class ProductosService {
  // Cache para evitar múltiples peticiones simultáneas
  private static inflightProducts: Map<string, Promise<PaginatedResponse<InventarioProducto>>> = new Map()
  private static inflightProductById: Map<number, Promise<InventarioProducto>> = new Map()
  private static inflightCategorias: Promise<CategoriaOption[]> | null = null
  private static inflightCuentas: Promise<CuentaContableOption[]> | null = null
  private readonly baseEndpoint = API_BASE

  // Obtener productos con paginación y filtros
  static async getProductos(params: ProductoSearchParams = {}): Promise<PaginatedResponse<InventarioProducto>> {
    try {
      // Crear clave única para el cache basada en los parámetros
      const cacheKey = JSON.stringify(params)
      
      // Verificar si ya hay una petición en curso para estos parámetros
      const existing = this.inflightProducts.get(cacheKey)
      if (existing) {
        return await existing
      }

      // Construir URL con parámetros
      const searchParams = new URLSearchParams()
      
      if (params.page) {
        searchParams.append('page', params.page.toString())
      }
      
      if (params.per_page) {
        searchParams.append('per_page', params.per_page.toString())
      }
      
      if (params.search) {
        searchParams.append('search', params.search)
      }
      
      if (params.categoria_id) {
        searchParams.append('categoria_id', params.categoria_id.toString())
      }
      
      if (params.activo !== undefined) {
        searchParams.append('activo', params.activo.toString())
      }
      
      if (params.stock_bajo !== undefined) {
        searchParams.append('stock_bajo', params.stock_bajo.toString())
      }
      
      if (params.moneda !== undefined) {
        searchParams.append('moneda', params.moneda.toString())
      }

      const url = `${API_BASE}?${searchParams.toString()}`

      const request = (async (): Promise<PaginatedResponse<InventarioProducto>> => {
        const response = await httpClient.get<any>(url)
        // El httpClient envuelve la respuesta en { data: ... }, y el backend devuelve { success: true, data: PaginatedResponse, message: string }
        return response?.data || { 
          data: [], 
          total: 0, 
          per_page: 10, 
          current_page: 1, 
          last_page: 1,
          first_page_url: '',
          from: 0,
          last_page_url: '',
          links: [],
          next_page_url: undefined,
          path: '',
          prev_page_url: undefined,
          to: 0
        } as PaginatedResponse<InventarioProducto>
      })()

      // Guardar la promesa en el cache
      this.inflightProducts.set(cacheKey, request)

      try {
        const data = await request
        return data
      } finally {
        // Limpiar el cache después de completar la petición
        this.inflightProducts.delete(cacheKey)
      }
    } catch (error: any) {
      throw ProductosService.handleError(error)
    }
  }

  // Obtener todos los productos sin paginación
  static async getAllProductos(): Promise<InventarioProducto[]> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/getall`)
      return response?.data || []
    } catch (error: any) {
      throw ProductosService.handleError(error)
    }
  }

  // Obtener producto por ID
  static async getProductoById(id: number): Promise<InventarioProducto> {
    try {
      const existing = this.inflightProductById.get(id)
      if (existing) return await existing

      const request = (async () => {
        const response = await httpClient.get<any>(`${API_BASE}/${id}`)
        return response?.data || ({} as InventarioProducto)
      })()

      this.inflightProductById.set(id, request)
      try {
        const data = await request
        return data
      } finally {
        this.inflightProductById.delete(id)
      }
    } catch (error: any) {
      throw ProductosService.handleError(error)
    }
  }

  // Crear nuevo producto
  async createProducto(data: CreateProductoRequest): Promise<ApiResponse<InventarioProducto>> {
    try {
       const response = await httpClient.post<any>(`${API_BASE}`, data)
       return response as unknown as ApiResponse<InventarioProducto>
     } catch (error: any) {
       throw ProductosService.handleError(error)
     }
   }

  // Actualizar producto existente
  async updateProducto(id: number, data: UpdateProductoRequest): Promise<ApiResponse<InventarioProducto>> {
    try {
       const response = await httpClient.put<any>(`${API_BASE}/${id}`, data)
       return response as unknown as ApiResponse<InventarioProducto>
     } catch (error: any) {
       throw ProductosService.handleError(error)
     }
   }

  // Eliminar producto
  async deleteProducto(id: number): Promise<ApiResponse<null>> {
    try {
       const response = await httpClient.delete<any>(`${API_BASE}/${id}`)
       return response as unknown as ApiResponse<null>
     } catch (error: any) {
       throw ProductosService.handleError(error)
     }
   }

  // Buscar productos por código
  async buscarPorCodigo(codigo: string): Promise<InventarioProducto[]> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/buscar/codigo?codigo=${codigo}`)
      return response?.data || []
    } catch (error: any) {
      throw ProductosService.handleError(error)
    }
  }

  // Buscar productos por nombre
  async buscarPorNombre(nombre: string): Promise<InventarioProducto[]> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/buscar/nombre?nombre=${nombre}`)
      return response?.data || []
    } catch (error: any) {
      throw ProductosService.handleError(error)
    }
  }

  // Obtener productos con stock bajo
  async getProductosStockBajo(stockMinimo?: number): Promise<InventarioProducto[]> {
    try {
      const url = stockMinimo 
        ? `${API_BASE}/stock/bajo?stock_minimo=${stockMinimo}`
        : `${API_BASE}/stock/bajo`
      
      const response = await httpClient.get<any>(url)
      return response?.data || []
    } catch (error: any) {
      throw ProductosService.handleError(error)
    }
  }

  // Actualizar stock de un producto
  async updateStock(id: number, data: UpdateStockRequest): Promise<ApiResponse<InventarioProducto>> {
    try {
       const response = await httpClient.put<any>(`${API_BASE}/${id}/stock`, data)
       return response as unknown as ApiResponse<InventarioProducto>
     } catch (error: any) {
       throw ProductosService.handleError(error)
     }
   }

  // Obtener productos activos
  async getProductosActivos(): Promise<InventarioProducto[]> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/estado/activos`)
      return response?.data || []
    } catch (error: any) {
      throw ProductosService.handleError(error)
    }
  }

  // Obtener productos no sincronizados
  async getProductosNoSincronizados(): Promise<InventarioProducto[]> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/sync/no-sincronizados`)
      return response?.data || []
    } catch (error: any) {
      throw ProductosService.handleError(error)
    }
  }

  // Marcar producto como sincronizado
  async marcarComoSincronizado(uuid: string): Promise<void> {
    try {
      await httpClient.post(`${API_BASE}/sync/marcar-sincronizado`, { uuid })
    } catch (error: any) {
      throw ProductosService.handleError(error)
    }
  }

  // Obtener productos actualizados después de una fecha
  async getProductosActualizadosDespues(fecha: string): Promise<InventarioProducto[]> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/sync/actualizados-despues?fecha=${fecha}`)
      return response?.data || []
    } catch (error: any) {
      throw ProductosService.handleError(error)
    }
  }

  // Obtener cambios de auditoría de un producto
  async getCambiosAuditoria(productoId: number): Promise<any[]> {
    try {
      const response = await httpClient.get<any>(`${API_BASE}/${productoId}/auditoria`)
      return response?.data || []
    } catch (error: any) {
      throw ProductosService.handleError(error)
    }
  }

  // Obtener categorías disponibles
  static async getCategorias(): Promise<CategoriaOption[]> {
    try {
      // Usar cache para evitar múltiples peticiones
      if (this.inflightCategorias) {
        return await this.inflightCategorias
      }

      this.inflightCategorias = (async () => {
        const response = await httpClient.get<any>(`${API_BASE}/categorias`)
        return response?.data || []
      })()

      try {
        const data = await this.inflightCategorias
        return data
      } finally {
        // Limpiar cache después de 5 minutos
        setTimeout(() => {
          this.inflightCategorias = null
        }, 5 * 60 * 1000)
      }
    } catch (error: any) {
      this.inflightCategorias = null
      throw ProductosService.handleError(error)
    }
  }

  // Obtener cuentas contables disponibles
  static async getCuentasContables(): Promise<CuentaContableOption[]> {
    try {
      // Usar cache para evitar múltiples peticiones
      if (this.inflightCuentas) {
        return await this.inflightCuentas
      }

      this.inflightCuentas = (async () => {
        const response = await httpClient.get<any>(`${API_BASE}/catalogo-cuentas`)
        return response?.data || []
      })()

      try {
        const data = await this.inflightCuentas
        return data
      } finally {
        // Limpiar cache después de 5 minutos
        setTimeout(() => {
          this.inflightCuentas = null
        }, 5 * 60 * 1000)
      }
    } catch (error: any) {
      this.inflightCuentas = null
      throw ProductosService.handleError(error)
    }
  }

  // Previsualizar PDF
  async previewPdf(params: ProductoSearchParams = {}): Promise<void> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    
    // Request as blob via httpClient
    const response: any = await httpClient.get(`${API_BASE}/export/pdf?${searchParams.toString()}`)
    const blob = response.data 

    // Open in new tab
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
    // Note: We can't revoke the object URL immediately if we want the new tab to load it, 
    // but browsers usually handle cleanup. For strictness, one might use a timeout.
    setTimeout(() => window.URL.revokeObjectURL(url), 60000) 
  }

  // Descargar PDF
  async downloadPdf(params: ProductoSearchParams = {}): Promise<void> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    
    const response: any = await httpClient.get(`${API_BASE}/export/pdf?${searchParams.toString()}`)
    const blob = response.data 
    this.downloadBlob(blob, 'productos.pdf')
  }

  // Exportar PDF (Legacy alias for download)
  async exportPdf(params: ProductoSearchParams = {}): Promise<void> {
    return this.downloadPdf(params)
  }

  // Exportar Excel
  async exportExcel(params: ProductoSearchParams = {}): Promise<void> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    
    // Request as blob via httpClient
    const response: any = await httpClient.get(`${API_BASE}/export/excel?${searchParams.toString()}`)
           const blob = response.data
    this.downloadBlob(blob, `productos_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Helper para descargar Blob
  private downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  // Método auxiliar para crear o actualizar producto
  async saveProducto(data: CreateProductoRequest | UpdateProductoRequest, id?: number): Promise<ApiResponse<InventarioProducto>> {
    if (id) {
      return await this.updateProducto(id, data as UpdateProductoRequest)
    } else {
      return await this.createProducto(data as CreateProductoRequest)
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
      return validationError
    }

    if (error.status >= 500) {
      return new Error('Error interno del servidor. Por favor, intente más tarde.')
    }

    // Intentar extraer el mensaje del backend si existe
    const errorData = error.data || {}
    const backendMessage = errorData.message || error.message
    
    return new Error(backendMessage || 'Error desconocido')
  }
}

export { ProductosService }
const productosService = new ProductosService()
export default productosService
