'use client'

import { useState } from 'react'

// MUI Imports
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableFooter,
    Typography,
    Chip
} from '@mui/material'

import FiltrosReporteStock from '@/features/inventario-reportes/components/FiltrosReporteStock'
import { reporteStockService } from '@/features/inventario-reportes/services/reporteStockService'
import type { FiltrosReporteStock as FiltrosType, ProductoStockCorte } from '@/features/inventario-reportes/types/reporteStock'

export default function ReporteStockPage() {
  const [productos, setProductos] = useState<ProductoStockCorte[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [viewPdfLoading, setViewPdfLoading] = useState(false)
  const [downloadPdfLoading, setDownloadPdfLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)

  const cargarReporte = async (filtros: FiltrosType) => {
    setLoading(true)
    try {
      const data = await reporteStockService.getReporte(filtros)
      setProductos(data)
    } catch (error) {
      console.error('Error al cargar reporte de stock:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportar = async (view: boolean, filtros: FiltrosType) => {
    if (view) setViewPdfLoading(true)
    else setDownloadPdfLoading(true)

    try {
      await reporteStockService.exportarPDF(filtros, view)
    } catch (error) {
      console.error('Error al exportar PDF:', error)
    } finally {
      if (view) setViewPdfLoading(false)
      else setDownloadPdfLoading(false)
    }
  }

  const handleExportarExcel = async (filtros: FiltrosType) => {
    setExcelLoading(true)
    try {
      await reporteStockService.exportarExcel(filtros)
    } catch (error) {
      console.error('Error al exportar Excel:', error)
    } finally {
      setExcelLoading(false)
    }
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-NI', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const calcularTotales = () => {
    if (!productos) return { minimo: 0, maximo: 0, stock: 0, costo: 0 }
    
    return productos.reduce((acc, curr) => ({
      minimo: acc.minimo + Number(curr.stock_minimo),
      maximo: acc.maximo + Number(curr.stock_maximo),
      stock: acc.stock + Number(curr.stock_actual),
      costo: acc.costo + Number(curr.costo)
    }), { minimo: 0, maximo: 0, stock: 0, costo: 0 })
  }

  const totales = calcularTotales()

  return (
    <Box>
      <Typography variant='h4' component='h1' gutterBottom sx={{ mb: 4 }}>
        Reporte de Stock
      </Typography>

      <FiltrosReporteStock
        onFiltrar={cargarReporte}
        onExportar={handleExportar}
        onExportarExcel={handleExportarExcel}
        onFilterChange={() => setProductos(null)}
        loading={loading}
        viewPdfLoading={viewPdfLoading}
        downloadPdfLoading={downloadPdfLoading}
        excelLoading={excelLoading}
      />

      {loading && (
        <Box display='flex' justifyContent='center' my={4}>
          <CircularProgress />
        </Box>
      )}

      {!loading && productos && (
        <Card>
          <CardHeader 
            title="Estado del Inventario" 
            subheader={`Total de productos: ${productos.length}`}
          />
          <CardContent>
            <TableContainer component={Paper} elevation={0} variant="outlined">
              <Table size='small' stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Mínimo</TableCell>
                    <TableCell align="right">Máximo</TableCell>
                    <TableCell align="right">Stock al Corte</TableCell>
                    <TableCell align="right">Costo</TableCell>
                    <TableCell align="center">Últ. Movimiento</TableCell>
                    <TableCell align="center">Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productos.map((producto) => (
                    <TableRow key={producto.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {producto.codigo}
                        </Typography>
                      </TableCell>
                      <TableCell>{producto.nombre}</TableCell>
                      <TableCell align="right">{formatNumber(producto.stock_minimo)}</TableCell>
                      <TableCell align="right">{formatNumber(producto.stock_maximo)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color={Number(producto.stock_actual) <= Number(producto.stock_minimo) ? 'error.main' : 'text.primary'}>
                          {formatNumber(Number(producto.stock_actual))}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{formatNumber(Number(producto.costo))}</TableCell>
                      <TableCell align="center">
                        {producto.ultima_fecha ? new Date(producto.ultima_fecha).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell align="center">
                        {Number(producto.stock_actual) <= Number(producto.stock_minimo) ? (
                          <Chip label="Stock Bajo" size="small" color="error" variant="outlined" />
                        ) : Number(producto.stock_actual) >= Number(producto.stock_maximo) ? (
                          <Chip label="Sobre-stock" size="small" color="info" variant="outlined" />
                        ) : (
                          <Chip label="Normal" size="small" color="success" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {productos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No se encontraron productos con los criterios seleccionados
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                {productos.length > 0 && (
                  <TableFooter sx={{ backgroundColor: 'action.hover' }}>
                    <TableRow>
                      <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>
                        TOTALES:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatNumber(totales.minimo)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatNumber(totales.maximo)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {formatNumber(totales.stock)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatNumber(totales.costo)}
                      </TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
