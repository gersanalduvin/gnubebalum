import { httpClient } from '@/utils/httpClient'
import type { ArqueoMonedaPaginatedResponse, ConfigArqueoMoneda, CreateArqueoMonedaRequest, UpdateArqueoMonedaRequest } from '../types'

const base = '/bk/v1/config-arqueo-moneda'

const arqueoMonedaService = {
  async list(page = 1, per_page = 10, search?: string, moneda?: number | boolean): Promise<any> {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('per_page', String(per_page))
    if (search) params.set('search', search)
    if (typeof moneda !== 'undefined' && moneda !== null) {
      const v = typeof moneda === 'boolean' ? (moneda ? '1' : '0') : String(moneda)
      params.set('moneda', v)
    }
    return httpClient.get(`${base}/?${params.toString()}`)
  },

  async getAll(): Promise<any> {
    return httpClient.get(`${base}/getall`)
  },

  async create(payload: CreateArqueoMonedaRequest): Promise<any> {
    return httpClient.post(`${base}/`, payload)
  },

  async update(id: number, payload: UpdateArqueoMonedaRequest): Promise<any> {
    return httpClient.put(`${base}/${id}`, payload)
  },

  async remove(id: number): Promise<any> {
    return httpClient.delete(`${base}/${id}`)
  }
}

export default arqueoMonedaService
