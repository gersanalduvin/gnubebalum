import { httpClient } from '@/utils/httpClient'
import type {
    Alumno,
    ApiResponse,
    ArancelCatalogo,
    CreateReciboRequest,
    FormaPagoCatalogo,
    ProductoCatalogo,
    Recibo
} from '../types'

const base = '/bk/v1/recibos'

const recibosService = {
  async searchAlumnos(q: string, limit = 20): Promise<ApiResponse<Alumno[]>> {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    params.set('limit', String(Math.max(1, Math.min(100, limit))))
    return httpClient.get(`${base}/alumnos/search?${params.toString()}`)
  },

  async getCatalogoProductos(q: string): Promise<ApiResponse<ProductoCatalogo[]>> {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    return httpClient.get(`${base}/catalogos/productos?${params.toString()}`)
  },

  async getCatalogoAranceles(q: string): Promise<ApiResponse<ArancelCatalogo[]>> {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    return httpClient.get(`${base}/catalogos/aranceles?${params.toString()}`)
  },

  async getFormasPago(q?: string): Promise<ApiResponse<FormaPagoCatalogo[]>> {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    return httpClient.get(`${base}/catalogos/formas-pago?${params.toString()}`)
  },

  async createRecibo(payload: CreateReciboRequest): Promise<ApiResponse<Recibo>> {
    try {
      const response = await httpClient.post<Recibo>(`${base}`, payload)
      return {
        success: true,
        data: response.data!,
        message: response.message || 'Recibo creado exitosamente',
        errors: response.errors
      }
    } catch (error: any) {
      const errorData = error.data || {}
      return {
        success: false,
        data: {} as Recibo,
        message: errorData.message || error.message || 'Error al crear el recibo',
        errors: errorData.errors
      }
    }
  },

  async imprimirPDF(id: number): Promise<{ data: Blob } | ApiResponse<any>> {
    return httpClient.get(`${base}/${id}/pdf`)
  },

  async anularRecibo(id: number): Promise<ApiResponse<{ id: number; estado: string }>> {
    try {
      const response = await httpClient.put<{ id: number; estado: string }>(`${base}/${id}/anular`)
      return {
        success: true,
        data: response.data!,
        message: response.message || 'Recibo anulado exitosamente',
        errors: response.errors
      }
    } catch (error: any) {
      const errorData = error.data || {}
      return {
        success: false,
        data: { id: id, estado: 'anulado' },
        message: errorData.message || error.message || 'Error al anular el recibo',
        errors: errorData.errors
      }
    }
  }
  ,
  async getPeriodosPlanesPago(periodo_lectivo_id?: number): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (periodo_lectivo_id) params.set('periodo_lectivo_id', String(periodo_lectivo_id))
    return httpClient.get(`${base}/catalogos/periodos-planes-pago?${params.toString()}`)
  }
  ,
  async crearAlumnoConPlan(payload: {
    email?: string
    primer_nombre: string
    segundo_nombre?: string
    primer_apellido: string
    segundo_apellido?: string
    fecha_nacimiento?: string
    sexo: 'M' | 'F'
    plan_pago_id?: number
  }): Promise<ApiResponse<{ alumno: any; plan_pago_aplicacion: any }>> {
    try {
      const response = await httpClient.post(`${base}/alumnos`, payload)
      return {
        success: true,
        data: response.data as any,
        message: response.message || 'Alumno creado exitosamente',
        errors: response.errors
      }
    } catch (error: any) {
      const errorData = error.data || {}
      return {
        success: false,
        data: {} as any,
        message: errorData.message || error.message || 'Error al crear alumno',
        errors: errorData.errors
      }
    }
  }
  ,
  async getParametrosCaja(): Promise<ApiResponse<any>> {
    return httpClient.get(`${base}/catalogos/parametros-caja`)
  }
}

export default recibosService
