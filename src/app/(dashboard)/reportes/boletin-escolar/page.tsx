'use client'

import gruposService from '@/features/config-grupos/services/gruposService'
import { boletinEscolarService } from '@/features/reportes/services/boletinEscolarService'
import periodoLectivoService from '@/features/periodo-lectivo/services/periodoLectivoService'
import { usePermissions } from '@/hooks/usePermissions'
import { School as SchoolIcon } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const BoletinEscolarPage = () => {
  const { hasPermission, isSuperAdmin, user } = usePermissions()
  const isDocente = hasPermission('operaciones.docentes') && !isSuperAdmin
  const canView = isSuperAdmin || hasPermission('generar.boletin') || hasPermission('operaciones.docentes')

  const [periodos, setPeriodos] = useState<any[]>([])
  const [grupos, setGrupos] = useState<any[]>([])
  const [cortes, setCortes] = useState<any[]>([])

  const [filters, setFilters] = useState({
    periodo_lectivo_id: '',
    grupo_id: '',
    corte_id: '',
    mostrar_escala: true
  })

  const [loadingPeriodos, setLoadingPeriodos] = useState(false)
  const [loadingGrupos, setLoadingGrupos] = useState(false)
  const [loadingCortes, setLoadingCortes] = useState(false)
  const [generatingBoletin, setGeneratingBoletin] = useState(false)

  const loadPeriodos = async () => {
    setLoadingPeriodos(true)
    try {
      const resp = await periodoLectivoService.getAllPeriodosLectivos()
      setPeriodos(resp?.data || [])
    } catch { toast.error('Error al cargar periodos') }
    finally { setLoadingPeriodos(false) }
  }

  const loadGrupos = async (periodoId?: string) => {
    setLoadingGrupos(true)
    try {
      if (isDocente) {
        const resp = await gruposService.getMyActiveGroups()
        setGrupos(resp?.data || [])
      } else {
        if (!periodoId) return
        const resp = await boletinEscolarService.getGrupos(Number(periodoId))
        setGrupos(resp?.data || [])
      }
    } catch { setGrupos([]) }
    finally { setLoadingGrupos(false) }
  }

  const loadCortes = async (periodoId: number) => {
    setLoadingCortes(true)
    try {
      const resp = await boletinEscolarService.getCortes(periodoId)
      setCortes(resp?.data || [])
    } catch { toast.error('Error al cargar cortes') }
    finally { setLoadingCortes(false) }
  }

  // On mount: docente gets groups directly; admin gets periods
  useEffect(() => {
    if (!user) return
    if (isDocente) {
      loadGrupos()
    } else {
      loadPeriodos()
    }
  }, [user, isSuperAdmin])

  // Admin: reload groups + cortes when period changes
  useEffect(() => {
    if (!isDocente && filters.periodo_lectivo_id) {
      loadGrupos(filters.periodo_lectivo_id)
      loadCortes(Number(filters.periodo_lectivo_id))
      setFilters(prev => ({ ...prev, grupo_id: '', corte_id: '' }))
    }
  }, [filters.periodo_lectivo_id])

  // When group changes: derive periodoId and load cortes (important for docente)
  const handleGrupoChange = (grupoId: string) => {
    const selectedGrupo = grupos.find((g: any) => g.id === Number(grupoId))
    const periodoId = selectedGrupo?.periodo_lectivo_id
    setFilters(prev => ({
      ...prev,
      grupo_id: grupoId,
      corte_id: '',
      ...(periodoId ? { periodo_lectivo_id: String(periodoId) } : {})
    }))
    if (periodoId) loadCortes(periodoId)
  }

  const handleGenerarBoletinPDF = async () => {
    if (!filters.grupo_id || !filters.periodo_lectivo_id) {
      toast.error('Seleccione grupo')
      return
    }
    setGeneratingBoletin(true)
    try {
      await boletinEscolarService.generarBoletinPDF({
        grupo_id: Number(filters.grupo_id),
        periodo_lectivo_id: Number(filters.periodo_lectivo_id),
        corte_id: filters.corte_id || null,
        mostrar_escala: filters.mostrar_escala
      })
      toast.success('Boletín generado exitosamente')
    } catch {
      toast.error('Error al generar boletín')
    } finally {
      setGeneratingBoletin(false)
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
        <CardHeader title='Boletín Escolar' subheader='Genere boletines individuales por grupo' />
        <CardContent>
          <Grid container spacing={3} alignItems='center'>
            {/* Periodo Lectivo — solo admin */}
            {!isDocente && (
              <Grid item xs={12} md={4}>
                <TextField
                  select fullWidth size='small'
                  label='Periodo Lectivo'
                  value={filters.periodo_lectivo_id}
                  onChange={e => setFilters(prev => ({ ...prev, periodo_lectivo_id: e.target.value }))}
                  disabled={loadingPeriodos}
                  InputProps={{ endAdornment: loadingPeriodos ? <CircularProgress size={20} /> : null }}
                >
                  <MenuItem value=''>Seleccione un periodo</MenuItem>
                  {periodos.map((p: any) => (
                    <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            {/* Grupo */}
            <Grid item xs={12} md={4}>
              <TextField
                select fullWidth size='small'
                label='Grupo'
                value={filters.grupo_id}
                onChange={e => handleGrupoChange(e.target.value)}
                disabled={(isDocente ? false : !filters.periodo_lectivo_id) || loadingGrupos}
                InputProps={{ endAdornment: loadingGrupos ? <CircularProgress size={20} /> : null }}
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
                select fullWidth size='small'
                label='Corte Evaluativo'
                value={filters.corte_id}
                onChange={e => setFilters(prev => ({ ...prev, corte_id: e.target.value }))}
                disabled={!filters.grupo_id || loadingCortes}
                InputProps={{ endAdornment: loadingCortes ? <CircularProgress size={20} /> : null }}
              >
                <MenuItem value=''>Todos los cortes</MenuItem>
                {cortes.map((c: any) => (
                  <MenuItem key={c.id} value={c.id}>{c.nombre} ({c.semestre_nombre})</MenuItem>
                ))}
                <MenuItem value='S1'>PRIMER SEMESTRE</MenuItem>
                <MenuItem value='S2'>SEGUNDO SEMESTRE</MenuItem>
                <MenuItem value='NF'>NOTA FINAL</MenuItem>
              </TextField>
            </Grid>

            {/* Botón acción */}
            <Grid item xs={12}>
              <Button
                variant='contained' color='secondary'
                startIcon={generatingBoletin ? <CircularProgress size={18} color='inherit' /> : <SchoolIcon />}
                onClick={handleGenerarBoletinPDF}
                disabled={!filters.grupo_id || generatingBoletin}
              >
                Boletín Individual PDF
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Alert severity='info'>
              <Typography variant='body2'>
                <strong>Boletín Individual PDF:</strong> Genera un boletín por cada estudiante con calificaciones,
                inasistencias y observaciones.
              </Typography>
            </Alert>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default BoletinEscolarPage
