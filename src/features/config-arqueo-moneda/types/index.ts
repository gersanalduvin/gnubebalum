export interface ConfigArqueoMoneda {
  id: number
  moneda: boolean
  denominacion: string
  multiplicador: number
  orden: number
}

export interface ArqueoMonedaPaginatedResponse {
  success: boolean
  data: {
    data: ConfigArqueoMoneda[]
    total: number
    current_page: number
    last_page: number
  }
  message?: string
}

export interface CreateArqueoMonedaRequest {
  moneda: boolean
  denominacion: string
  multiplicador: number
  orden: number
}

export interface UpdateArqueoMonedaRequest {
  moneda?: boolean
  denominacion?: string
  multiplicador?: number
  orden?: number
}
