'use client'

import { Download as DownloadIcon, TableView as ExcelIcon, Print as PrintIcon, Assessment as ReportIcon } from '@mui/icons-material'
import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    ListItemText,
    MenuItem,
    Select,
    Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

import { usePermissions } from '@/hooks/usePermissions'
import { reporteCuentaXCobrarService } from '../services/reporteCuentaXCobrarService'
import type { CatalogosCuentaXCobrar, Grupo } from '../types'

const MESES_COMPLETOS = ['matricula', 'enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const MES_ABREVIADO: Record<string, string> = {
  matricula: 'MAT', enero: 'ene', febrero: 'feb', marzo: 'mar', abril: 'abr', mayo: 'may', junio: 'jun', julio: 'jul', agosto: 'ago', septiembre: 'sep', octubre: 'oct', noviembre: 'nov', diciembre: 'dic'
}

export default function ReporteCuentaXCobrarPage() {
  const { hasPermission } = usePermissions()

  const [catalogos, setCatalogos] = useState<CatalogosCuentaXCobrar>({ periodos_lectivos: [], turnos: [] })
  const [grupos, setGrupos] = useState<Grupo[]>([])

  const [periodoId, setPeriodoId] = useState<number | ''>('' as any)
  const [turnoId, setTurnoId] = useState<number | ''>('' as any)
  const [grupoId, setGrupoId] = useState<number | 'Todos' | ''>('' as any)
  const [meses, setMeses] = useState<string[]>([])

  const [soloPendientes, setSoloPendientes] = useState(false)

  const [printLoading, setPrintLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [excelLoading, setExcelLoading] = useState(false)

  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        const resp = await reporteCuentaXCobrarService.getCatalogos()
        setCatalogos(resp)
      } catch (err: any) {
        const message = err?.data?.message || 'Error al cargar catálogos'
        toast.error(message)
      }
    }
    loadCatalogos()
  }, [])

  useEffect(() => {
    const loadGrupos = async () => {
      setGrupos([])
      if (!periodoId || !turnoId) return
      try {
        const resp = await reporteCuentaXCobrarService.getGrupos({ periodo_lectivo_id: Number(periodoId), turno_id: Number(turnoId) })
        setGrupos(resp || [])
      } catch (err: any) {
        const message = err?.data?.message || 'Error al cargar grupos'
        toast.error(message)
      }
    }
    loadGrupos()
  }, [periodoId, turnoId])

  const handlePrintPdf = async () => {
    try {
      setPrintLoading(true)
      const body = {
        periodo_lectivo_id: Number(periodoId),
        turno_id: turnoId ? Number(turnoId) : undefined,
        grupo_id: grupoId !== '' ? (grupoId as any) : undefined,
        meses: meses.length ? meses : undefined,
        solo_pendientes: soloPendientes
      }
      const blob = await reporteCuentaXCobrarService.exportPdf(body)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      window.open(url, '_blank')
      setTimeout(() => { window.URL.revokeObjectURL(url) }, 1000)
      toast.success('PDF generado para impresión')
    } catch (error: any) {
      handlePdfError(error)
    } finally {
      setPrintLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      setDownloadLoading(true)
      const body = {
        periodo_lectivo_id: Number(periodoId),
        turno_id: turnoId ? Number(turnoId) : undefined,
        grupo_id: grupoId !== '' ? (grupoId as any) : undefined,
        meses: meses.length ? meses : undefined,
        solo_pendientes: soloPendientes
      }
      const blob = await reporteCuentaXCobrarService.exportPdf(body)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `cuentas_x_cobrar_${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => { window.URL.revokeObjectURL(url) }, 1000)
      toast.success('PDF descargado')
    } catch (error: any) {
      handlePdfError(error)
    } finally {
      setDownloadLoading(false)
    }
  }

  const handlePdfError = (error: any) => {
    if (error?.status === 401) {
      toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
      window.location.href = '/auth/login'
      return
    }
    toast.error('Error al generar el PDF. Intente nuevamente.')
  }

  const handleExportExcel = async () => {
    try {
      setExcelLoading(true)
      const body = {
        periodo_lectivo_id: Number(periodoId),
        turno_id: turnoId ? Number(turnoId) : undefined,
        grupo_id: grupoId !== '' ? (grupoId as any) : undefined,
        meses: meses.length ? meses : undefined,
        solo_pendientes: soloPendientes
      }
      const blob = await reporteCuentaXCobrarService.exportExcel(body)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `cuentas_x_cobrar_${new Date().toISOString()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReportIcon />
          Cuentas por Cobrar
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Resumen por alumno con totales por meses seleccionados
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="flex-start">
            <Grid item xs={12} md={9}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Período lectivo</InputLabel>
                    <Select
                      value={periodoId}
                      label="Período lectivo"
                      onChange={(e) => { setPeriodoId(e.target.value as number) }}
                    >
                      {catalogos.periodos_lectivos.map(p => (
                        <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Turno</InputLabel>
                    <Select
                      value={turnoId}
                      label="Turno"
                      onChange={(e) => { setTurnoId(e.target.value as number); setGrupoId('' as any) }}
                    >
                      {catalogos.turnos.map(t => (
                        <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Grupo</InputLabel>
                    <Select
                      value={grupoId}
                      label="Grupo"
                      onChange={(e) => { setGrupoId(e.target.value as any) }}
                    >
                      <MenuItem value={'Todos'}>Todos</MenuItem>
                      {grupos.map(g => (
                        <MenuItem key={g.id} value={g.id}>
                          {g.grado?.nombre && g.seccion?.nombre
                            ? `${g.grado.nombre} - ${g.seccion.nombre}`
                            : g.nombre || `Grupo ${g.id}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={12} md={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Meses</InputLabel>
                    <Select
                      multiple
                      value={meses}
                      label="Meses"
                      onChange={(e) => setMeses(typeof e.target.value === 'string' ? e.target.value.split(',') : (e.target.value as string[]))}
                      renderValue={(selected) => selected.map(s => MES_ABREVIADO[s] || s.slice(0,3)).join(', ')}
                    >
                      {MESES_COMPLETOS.map(m => (
                        <MenuItem key={m} value={m}>
                          <Checkbox checked={meses.indexOf(m) > -1} size="small" />
                          <ListItemText primary={m === 'matricula' ? 'Matrícula' : m.charAt(0).toUpperCase() + m.slice(1)} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Checkbox
                        checked={soloPendientes}
                        onChange={(e) => setSoloPendientes(e.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                      />
                      <Typography>Filtrar solo los que no han pagado</Typography>
                    </Box>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {hasPermission('reporte_cuenta_x_cobrar.exportar_pdf') && (
                  <>
                    <Button
                      variant="contained"
                      color="info"
                      startIcon={printLoading ? <CircularProgress size={20} color="inherit" /> : <PrintIcon />}
                      onClick={handlePrintPdf}
                      disabled={printLoading || downloadLoading || excelLoading || !periodoId}
                      fullWidth
                    >
                      {printLoading ? 'Generando...' : 'Imprimir PDF'}
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={downloadLoading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                      onClick={handleDownloadPdf}
                      disabled={printLoading || downloadLoading || excelLoading || !periodoId}
                      fullWidth
                    >
                      {downloadLoading ? 'Descargando...' : 'Descargar PDF'}
                    </Button>
                  </>
                )}
                {hasPermission('reporte_cuenta_x_cobrar.exportar_pdf') && (
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={excelLoading ? <CircularProgress size={20} color="inherit" /> : <ExcelIcon />}
                    onClick={handleExportExcel}
                    disabled={printLoading || downloadLoading || excelLoading || !periodoId}
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
    </Box>
  )
}
