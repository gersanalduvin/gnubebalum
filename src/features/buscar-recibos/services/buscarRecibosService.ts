import { httpClient } from '@/utils/httpClient'
import type { ApiResponse, Paginator, ReciboItem } from '../types'

class BuscarRecibosService {
  private readonly baseUrl = '/bk/v1/buscar-recibos'

  async listar(params: {
    numero_recibo?: string
    nombre_usuario?: string
    fecha_inicio?: string
    fecha_fin?: string
    page?: number
    per_page?: number
  }): Promise<ApiResponse<Paginator<ReciboItem[]>>> {
    const query = new URLSearchParams()
    if (params.numero_recibo) query.set('numero_recibo', params.numero_recibo)
    if (params.nombre_usuario) query.set('nombre_usuario', params.nombre_usuario)
    if (params.fecha_inicio) query.set('fecha_inicio', params.fecha_inicio)
    if (params.fecha_fin) query.set('fecha_fin', params.fecha_fin)
    if (params.page) query.set('page', String(params.page))
    if (params.per_page) query.set('per_page', String(params.per_page))
    const response = await httpClient.get<any>(`${this.baseUrl}?${query.toString()}`)
    return response as ApiResponse<Paginator<ReciboItem[]>>
  }

  async anular(id: number): Promise<ApiResponse<ReciboItem>> {
    const response = await httpClient.put<any>(`${this.baseUrl}/${id}/anular`)
    return response as unknown as ApiResponse<ReciboItem>
  }

  async imprimir(id: number): Promise<Blob> {
    const response = await httpClient.get<any>(`${this.baseUrl}/${id}/imprimir`, {
      headers: { Accept: 'application/pdf' }
    })
    return response.data
  }

  async eliminar(id: number): Promise<ApiResponse<any>> {
    // La eliminación se hace a través de la ruta de recibos (ReciboController)
    const response = await httpClient.delete<any>(`/bk/v1/recibos/${id}`)
    return response as unknown as ApiResponse<any>
  }
}

export const buscarRecibosService = new BuscarRecibosService()
