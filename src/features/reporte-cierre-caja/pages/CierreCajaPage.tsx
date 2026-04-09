'use client'

import { Download as DownloadIcon, GridOn as ExcelIcon, Print as PrintIcon, Assessment as ReportIcon } from '@mui/icons-material'
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography
} from '@mui/material'
import { useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'

import { usePermissions } from '@/hooks/usePermissions'
import { reporteCierreCajaService } from '../services/reporteCierreCajaService'
import type { CierreCajaConceptoItem, CierreCajaDetalle, TipoRecibo } from '../types'

export default function CierreCajaPage() {
  const { hasPermission } = usePermissions()

  const [tipo, setTipo] = useState<TipoRecibo>('interno')
  const [fechaInicio, setFechaInicio] = useState<string>('')
  const [fechaFin, setFechaFin] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'detalles' | 'conceptos' | 'paquetes'>('detalles')

  const [detalles, setDetalles] = useState<CierreCajaDetalle[]>([])
  const [conceptos, setConceptos] = useState<CierreCajaConceptoItem[]>([])
  const [paquetes, setPaquetes] = useState<CierreCajaConceptoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleBuscar = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = { tipo, fecha_inicio: fechaInicio || undefined, fecha_fin: fechaFin || undefined }
      const [respDetalles, respConceptos, respPaquetes] = await Promise.all([
        reporteCierreCajaService.getDetalles(params),
        reporteCierreCajaService.getConceptos(params),
        reporteCierreCajaService.getPaquetes(params)
      ])
      setDetalles(respDetalles?.data || [])
      setConceptos(respConceptos?.data || [])
      setPaquetes(respPaquetes?.data || [])
      toast.success('Reporte cargado correctamente')
    } catch (err: any) {
      const message = err?.data?.message || 'Error al cargar el reporte de cierre de caja'
      setError(message)
      toast.error(message)
      setDetalles([])
      setConceptos([])
    } finally {
      setLoading(false)
    }
  }

  const handleLimpiar = () => {
    setFechaInicio('')
    setFechaFin('')
    setDetalles([])
    setConceptos([])
    setPaquetes([])
    setError(null)
  }

  const handlePrintPdf = async () => {
    try {
      setPdfLoading(true)
      const params = { tipo, fecha_inicio: fechaInicio || undefined, fecha_fin: fechaFin || undefined }
      const blob = activeTab === 'detalles'
        ? await reporteCierreCajaService.exportDetallesPdf(params)
        : activeTab === 'conceptos'
          ? await reporteCierreCajaService.exportConceptosPdf(params)
          : await reporteCierreCajaService.exportPaquetesPdf(params)

      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      window.open(url, '_blank')
      setTimeout(() => { window.URL.revokeObjectURL(url) }, 1000)
      toast.success('PDF generado para impresión')
    } catch (error: any) {
      if (error.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      toast.error('Error al generar el PDF. Intente nuevamente.')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      setDownloadLoading(true)
      const params = { tipo, fecha_inicio: fechaInicio || undefined, fecha_fin: fechaFin || undefined }
      const blob = activeTab === 'detalles'
        ? await reporteCierreCajaService.exportDetallesPdf(params)
        : activeTab === 'conceptos'
          ? await reporteCierreCajaService.exportConceptosPdf(params)
          : await reporteCierreCajaService.exportPaquetesPdf(params)

      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      a.download = `cierre_caja_${activeTab}_${timestamp}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => { window.URL.revokeObjectURL(url) }, 1000)
      toast.success('PDF descargado correctamente')
    } catch (error: any) {
      if (error.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      toast.error('Error al descargar el PDF. Intente nuevamente.')
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleExportExcel = async () => {
    try {
      setExcelLoading(true)
      const params = { tipo, fecha_inicio: fechaInicio || undefined, fecha_fin: fechaFin || undefined }
      const blob = activeTab === 'detalles'
        ? await reporteCierreCajaService.exportDetallesExcel(params)
        : activeTab === 'conceptos'
          ? await reporteCierreCajaService.exportConceptosExcel(params)
          : await reporteCierreCajaService.exportPaquetesExcel(params)

      const fileName = activeTab === 'detalles'
        ? 'Reporte Cierre de Caja - Detalles.xlsx'
        : activeTab === 'conceptos'
          ? 'Reporte Cierre de Caja - Conceptos.xlsx'
          : 'Reporte Cierre de Caja - Paquetes.xlsx'
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => { window.URL.revokeObjectURL(url) }, 1000)
      toast.success('Excel generado correctamente')
    } catch (error: any) {
      if (error.status === 401) {
        toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
        window.location.href = '/auth/login'
        return
      }
      toast.error('Error al generar el Excel. Intente nuevamente.')
    } finally {
      setExcelLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0)
  }

  const totalDetalles = detalles.reduce((acc, curr) => acc + Number(curr.total_recibo || 0), 0)
  // Calculate total from unique receipts (since total_recibo is repeated)
  const uniqueReceiptsTotal = useMemo(() => {
     const seen = new Set();
     return detalles.reduce((acc, curr) => {
        if (!seen.has(curr.numero_recibo)) {
            seen.add(curr.numero_recibo);
            // Sum only if not anulled
            if (curr.estado?.toLowerCase() !== 'anulado') {
                return acc + Number(curr.total_recibo || 0);
            }
        }
        return acc;
     }, 0);
  }, [detalles]);

  const processedDetalles = useMemo(() => {
    return detalles.map((item, index, arr) => {
      const isFirst = index === 0 || item.numero_recibo !== arr[index - 1].numero_recibo
      let rowSpan = 1
      if (isFirst) {
        for (let i = index + 1; i < arr.length; i++) {
          if (arr[i].numero_recibo === item.numero_recibo) {
            rowSpan++
          } else {
            break
          }
        }
      } else {
        rowSpan = 0
      }
      return { ...item, rowSpan }
    })
  }, [detalles])
  const totalConceptos = conceptos.reduce((sum, c) => sum + (Number(c.total) || 0), 0)
  const totalPaquetes = paquetes.reduce((sum, c) => sum + (Number(c.total) || 0), 0)

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReportIcon />
          Cierre de Caja
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Consulte movimientos de caja por rango de fechas y tipo de recibo
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="flex-start">
            <Grid item xs={12} md={9}>
              <Grid container spacing={2} direction="column">
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo</InputLabel>
                    <Select value={tipo} label="Tipo" onChange={(e) => { setTipo(e.target.value as TipoRecibo); setDetalles([]); setConceptos([]); setPaquetes([]); setError(null) }}>
                      <MenuItem value={'todos'}>Todos</MenuItem>
                      <MenuItem value={'interno'}>Jardín Infantil Los Picapiedras (Interno)</MenuItem>
                      <MenuItem value={'externo'}>Colegio Balum Botan (Externo)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Fecha inicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => { setFechaInicio(e.target.value); setDetalles([]); setConceptos([]); setPaquetes([]); setError(null) }}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Fecha fin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => { setFechaFin(e.target.value); setDetalles([]); setConceptos([]); setPaquetes([]); setError(null) }}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button variant="outlined" onClick={handleLimpiar} disabled={loading} fullWidth>
                  Limpiar
                </Button>
                <Button variant="contained" onClick={handleBuscar} disabled={loading} fullWidth>
                  Buscar
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={pdfLoading ? <CircularProgress size={20} color="inherit" /> : <PrintIcon />}
                  onClick={handlePrintPdf}
                  disabled={loading || pdfLoading || downloadLoading}
                  fullWidth
                >
                  {pdfLoading ? 'Generando...' : 'Imprimir'}
                </Button>
                <Button
                  variant="contained"
                  color="error" // Using error color for PDF (often associated with PDF/Adobe) or could use 'info' or just 'primary'
                  startIcon={downloadLoading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                  onClick={handleDownloadPdf}
                  disabled={loading || pdfLoading || downloadLoading}
                  fullWidth
                  sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }} // Custom red for PDF download
                >
                  {downloadLoading ? 'Descargando...' : 'Descargar PDF'}
                </Button>
                {hasPermission('reporte_cierre_caja.exportar_excel') && (
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={excelLoading ? <CircularProgress size={20} /> : <ExcelIcon />}
                    onClick={handleExportExcel}
                    disabled={loading || excelLoading}
                    fullWidth
                  >
                    {excelLoading ? 'Generando...' : 'Exportar Excel'}
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Cargando datos...
            </Typography>
          </CardContent>
        </Card>
      )}

      {!loading && (
        <Card>
          <CardContent>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
              <Tab value="detalles" label="Detalles" />
              <Tab value="conceptos" label="Conceptos" />
              <Tab value="paquetes" label="Paquetes" />
            </Tabs>

            {activeTab === 'detalles' && (
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Fecha</strong></TableCell>
                      <TableCell><strong>N° Recibo</strong></TableCell>
                      <TableCell><strong>Tipo</strong></TableCell>
                      <TableCell><strong>Usuario</strong></TableCell>
                      <TableCell><strong>Concepto</strong></TableCell>
                      <TableCell align="center"><strong>Cant.</strong></TableCell>
                      <TableCell align="right"><strong>Precio</strong></TableCell>
                      <TableCell align="right"><strong>Desc.</strong></TableCell>
                      <TableCell align="right"><strong>Subtotal</strong></TableCell>
                      <TableCell align="right"><strong>Total Recibo</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {processedDetalles.map((item, idx) => {
                      const isAnulado = item.estado?.toLowerCase() === 'anulado'
                      return (
                        <TableRow
                          key={idx}
                          sx={{
                            textDecoration: isAnulado ? 'line-through' : 'none',
                            color: isAnulado ? 'text.disabled' : 'inherit',
                            '& .MuiChip-root': { opacity: isAnulado ? 0.7 : 1 }
                          }}
                        >
                        <TableCell>{item.fecha ? item.fecha.split('T')[0].split('-').reverse().join('/') : ''}</TableCell>
                        <TableCell>{item.numero_recibo}</TableCell>
                        <TableCell>
                          {String(item.tipo).toLowerCase() === 'interno' ? 'Los Picapiedras' : 
                           String(item.tipo).toLowerCase() === 'externo' ? 'Balum Botan' : item.tipo}
                        </TableCell>
                        <TableCell>{item.nombre_usuario}</TableCell>
                        <TableCell>{item.concepto}</TableCell>
                        <TableCell align="center">{item.cantidad}</TableCell>
                        <TableCell align="right">{formatCurrency(Number(item.monto) || 0)}</TableCell>
                        <TableCell align="right">{formatCurrency(Number(item.descuento) || 0)}</TableCell>
                        <TableCell align="right">{formatCurrency(Number(item.subtotal) || 0)}</TableCell>
                        {item.rowSpan > 0 && (
                          <TableCell align="right" rowSpan={item.rowSpan} sx={{ verticalAlign: 'middle', bgcolor: isAnulado ? 'transparent' : 'grey.50' }}>
                            <Chip label={formatCurrency(Number(item.total_recibo) || 0)} color={isAnulado ? "default" : "primary"} size="small" />
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                    {detalles.length > 0 && (
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell colSpan={8}><strong>Total General</strong></TableCell>
                        <TableCell align="right">
                          <Chip label={formatCurrency(uniqueReceiptsTotal)} color="secondary" size="small" />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {activeTab === 'conceptos' && (
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Concepto</strong></TableCell>
                      <TableCell align="center"><strong>Cantidad</strong></TableCell>
                      <TableCell align="right"><strong>Total</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {conceptos.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.concepto}</TableCell>
                        <TableCell align="center">{item.cantidad}</TableCell>
                        <TableCell align="right">
                          <Chip label={formatCurrency(Number(item.total) || 0)} color="primary" size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                    {conceptos.length > 0 && (
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell><strong>Total General</strong></TableCell>
                        <TableCell align="center">—</TableCell>
                        <TableCell align="right">
                          <Chip label={formatCurrency(totalConceptos)} color="secondary" size="small" />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {activeTab === 'paquetes' && (
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Concepto (Paquete)</strong></TableCell>
                      <TableCell align="center"><strong>Cantidad</strong></TableCell>
                      <TableCell align="right"><strong>Precio</strong></TableCell>
                      <TableCell align="right"><strong>Total</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paquetes.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.concepto}</TableCell>
                        <TableCell align="center">{item.cantidad}</TableCell>
                        <TableCell align="right">{formatCurrency(Number(item.monto) || 0)}</TableCell>
                        <TableCell align="right">
                          <Chip label={formatCurrency(Number(item.total) || 0)} color="primary" size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                    {paquetes.length > 0 && (
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell><strong>Total General</strong></TableCell>
                        <TableCell align="center">—</TableCell>
                        <TableCell align="right">—</TableCell>
                        <TableCell align="right">
                          <Chip label={formatCurrency(totalPaquetes)} color="secondary" size="small" />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && !error && detalles.length === 0 && conceptos.length === 0 && paquetes.length === 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <ReportIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay datos para mostrar
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ajuste los filtros y presione "Buscar" para ver resultados
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
