export interface ProductoStockCorte {
  id: number;
  codigo: string;
  nombre: string;
  stock_minimo: number;
  stock_maximo: number;
  stock_actual: number;
  costo: number;
  ultima_fecha?: string | null;
}

export interface FiltrosReporteStock {
  fecha_corte: string;
  search?: string;
  categoria_id?: number;
  solo_con_movimientos: boolean;
}
