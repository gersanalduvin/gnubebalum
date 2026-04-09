'use client'

import { useState } from 'react'

// MUI Imports
import {
    Alert,
    Box,
    Card,
    CardContent,
    CardHeader,
    Chip,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material'

import { Info } from '@mui/icons-material'

import FiltrosReporte from '@/features/inventario-reportes/components/FiltrosReporte'
import ResumenCards from '@/features/inventario-reportes/components/ResumenCards'
import { reporteUtilidadService } from '@/features/inventario-reportes/services/reporteUtilidadService'
import type { FiltrosReporte as FiltrosType, ReporteUtilidad } from '@/features/inventario-reportes/types/reporteUtilidad'

export default function ReporteUtilidadPage() {
  const [reporte, setReporte] = useState<ReporteUtilidad | null>(null)
  const [loading, setLoading] = useState(false)
  const [viewPdfLoading, setViewPdfLoading] = useState(false)
  const [downloadPdfLoading, setDownloadPdfLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)
  const [filtrosActuales, setFiltrosActuales] = useState<FiltrosType>({
    tipo_filtro: 'actual'
  })

  const cargarReporte = async (filtros: FiltrosType) => {
    setLoading(true)
    setFiltrosActuales(filtros)
    try {
      const data = await reporteUtilidadService.getReporte(filtros)
      setReporte(data)
    } catch (error) {
      console.error('Error al cargar reporte:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportar = async (view: boolean, filtros: FiltrosType) => {
    if (view) setViewPdfLoading(true)
    else setDownloadPdfLoading(true)

    // Actualizar filtros actuales al exportar también
    setFiltrosActuales(filtros)

    try {
      await reporteUtilidadService.exportarPDF(filtros, view)
    } catch (error) {
      console.error('Error al exportar PDF:', error)
    } finally {
      if (view) setViewPdfLoading(false)
      else setDownloadPdfLoading(false)
    }
  }

  const handleExportarExcel = async (filtros: FiltrosType) => {
    setExcelLoading(true)
    setFiltrosActuales(filtros)

    try {
      await reporteUtilidadService.exportarExcel(filtros)
    } catch (error) {
      console.error('Error al exportar Excel:', error)
    } finally {
      setExcelLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-NI', {
      style: 'currency',
      currency: 'NIO',
      minimumFractionDigits: 2
    }).format(value)
  }

  return (
    <Box>
      <Typography variant='h4' component='h1' gutterBottom sx={{ mb: 4 }}>
        Reporte de Utilidades de Inventario
      </Typography>

      <FiltrosReporte
        onFiltrar={cargarReporte}
        onExportar={handleExportar}
        onExportarExcel={handleExportarExcel}
        onFilterChange={() => setReporte(null)}
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

      {!loading && reporte && (
        <>
          <Alert icon={<Info fontSize="inherit" />} severity="info" sx={{ mb: 4 }}>
            {reporte.periodo.descripcion}
          </Alert>

          <ResumenCards resumen={reporte.resumen} />

          <Card>
            <CardHeader title="Detalle por Producto" />
            <CardContent>
              <TableContainer component={Paper} elevation={0} variant="outlined">
                <Table size='small' stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Código</TableCell>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Costo Prom.</TableCell>
                      <TableCell align="right">Precio Venta</TableCell>
                      <TableCell align="right">Cant. Vendida</TableCell>
                      <TableCell align="right">Costo Total Venta</TableCell>
                      <TableCell align="right">Ganancia Real</TableCell>
                      <TableCell align="right">Margen %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reporte.productos.map((producto) => (
                      <TableRow
                        key={producto.id}
                        hover
                        sx={{
                          backgroundColor: producto.tiene_movimientos_en_periodo
                            ? 'rgba(76, 175, 80, 0.08)' // Verde suave para indicar actividad
                            : 'inherit'
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {producto.codigo}
                          </Typography>
                        </TableCell>
                        <TableCell>{producto.producto}</TableCell>
                        <TableCell align="right">{formatCurrency(producto.costo_promedio)}</TableCell>
                        <TableCell align="right">{formatCurrency(producto.precio_venta)}</TableCell>
                        <TableCell align="right">{producto.cantidad.toFixed(2)}</TableCell>
                        <TableCell align="right">{formatCurrency(producto.total_costo)}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="success.main" fontWeight="bold">
                            {formatCurrency(producto.total_ganancia)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${producto.margen_porcentaje.toFixed(2)}%`}
                            size="small"
                            color={producto.margen_porcentaje > 50 ? 'success' : 'warning'}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {reporte.productos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                            No se encontraron datos para los filtros seleccionados
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}
