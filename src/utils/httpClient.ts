// HTTP Client configuration for Laravel API with Bearer Token Authentication

// Types
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  signal?: AbortSignal
  credentials?: RequestCredentials
}

interface ApiResponse<T = any> {
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

// Clear session cache (legacy noop)
export const clearSessionCache = () => {}

// Configuration for Laravel API
const API_BASE_URL = 'http://localhost:8081'

// Default configuration for API requests optimized for Bearer tokens
const defaultConfig: RequestConfig = {
  headers: {
    'Accept': 'application/json',
    // Content-Type will be set conditionally to avoid unnecessary preflight
  },
  // Remove credentials: 'include' for Bearer token auth (not needed)
}

// HTTP Client class with interceptors
class HttpClient {
  private baseURL: string
  private requestInterceptors: Array<(config: RequestInit) => RequestInit | Promise<RequestInit>> = []
  private responseInterceptors: Array<(response: Response) => Response | Promise<Response>> = []
  private errorInterceptors: Array<(error: any) => any> = []

  constructor(baseURL?: string) {
    const rawBase = baseURL
      || process.env.NEXT_PUBLIC_LARAVEL_APP_URL
      || process.env.NEXT_PUBLIC_API_URL
      || API_BASE_URL

    const trimmed = (rawBase || '').replace(/\/+$/, '')
    // Logic to handle both /api (legacy) and /bk (new) prefixes if present in env
    let baseWithoutPrefix = trimmed
    if (baseWithoutPrefix.endsWith('/api')) baseWithoutPrefix = baseWithoutPrefix.slice(0, -4)
    if (baseWithoutPrefix.endsWith('/bk')) baseWithoutPrefix = baseWithoutPrefix.slice(0, -3)

    const baseWithoutApi = baseWithoutPrefix
    
    // If base url is empty or just relative (and we are in dev), fallback to hardcoded API URL
    if ((!baseWithoutApi || baseWithoutApi === '') && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        this.baseURL = API_BASE_URL;
    } else {
        this.baseURL = baseWithoutApi
    }

    console.log('[HttpClient] Base URL resolved to:', this.baseURL, 'Raw:', rawBase);
    this.setupDefaultInterceptors()
  }

  // Setup default interceptors
  private setupDefaultInterceptors() {
    // Request interceptor for Bearer token authentication (localStorage only)
    this.addRequestInterceptor(async (config) => {
      let token: string | null = null
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('token')
      }

      // Add Authorization header if token exists
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        }
      }

