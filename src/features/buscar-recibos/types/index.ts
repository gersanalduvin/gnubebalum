export type ReciboItem = {
  id: number
  fecha: string
  nombre_usuario: string
  numero_recibo: string
  total: number
  estado?: string
  tipo?: string
}

export type Paginator<T> = {
  current_page: number
  data: T
  per_page: number
  total: number
}

export type ApiResponse<T = any> = {
  success: boolean
  data: T
  message: string
}
