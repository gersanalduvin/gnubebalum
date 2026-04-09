import { httpClient } from '@/utils/httpClient'
import type { ApiResponse, ResumenResponse, MonedasResponse, GuardarRequest, GuardarResponse } from '../types'

class ArqueoCajaService {
  private readonly baseUrl = '/bk/v1/reportes/arqueo-caja'

  async getResumen(params: { fecha?: string; desde?: string; hasta?: string }): Promise<ApiResponse<ResumenResponse>> {
    const query = new URLSearchParams()
    if (params.fecha) query.set('fecha', params.fecha)
    if (!params.fecha) {
      if (params.desde) query.set('desde', params.desde)
      if (params.hasta) query.set('hasta', params.hasta)
    }
    const response = await httpClient.get<any>(`${this.baseUrl}/resumen?${query.toString()}`)
    return response as ApiResponse<ResumenResponse>
  }

  async getMonedas(): Promise<ApiResponse<MonedasResponse>> {
    const response = await httpClient.get<any>(`${this.baseUrl}/monedas`)
    return response as ApiResponse<MonedasResponse>
  }

  async guardar(data: GuardarRequest): Promise<ApiResponse<GuardarResponse>> {
    const response = await httpClient.post<GuardarResponse>(`${this.baseUrl}/guardar`, data)
    return response as unknown as ApiResponse<GuardarResponse>
  }

  async imprimirDetallesPdf(id: number): Promise<Blob> {
    const response = await httpClient.get<any>(`${this.baseUrl}/detalles/${id}/pdf`, { headers: { Accept: 'application/pdf' } })
    return response.data
  }
}

export const arqueoCajaService = new ArqueoCajaService()
