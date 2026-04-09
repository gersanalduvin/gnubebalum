export interface ProductoUtilidad {
  id: number
  codigo: string
  producto: string
  categoria?: string
  costo_promedio: number
  precio_venta: number
  cantidad: number
  total_costo: number
  total_venta_potencial: number
  total_ganancia: number
  margen_porcentaje: number
  moneda: string
  fecha_ultimo_movimiento?: string
  dias_sin_movimiento?: number
  tiene_movimientos_en_periodo?: boolean
}

export interface ResumenUtilidad {
  total_productos: number
  total_unidades: number
  valor_inventario_costo: number
  valor_inventario_venta: number
  ganancia_potencial: number
  margen_promedio: number
  productos_sin_kardex?: number
  productos_sin_stock?: number
}

export interface PeriodoReporte {
  tipo: 'actual' | 'corte' | 'rango'
  fecha_corte?: string
  fecha_inicio?: string
  fecha_fin?: string
  descripcion: string
}

export interface ReporteUtilidad {
  periodo: PeriodoReporte
  resumen: ResumenUtilidad
  productos: ProductoUtilidad[]
}

export interface FiltrosReporte {
  tipo_filtro: 'actual' | 'mes' | 'fecha'
  year?: number
  month?: number
  fecha_corte?: string
  categoria_id?: number
  moneda?: boolean
  buscar?: string
}
