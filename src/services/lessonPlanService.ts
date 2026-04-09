import { httpClient } from '@/utils/httpClient'

export interface LessonPlan {
  id?: number
  user_id?: number
  periodo_lectivo_id: number
  parcial_id: number
  asignatura_id: number
  nivel: 'inicial' | 'primaria'
  start_date?: string
  end_date?: string
  contenido?: any
  archivo_url?: string
  file_full_url?: string
  is_submitted?: boolean
  is_general?: boolean
  groups?: number[] | any[] // Array of group IDs or Objects
  group_ids?: number[]
  user?: any // Loaded relationship
  asignatura?: any // Loaded relationship
  current_user_id?: number // For ownership validation
  created_at?: string
  updated_at?: string
}

export const getLessonPlans = async (filters?: any) => {
  // Filters can include user_id, periodo_lectivo_id, parcial_id, start_date, end_date, is_submitted
  // Clean empty/undefined filters before building the query string
  const cleanFilters = Object.fromEntries(
    Object.entries(filters || {}).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  )
  const params = new URLSearchParams(cleanFilters as Record<string, string>).toString()
  const response: any = await httpClient.get(`/bk/v1/agenda/planes-clases?${params}`)
  // Return the entire 'data' object (which is the paginator instance from Laravel: { current_page, data, total, ... })
  // if it's paginated, or just the array if it's not.
  return response.data;
}

export const getLessonPlan = async (id: number) => {
  const response: any = await httpClient.get(`/bk/v1/agenda/planes-clases/${id}`)
  return response.data
}

// Helper to append nested objects to FormData
const appendToFormData = (formData: FormData, data: any, parentKey?: string) => {
  if (data instanceof File) {
    if (parentKey) {
      formData.append(parentKey, data)
    }
  } else if (Array.isArray(data)) {
    data.forEach((item, index) => {
      const formKey = parentKey ? `${parentKey}[${index}]` : `${index}`
      appendToFormData(formData, item, formKey)
    })
  } else if (data && typeof data === 'object' && !(data instanceof Date)) {
    Object.keys(data).forEach(key => {
      const value = data[key]
      const formKey = parentKey ? `${parentKey}[${key}]` : key
      appendToFormData(formData, value, formKey)
    })
  } else if (data !== null && data !== undefined) {
      let value = String(data)
      if (data instanceof Date) {
          value = data.toISOString()
      } else if (typeof data === 'boolean') {
          value = data ? '1' : '0'
      }

      if (parentKey) {
        formData.append(parentKey, value)
      }
  }
}

export const createLessonPlan = async (data: any) => {
  const formData = new FormData()

  // Handle file specifically if it exists at top level
  if (data.file) {
      formData.append('file', data.file)
      // We don't delete it from data to allow appendToFormData to handle other fields effectively,
      // but we should avoid duplicating it if we iterate 'data'.
      // Actually, let's just use the helper for everything except 'file' if we want custom handling,
      // but the helper acts recursively.
  }

  // Use helper for all other data
  // We exclude 'file' from the spread or handle it.
  const { file, ...restData } = data
  appendToFormData(formData, restData)

  const response: any = await httpClient.post('/bk/v1/agenda/planes-clases', formData)
  return response.data
}

export const updateLessonPlan = async (id: number, data: any) => {
  // Use FormData for update as well to handle potential file uploads or consistency
  const formData = new FormData()
  // Route is defined as POST in routes/bk/v1/lesson-plans.php, so no method spoofing needed
  // formData.append('_method', 'PUT')

  if (data.file) {
      formData.append('file', data.file)
  }

  const { file, ...restData } = data
  appendToFormData(formData, restData)

  const response: any = await httpClient.post(`/bk/v1/agenda/planes-clases/${id}`, formData)
  return response.data
}

export const deleteLessonPlan = async (id: number) => {
  const response: any = await httpClient.delete(`/bk/v1/agenda/planes-clases/${id}`)
  return response.data
}

export const duplicateLessonPlan = async (id: number) => {
  const response: any = await httpClient.post(`/bk/v1/agenda/planes-clases/${id}/duplicate`)
  return response.data
}

