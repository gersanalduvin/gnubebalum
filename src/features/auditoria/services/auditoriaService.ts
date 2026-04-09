import { httpClient } from '@/utils/httpClient'

class AuditoriaService {
  private readonly baseUrl = '/bk/v1/audits'

  async getSummary(model: string, id: number): Promise<any> {
    const response = await httpClient.get<any>(`${this.baseUrl}/${model}/${id}/summary`, { headers: { Accept: 'application/json' } })
    return response?.data || null
  }
}

export const auditoriaService = new AuditoriaService()

