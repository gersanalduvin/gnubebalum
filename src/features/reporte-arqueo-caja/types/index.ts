export type ApiResponse<T = any> = {
  success: boolean
  data: T
  message: string
}

export type ResumenItem = {
  forma_pago_id: number
  nombre: string
  total: number
}

export type ResumenResponse = {
  detalles: ResumenItem[]
  total_general: number
  saved_arqueo?: ArqueoRecord
}

export type MonedaDenominacion = {
  id: number
  denominacion: string
  multiplicador: number
  orden: number
  moneda: boolean
}

export type MonedasResponse = {
  cordoba: MonedaDenominacion[]
  dolar: MonedaDenominacion[]
}

export type GuardarDetalle = {
  moneda_id: number
  cantidad: number
}

export type GuardarRequest = {
  fecha: string
  tasacambio: number
  detalles: GuardarDetalle[]
}

export type ArqueoDetalle = {
  id: number
  arqueo_id: number
  moneda_id: number
  cantidad: number
  total: number
}

export type ArqueoRecord = {
  id: number
  fecha: string
  totalc: number
  totald: number
  tasacambio: number
  totalarqueo: number
  detalles: ArqueoDetalle[]
}

export type GuardarResponse = {
  arqueo: ArqueoRecord
}
