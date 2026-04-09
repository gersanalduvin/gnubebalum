import { httpClient } from '@/utils/httpClient'

export interface UserInfo {
  id: number
  name: string
  email: string
  tipo_usuario: string
  role?: {
    id: number
    nombre: string
  }
  hijos?: {
    id: number
    name: string
  }[]
}

export interface LoginLog {
  id: number
  user_id: number
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user: UserInfo
}

export interface LoginLogsFilters {
  fecha_inicio?: string
  fecha_fin?: string
  tipo_usuario?: string
  search?: string
  per_page?: number
  page?: number
  unique?: boolean
}

export interface LoginLogResponse {
  success: boolean
  data: {
    current_page: number
    data: LoginLog[]
    last_page: number
    per_page: number
    total: number
  }
}

class LoginLogServiceClass {
  private readonly baseUrl = '/bk/v1/login-logs'

  async getLogs(page: number = 1, filters: LoginLogsFilters = {}): Promise<LoginLogResponse> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('page', page.toString())
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString())
        }
      })

      const url = `${this.baseUrl}?${queryParams.toString()}`
      return await httpClient.get<LoginLogResponse>(url)
    } catch (error) {
      console.error('Error fetching login logs:', error)
      throw error
    }
  }
}

export const LoginLogService = new LoginLogServiceClass()
