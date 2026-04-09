import { httpClient } from '@/utils/httpClient'
import type { AreaAsignatura, AreasPaginatedData, CreateAreaPayload } from '../types'

const BASE = '/bk/v1/not-materias-areas'

const list = async (params: URLSearchParams): Promise<AreasPaginatedData> => {
  const response = await httpClient.get<any>(`${BASE}?${params.toString()}`)
  return response.data
}

const create = async (payload: CreateAreaPayload): Promise<AreaAsignatura> => {
  const response = await httpClient.post<AreaAsignatura>(`${BASE}`, payload)
  return response.data as AreaAsignatura
}

const update = async (id: number, payload: CreateAreaPayload): Promise<AreaAsignatura> => {
  const response = await httpClient.put<AreaAsignatura>(`${BASE}/${id}`, payload)
  return response.data as AreaAsignatura
}

const getById = async (id: number): Promise<AreaAsignatura> => {
  const response = await httpClient.get<any>(`${BASE}/${id}`)
  return response.data as AreaAsignatura
}

const remove = async (id: number): Promise<void> => {
  await httpClient.delete(`${BASE}/${id}`)
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
    const text = await resp.text()
    let data: any = {}
    try { data = JSON.parse(text) } catch {}
    throw { status: resp.status, statusText: resp.statusText, data }
  }
  return await resp.blob()
}

const areasService = {
  list,
  create,
  update,
  getById,
  remove,
  exportPDF,
  exportExcel
}

export default areasService
