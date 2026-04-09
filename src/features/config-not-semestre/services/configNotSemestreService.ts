import { httpClient } from '@/utils/httpClient'
import type { SemestresPaginatedData, UpsertSemestrePayload, Semestre, ConfPeriodoLectivoOption } from '../types'

const BASE = '/bk/v1/config-not-semestre'

const getPeriodosLectivos = async (): Promise<ConfPeriodoLectivoOption[]> => {
  const response = await httpClient.get<any>(`${BASE}/periodos-lectivos`)
  return Array.isArray(response.data) ? response.data : []
}

const list = async (params: URLSearchParams): Promise<SemestresPaginatedData> => {
  const response = await httpClient.get<any>(`${BASE}?${params.toString()}`)
  return response.data
}

const upsert = async (payload: UpsertSemestrePayload): Promise<Semestre> => {
  const response = await httpClient.post<Semestre>(`${BASE}`, payload)
  return response.data as Semestre
}

const removeSemestre = async (id: number): Promise<void> => {
  await httpClient.delete(`${BASE}/${id}`)
}

const removeParcial = async (id: number): Promise<void> => {
  await httpClient.delete(`${BASE}/parcial/${id}`)
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

const configNotSemestreService = {
  getPeriodosLectivos,
  list,
  upsert,
  removeSemestre,
  removeParcial,
  exportPDF,
  exportExcel
}

export default configNotSemestreService
