import { httpClient } from '@/utils/httpClient'
import type { EscalasPaginatedData, CreateUpdateEscalaPayload, Escala } from '../types'

const BASE = '/bk/v1/config-not-escala'

const list = async (params: URLSearchParams): Promise<EscalasPaginatedData> => {
  const response = await httpClient.get<any>(`${BASE}?${params.toString()}`)
  return response.data
}

const upsert = async (payload: CreateUpdateEscalaPayload): Promise<Escala> => {
  const response = await httpClient.post<Escala>(`${BASE}`, payload)
  return response.data as Escala
}

const removeEscala = async (id: number): Promise<void> => {
  await httpClient.delete(`${BASE}/${id}`)
}

const removeDetalle = async (id: number): Promise<void> => {
  await httpClient.delete(`${BASE}/detalle/${id}`)
}

const exportPDF = (params: URLSearchParams) => {
  return httpClient.get(`${BASE}/export/pdf?${params.toString()}`, {
    headers: { Accept: 'application/pdf' }
  })
}

const exportExcel = async (params: URLSearchParams): Promise<Blob> => {
  const url = `${BASE}/export/excel?${params.toString()}`
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const resp = await fetch(`${process.env.NEXT_PUBLIC_LARAVEL_APP_URL}${url}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  })
  if (!resp.ok) {
    const maybeJson = await resp.text()
    let data: any = {}
    try { data = JSON.parse(maybeJson) } catch {}
    throw { status: resp.status, statusText: resp.statusText, data }
  }
  return await resp.blob()
}

const configNotEscalaService = {
  list,
  upsert,
  removeEscala,
  removeDetalle,
  exportPDF,
  exportExcel
}

export default configNotEscalaService