export const getLessonPlanStats = async (periodo_lectivo_id: string, parcial_id: string, start_date?: string, end_date?: string) => {
  const params = new URLSearchParams({
      periodo_lectivo_id,
      parcial_id
  })
  if (start_date) params.append('start_date', start_date)
  if (end_date) params.append('end_date', end_date)

  const response: any = await httpClient.get(`/bk/v1/agenda/planes-clases/stats?${params.toString()}`)
  return response.data
}

export const getTeacherStatus = async (periodo_lectivo_id: string, parcial_id: string, start_date?: string, end_date?: string) => {
  const params = new URLSearchParams({
      periodo_lectivo_id,
      parcial_id
  })
  if (start_date) params.append('start_date', start_date)
  if (end_date) params.append('end_date', end_date)

  const response: any = await httpClient.get(`/bk/v1/agenda/planes-clases/teacher-status?${params.toString()}`)
  return response.data
}

export const getPlanningCoverage = async (periodo_lectivo_id: string, parcial_id?: string, start_date?: string) => {
  console.log('API getPlanningCoverage params:', { periodo_lectivo_id, parcial_id, start_date })
  const params = new URLSearchParams({
      periodo_lectivo_id
  })
  if (parcial_id) params.append('parcial_id', parcial_id)
  if (start_date) params.append('start_date', start_date)

  const response: any = await httpClient.get(`/bk/v1/agenda/planes-clases/coverage?${params.toString()}`)
  return response.data
}

export const exportLessonPlanPdf = async (id: number | string) => {
  const response = await httpClient.get(`/bk/v1/agenda/planes-clases/${id}/export-pdf`, {
    responseType: 'blob'
  })
  return response
}

export const exportPdfListado = async (filters?: any) => {
  const params = new URLSearchParams(filters).toString()
  const response = await httpClient.get(`/bk/v1/agenda/planes-clases/export-pdf?${params}`, {
    responseType: 'blob'
  })
  return response
}

export const exportPdfCobertura = async (periodo_lectivo_id: string, parcial_id?: string, start_date?: string) => {
  const params = new URLSearchParams({
      periodo_lectivo_id
  })
  if (parcial_id) params.append('parcial_id', parcial_id)
  if (start_date) params.append('start_date', start_date)

  const response = await httpClient.get(`/bk/v1/agenda/planes-clases/coverage-pdf?${params.toString()}`, {
    responseType: 'blob'
  })
  return response
}

export const exportPdfPendientes = async (periodo_lectivo_id: string, parcial_id: string, start_date?: string, end_date?: string) => {
  const params = new URLSearchParams({
      periodo_lectivo_id,
      parcial_id
  })
  if (start_date) params.append('start_date', start_date)
  if (end_date) params.append('end_date', end_date)

  const response = await httpClient.get(`/bk/v1/agenda/planes-clases/pendientes-pdf?${params.toString()}`, {
    responseType: 'blob'
  })
  return response
}

export const uploadLessonPlanAttachment = async (file: File): Promise<{ status: string, url: string, filename: string }> => {
    const formData = new FormData()
    formData.append('file', file)

    // Use raw axios or httpClient if it supports FormData auto-header (usually it does by omitting Content-Type)
    // httpClient wrapper might need explicit header or just let browser handle it.
    // Assuming httpClient handles standard Axios interactions.
    const response: any = await httpClient.post('/bk/v1/agenda/planes-clases/attachment', formData)
    return response.data || response
}

export const getMyAssignments = async (periodo_lectivo_id?: number) => {
    let url = '/bk/v1/agenda/planes-clases/my-assignments'
    if (periodo_lectivo_id) {
        url += `?periodo_lectivo_id=${periodo_lectivo_id}`
    }
    const response = await httpClient.get<any>(url)
    return response.data
}

export const getMyGroups = async (periodo_lectivo_id: number) => {
    const response = await httpClient.get<any>(`/bk/v1/docente-portal/mis-grupos?periodo_lectivo_id=${periodo_lectivo_id}`)
    return response.data
}
