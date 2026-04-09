export interface Almacen {
  id: number
  nombre: string
  ubicacion: string
  descripcion?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface CreateAlmacenData {
  nombre: string
  ubicacion: string
  descripcion?: string
  activo?: boolean
}

export interface UpdateAlmacenData {
  nombre?: string
  ubicacion?: string
  descripcion?: string
  activo?: boolean
}