      return config
    })

    // Response interceptor for error handling
    this.addResponseInterceptor(async (response) => {
      // Handle 401 Unauthorized responses
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname
          const isApiCall = response.url?.includes('/bk/') || response.url?.includes('/api/')
          if (!currentPath.includes('/login') && isApiCall) {
            try { localStorage.removeItem('token') } catch {}
            window.location.href = '/login'
          }
        }
      }

      return response
    })

    // Error interceptor for network errors
    this.addErrorInterceptor((error) => {
      // Ensure error has required properties
      const normalizedError = {
        status: error?.status || 500,
        statusText: error?.statusText || 'Unknown Error',
        data: error?.data || { message: 'An error occurred' },
        ...error
      }

      // Transform error for better handling
      if (normalizedError.status === 422) {
        // Laravel validation errors
        return {
          ...normalizedError,
          isValidationError: true,
          validationErrors: normalizedError.data?.errors || {}
        }
      }

      return normalizedError
    })
  }

  // Add request interceptor
  addRequestInterceptor(interceptor: (config: RequestInit) => RequestInit | Promise<RequestInit>) {
    this.requestInterceptors.push(interceptor)
  }

  // Add response interceptor
  addResponseInterceptor(interceptor: (response: Response) => Response | Promise<Response>) {
    this.responseInterceptors.push(interceptor)
  }

  // Add error interceptor
  addErrorInterceptor(interceptor: (error: any) => any) {
    this.errorInterceptors.push(interceptor)
  }

  private async makeRequest<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    // Prepare the full URL
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`
    
    // Merge default config with provided config
    let requestConfig: RequestInit = {
      ...defaultConfig,
      ...config,
      headers: {
        ...defaultConfig.headers,
        ...config.headers,
      },
    }

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      requestConfig = await interceptor(requestConfig)
    }

    // Add body if provided
    if (config.body && config.method !== 'GET') {
      if (config.body instanceof FormData) {
        // Remove Content-Type for FormData (browser will set it with boundary)
        const { 'Content-Type': _, ...headersWithoutContentType } = requestConfig.headers as Record<string, string>
        requestConfig.headers = headersWithoutContentType
        requestConfig.body = config.body
      } else {
        // Only set Content-Type for JSON when we actually have a body to send
        requestConfig.headers = {
          ...requestConfig.headers,
          'Content-Type': 'application/json'
        }
        requestConfig.body = JSON.stringify(config.body)
      }
    }

    try {
      // Make the request
      let response = await fetch(url, requestConfig)

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        response = await interceptor(response)
      }

      // Handle different response types
      let data: any

      // Check if response is blob (for file downloads)
      const contentType = response.headers.get('content-type')
      if (
        contentType?.includes('application/pdf') ||
        contentType?.includes('application/octet-stream') ||
        contentType?.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
        contentType?.includes('application/vnd.ms-excel') ||
        contentType?.includes('text/csv')
      ) {
        data = await response.blob()
        return { data } as T
      }

      // Try to parse as JSON
      const text = await response.text()
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        data = { message: text || 'No content' }
      }

      // Handle non-2xx responses
      if (!response.ok) {
        const error = {
          status: response.status,
          statusText: response.statusText,
          data: data,
          response: response
        }

        // Apply error interceptors
        let processedError = error
        for (const interceptor of this.errorInterceptors) {
          processedError = interceptor(processedError)
        }

        throw processedError
      }

      return data
    } catch (error: any) {
      // Handle network errors
      if (!error.status) {
        const networkError = {
          status: 0,
          statusText: 'Network Error',
          data: { message: 'Network error occurred' },
          originalError: error
        }

        // Apply error interceptors
        let processedError = networkError
        for (const interceptor of this.errorInterceptors) {
          processedError = interceptor(processedError)
        }

        throw processedError
      }

      throw error
    }
  }

  // HTTP Methods
  async get<T = any>(endpoint: string, options?: { headers?: Record<string, string>; signal?: AbortSignal; timeout?: number; responseType?: 'blob' | 'json' }): Promise<T> {
    const config: RequestConfig = {
      method: 'GET',
      headers: options?.headers,
      signal: options?.signal,
    }

    // Handle timeout
    if (options?.timeout) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), options.timeout)
      config.signal = controller.signal
      
      try {
        const result = await this.makeRequest<T>(endpoint, config)
        clearTimeout(timeoutId)
        return result
      } catch (error) {
        clearTimeout(timeoutId)
        throw error
      }
    }

    return this.makeRequest<T>(endpoint, config)
  }

  async post<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<ApiResponse<T>>(endpoint, { method: 'POST', body, headers })
  }

  async put<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<ApiResponse<T>>(endpoint, { method: 'PUT', body, headers })
  }

  async delete<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<ApiResponse<T>>(endpoint, { method: 'DELETE', body, headers })
  }

  async patch<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<ApiResponse<T>>(endpoint, { method: 'PATCH', body, headers })
  }
}

// Export singleton instance
export const httpClient = new HttpClient()

// Export class for custom instances
export { HttpClient }

export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    return httpClient.post('/bk/login', credentials)
  },

  logout: async () => {
    return httpClient.post('/bk/logout')
  },

  getUser: async () => {
    return httpClient.get('/bk/user')
  },

  checkAuth: async () => {
    return httpClient.get('/bk/user')
  }
}
