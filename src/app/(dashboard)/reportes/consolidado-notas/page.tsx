'use client'

import { boletinEscolarService } from '@/features/reportes/services/boletinEscolarService'
import { usePermissions } from '@/hooks/usePermissions'
import { FileDownload as FileDownloadIcon, PictureAsPdf as PictureAsPdfIcon } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const ConsolidadoNotasPage = () => {
  const { hasPermission, isSuperAdmin } = usePermissions()
  const canView = isSuperAdmin || hasPermission('generar.consolidado_notas')

  // Filter options
  const [periodos, setPeriodos] = useState<any[]>([])
  const [grupos, setGrupos] = useState<any[]>([])
  const [cortes, setCortes] = useState<any[]>([])

  // Selected filters
  const [filters, setFilters] = useState({
    periodo_lectivo_id: '',
    grupo_id: '',
    corte_id: '',
    mostrar_escala: false
  })

  // Loaders
  const [loadingPeriodos, setLoadingPeriodos] = useState(false)
  const [loadingGrupos, setLoadingGrupos] = useState(false)
  const [loadingCortes, setLoadingCortes] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)

  // Load academic periods on mount
  useEffect(() => {
    if (canView) {
      loadPeriodos()
    }
  }, [canView])

  // Load groups when period changes
  useEffect(() => {
    if (filters.periodo_lectivo_id) {
      loadGrupos(Number(filters.periodo_lectivo_id))
      loadCortes(Number(filters.periodo_lectivo_id))
    } else {
      setGrupos([])
      setCortes([])
    }
    setFilters(prev => ({ ...prev, grupo_id: '', corte_id: '' }))
  }, [filters.periodo_lectivo_id])

  const loadPeriodos = async () => {
    setLoadingPeriodos(true)
    try {
      const resp = await boletinEscolarService.getPeriodos()
      setPeriodos(resp?.data || [])
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar periodos')
    } finally {
      setLoadingPeriodos(false)
    }
  }

  const loadGrupos = async (periodoId: number) => {
    setLoadingGrupos(true)
    try {
      const resp = await boletinEscolarService.getGrupos(periodoId)
      setGrupos(resp?.data || [])
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar grupos')
    } finally {
      setLoadingGrupos(false)
    }
  }

  const loadCortes = async (periodoId: number) => {
    setLoadingCortes(true)
    try {
      const resp = await boletinEscolarService.getCortes(periodoId)
      setCortes(resp?.data || [])
    } catch (error) {
      console.error(error)
      toast.error('Error al cargar cortes')
    } finally {
      setLoadingCortes(false)
    }
  }

  const handleGenerarConsolidadoPDF = async () => {
    if (!filters.grupo_id || !filters.periodo_lectivo_id) {
      toast.error('Seleccione periodo y grupo')
      return
    }

    setGeneratingPDF(true)
    try {
      await boletinEscolarService.generarConsolidadoPDF({
        grupo_id: Number(filters.grupo_id),
        periodo_lectivo_id: Number(filters.periodo_lectivo_id),
        corte_id: filters.corte_id || null,
        mostrar_escala: filters.mostrar_escala
      })
      toast.success('PDF generado exitosamente')
    } catch (error) {
      console.error(error)
      toast.error('Error al generar PDF')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleExportExcel = async () => {
    if (!filters.grupo_id || !filters.periodo_lectivo_id) {
      toast.error('Seleccione periodo y grupo')
      return
    }

    setExportingExcel(true)
    try {
      await boletinEscolarService.exportConsolidadoExcel({
        grupo_id: Number(filters.grupo_id),
        periodo_lectivo_id: Number(filters.periodo_lectivo_id),
        corte_id: filters.corte_id || null,
        mostrar_escala: filters.mostrar_escala
      })
      toast.success('Excel exportado exitosamente')
    } catch (error) {
      console.error(error)
      toast.error('Error al exportar Excel')
    } finally {
      setExportingExcel(false)
    }
  }

  if (!canView) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='warning'>No tiene permisos para acceder a este reporte.</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader title='Consolidado de Notas' subheader='Genere reportes de notas consolidados por grupo' />
        <CardContent>
          <Grid container spacing={3}>
            {/* Periodo Lectivo */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label='Periodo Lectivo'
                value={filters.periodo_lectivo_id}
                onChange={e => setFilters(prev => ({ ...prev, periodo_lectivo_id: e.target.value }))}
                disabled={loadingPeriodos}
                InputProps={{
                  endAdornment: loadingPeriodos ? <CircularProgress size={20} /> : null
                }}
              >
                <MenuItem value=''>Seleccione un periodo</MenuItem>
                {periodos.map((p: any) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Grupo */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label='Grupo'
                value={filters.grupo_id}
                onChange={e => setFilters(prev => ({ ...prev, grupo_id: e.target.value }))}
                disabled={!filters.periodo_lectivo_id || loadingGrupos}
                InputProps={{
                  endAdornment: loadingGrupos ? <CircularProgress size={20} /> : null
                }}
              >
                <MenuItem value=''>Seleccione un grupo</MenuItem>
                {grupos.map((g: any) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.grado?.nombre} - {g.seccion?.nombre} ({g.turno?.nombre})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Corte */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label='Corte Evaluativo'
                value={filters.corte_id}
                onChange={e => setFilters(prev => ({ ...prev, corte_id: e.target.value }))}
                disabled={!filters.periodo_lectivo_id || loadingCortes}
                InputProps={{
                  endAdornment: loadingCortes ? <CircularProgress size={20} /> : null
                }}
              >
                <MenuItem value=''>Todos los cortes</MenuItem>
                {cortes.map((c: any) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nombre} ({c.semestre_nombre})
                  </MenuItem>
                ))}
                <MenuItem value='S1'>PRIMER SEMESTRE</MenuItem>
                <MenuItem value='S2'>SEGUNDO SEMESTRE</MenuItem>
                <MenuItem value='NF'>NOTA FINAL</MenuItem>
              </TextField>
            </Grid>

            {/* Mostrar Escala Checkbox */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.mostrar_escala}
                    onChange={e => setFilters(prev => ({ ...prev, mostrar_escala: e.target.checked }))}
                  />
                }
                label='Mostrar escala cualitativa'
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant='contained'
                  color='primary'
                  startIcon={generatingPDF ? <CircularProgress size={18} color='inherit' /> : <PictureAsPdfIcon />}
                  onClick={handleGenerarConsolidadoPDF}
                  disabled={!filters.grupo_id || !filters.periodo_lectivo_id || generatingPDF}
                >
                  Consolidado PDF
                </Button>

                <Button
                  variant='outlined'
                  color='success'
                  startIcon={exportingExcel ? <CircularProgress size={18} color='inherit' /> : <FileDownloadIcon />}
                  onClick={handleExportExcel}
                  disabled={!filters.grupo_id || !filters.periodo_lectivo_id || exportingExcel}
                >
                  Exportar Excel
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Info Box */}
          <Box sx={{ mt: 3 }}>
            <Alert severity='info'>
              <Typography variant='body2'>
                <strong>Consolidado PDF:</strong> Genera una sábana de notas con todos los estudiantes del grupo
                seleccionado.
              </Typography>
              <Typography variant='body2'>
                <strong>Exportar Excel:</strong> Descarga el consolidado de notas en formato Excel (.xlsx).
              </Typography>
            </Alert>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ConsolidadoNotasPage
