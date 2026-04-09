import { httpClient } from '@/utils/httpClient';
import type { ApiListResponse, CierreCajaConceptoItem, CierreCajaDetalle, TipoRecibo } from '../types';

class ReporteCierreCajaService {
  private readonly baseUrl = '/bk/v1/reportes/cierre-caja'

  async getDetalles(params: { tipo: TipoRecibo; fecha_inicio?: string; fecha_fin?: string }): Promise<ApiListResponse<CierreCajaDetalle[]>> {
    const query = new URLSearchParams()
    if (params.tipo) query.set('tipo', params.tipo)
    if (params.fecha_inicio) query.set('fecha_inicio', params.fecha_inicio)
    if (params.fecha_fin) query.set('fecha_fin', params.fecha_fin)

    const response = await httpClient.get<any>(`${this.baseUrl}/detalles?${query.toString()}`)
    return response as ApiListResponse<CierreCajaDetalle[]>
  }

  async getConceptos(params: { tipo: TipoRecibo; fecha_inicio?: string; fecha_fin?: string }): Promise<ApiListResponse<CierreCajaConceptoItem[]>> {
    const query = new URLSearchParams()
    if (params.tipo) query.set('tipo', params.tipo)
    if (params.fecha_inicio) query.set('fecha_inicio', params.fecha_inicio)
    if (params.fecha_fin) query.set('fecha_fin', params.fecha_fin)

    const response = await httpClient.get<any>(`${this.baseUrl}/conceptos?${query.toString()}`)
    return response as ApiListResponse<CierreCajaConceptoItem[]>
  }

  async getPaquetes(params: { tipo: TipoRecibo; fecha_inicio?: string; fecha_fin?: string }): Promise<ApiListResponse<CierreCajaConceptoItem[]>> {
    const query = new URLSearchParams()
    if (params.tipo) query.set('tipo', params.tipo)
    if (params.fecha_inicio) query.set('fecha_inicio', params.fecha_inicio)
    if (params.fecha_fin) query.set('fecha_fin', params.fecha_fin)

    const response = await httpClient.get<any>(`${this.baseUrl}/paquetes?${query.toString()}`)
    return response as ApiListResponse<CierreCajaConceptoItem[]>
  }

  async exportDetallesPdf(params: { tipo: TipoRecibo; fecha_inicio?: string; fecha_fin?: string }): Promise<Blob> {
    const query = new URLSearchParams()
    if (params.tipo) query.set('tipo', params.tipo)
    if (params.fecha_inicio) query.set('fecha_inicio', params.fecha_inicio)
    if (params.fecha_fin) query.set('fecha_fin', params.fecha_fin)
    const response = await httpClient.get<any>(`${this.baseUrl}/detalles/pdf?${query.toString()}`, { headers: { Accept: 'application/pdf' } })
    return response.data
  }

  async exportConceptosPdf(params: { tipo: TipoRecibo; fecha_inicio?: string; fecha_fin?: string }): Promise<Blob> {
    const query = new URLSearchParams()
    if (params.tipo) query.set('tipo', params.tipo)
    if (params.fecha_inicio) query.set('fecha_inicio', params.fecha_inicio)
    if (params.fecha_fin) query.set('fecha_fin', params.fecha_fin)
    const response = await httpClient.get<any>(`${this.baseUrl}/conceptos/pdf?${query.toString()}`, { headers: { Accept: 'application/pdf' } })
    return response.data
  }

  async exportPaquetesPdf(params: { tipo: TipoRecibo; fecha_inicio?: string; fecha_fin?: string }): Promise<Blob> {
    const query = new URLSearchParams()
    if (params.tipo) query.set('tipo', params.tipo)
    if (params.fecha_inicio) query.set('fecha_inicio', params.fecha_inicio)
    if (params.fecha_fin) query.set('fecha_fin', params.fecha_fin)
    const response = await httpClient.get<any>(`${this.baseUrl}/paquetes/pdf?${query.toString()}`, { headers: { Accept: 'application/pdf' } })
    return response.data
  }

  async exportDetallesExcel(params: { tipo: TipoRecibo; fecha_inicio?: string; fecha_fin?: string }): Promise<Blob> {
    const query = new URLSearchParams()
    if (params.tipo) query.set('tipo', params.tipo)
    if (params.fecha_inicio) query.set('fecha_inicio', params.fecha_inicio)
    if (params.fecha_fin) query.set('fecha_fin', params.fecha_fin)
    const response = await httpClient.get<any>(`${this.baseUrl}/detalles/excel?${query.toString()}`, { headers: { Accept: 'application/octet-stream' } })
    return response.data
  }

  async exportConceptosExcel(params: { tipo: TipoRecibo; fecha_inicio?: string; fecha_fin?: string }): Promise<Blob> {
    const query = new URLSearchParams()
    if (params.tipo) query.set('tipo', params.tipo)
    if (params.fecha_inicio) query.set('fecha_inicio', params.fecha_inicio)
    if (params.fecha_fin) query.set('fecha_fin', params.fecha_fin)
    const response = await httpClient.get<any>(`${this.baseUrl}/conceptos/excel?${query.toString()}`, { headers: { Accept: 'application/octet-stream' } })
    return response.data
  }

  async exportPaquetesExcel(params: { tipo: TipoRecibo; fecha_inicio?: string; fecha_fin?: string }): Promise<Blob> {
    const query = new URLSearchParams()
    if (params.tipo) query.set('tipo', params.tipo)
    if (params.fecha_inicio) query.set('fecha_inicio', params.fecha_inicio)
    if (params.fecha_fin) query.set('fecha_fin', params.fecha_fin)
    const response = await httpClient.get<any>(`${this.baseUrl}/paquetes/excel?${query.toString()}`, { headers: { Accept: 'application/octet-stream' } })
    return response.data
  }
}

export const reporteCierreCajaService = new ReporteCierreCajaService()
