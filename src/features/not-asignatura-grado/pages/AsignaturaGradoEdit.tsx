'use client'
import { useEffect, useMemo, useState } from 'react'

import { useParams, useRouter, useSearchParams } from 'next/navigation'

import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material'
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Stack,
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
import { toast } from 'react-hot-toast'

import notAsignaturaGradoService from '../services/notAsignaturaGradoService'
import type {
    CorteEntry,
    Evidencia,
    HijaEntry,
    NotAsignaturaGradoFormData,
    ParametroEntry,
    ValidationErrors
} from '../types'

const defaultForm: NotAsignaturaGradoFormData = {
  periodo_lectivo_id: '',
  grado_id: '',
  materia_id: '',
  escala_id: '',
  nota_aprobar: 60,
  nota_maxima: 100,
  incluir_en_promedio: true,
  incluir_en_reporte_mined: false,
  incluir_horario: true,
  incluir_boletin: true,
  mostrar_escala: false,
  tipo_evaluacion: 'sumativa',
  es_para_educacion_iniciativa: false,
  permitir_copia: false,
  incluir_plan_clase: true,
  cortes: [],
  parametros: [{ parametro: 'EVALUACIONES', valor: '100' }],
  hijas: []
}

const AsignaturaGradoEdit = () => {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const idValue = params?.id
  const id = idValue ? Number(idValue) : undefined

  const [form, setForm] = useState<NotAsignaturaGradoFormData>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [originalCortesIds, setOriginalCortesIds] = useState<number[]>([])
  const [parcialesLoading, setParcialesLoading] = useState(false)
  const [alternativasAsignaturas, setAlternativasAsignaturas] = useState<any[]>([])
  const [alternativasParciales, setAlternativasParciales] = useState<any[]>([])
  const [errors, setErrors] = useState<ValidationErrors>({})

  // UI State
  const [activeTab, setActiveTab] = useState(0)
  const [evidenciasOpen, setEvidenciasOpen] = useState(false)
  const [evidenciasCorteId, setEvidenciasCorteId] = useState<number | null>(null)
  const [tempEvidencias, setTempEvidencias] = useState<Evidencia[]>([])

  // Catalogos
  const [materias, setMaterias] = useState<any[]>([])
  const [escalas, setEscalas] = useState<any[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)

  useEffect(() => {
    const loadCatalogs = async () => {
      setCatalogLoading(true)
      try {
        const catalogs = await notAsignaturaGradoService.getPeriodosYGrados()
        setMaterias(catalogs.materias || [])
        setEscalas(catalogs.escalas || [])
      } catch (error) {
        toast.error('Error al cargar catálogos base')
      } finally {
        setCatalogLoading(false)
      }
    }
    loadCatalogs()
  }, [])

  useEffect(() => {
    const init = async () => {
      if (id) {
        try {
          const payload = await notAsignaturaGradoService.getById(id)
          setForm({
            id: payload?.id,
            periodo_lectivo_id: payload?.periodo_lectivo_id ?? '',
            grado_id: payload?.grado_id ?? '',
            materia_id: payload?.materia_id ?? '',
            escala_id: payload?.escala_id ?? '',
            nota_aprobar: payload?.nota_aprobar ?? 60,
            nota_maxima: payload?.nota_maxima ?? 100,
            incluir_en_promedio: Boolean(payload?.incluir_en_promedio),
            incluir_en_reporte_mined: Boolean(payload?.incluir_en_reporte_mined),
            incluir_horario: payload?.incluir_horario !== undefined ? Boolean(payload?.incluir_horario) : true,
            incluir_boletin: payload?.incluir_boletin !== undefined ? Boolean(payload?.incluir_boletin) : true,
            mostrar_escala: Boolean(payload?.mostrar_escala),
            tipo_evaluacion: String(payload?.tipo_evaluacion || 'sumativa'),
            es_para_educacion_iniciativa: Boolean(payload?.es_para_educacion_iniciativa),
            permitir_copia: Boolean(payload?.permitir_copia), // Load from payload
            incluir_plan_clase: payload?.incluir_plan_clase !== undefined ? Boolean(payload?.incluir_plan_clase) : true,
            cortes: Array.isArray(payload?.cortes) ? payload.cortes : [],
            parametros: Array.isArray(payload?.parametros) ? payload.parametros : [],
            hijas: Array.isArray(payload?.hijas) ? payload.hijas : []
          })
          setOriginalCortesIds(
            (Array.isArray(payload?.cortes) ? payload.cortes : [])
              .map((c: any) => Number(c?.id))
              .filter((id: number) => Boolean(id))
          )
          // alternativas se cargan vía efecto reactivo (periodo/grado)
        } catch (error: any) {
          const message = error?.data?.message || 'No se pudo cargar el registro'
          toast.error(message)
          // mantener estado de carga gestionado por el efecto de alternativas
        }
      }

      if (!id) {
        const periodoQS = searchParams?.get('periodo_lectivo_id')
        const gradoQS = searchParams?.get('grado_id')
        if (periodoQS || gradoQS) {
          setForm(prev => ({
            ...prev,
            periodo_lectivo_id: periodoQS ? Number(periodoQS) : prev.periodo_lectivo_id,
            grado_id: gradoQS ? Number(gradoQS) : prev.grado_id
          }))
        }
      }
    }
    init()
  }, [id, searchParams])

  useEffect(() => {
    const controller = new AbortController()
    const loadAlternativas = async () => {
      if (!form.periodo_lectivo_id || !form.grado_id) {
        setParcialesLoading(false)
        return
      }
      try {
        setParcialesLoading(true)
        const alts = await notAsignaturaGradoService.getAlternativas(
          Number(form.periodo_lectivo_id),
          Number(form.grado_id),
          form.id,
          { signal: controller.signal }
        )
        const asigOpts = (alts.asignaturas || []).map((a: any) => ({
          id: Number(a.id ?? a.value),
          nombre: String(a.materia ?? a.nombre ?? a.label ?? '')
        }))
        const parcialesOpts = (alts.parciales || []).map((p: any) => ({
          id: Number(p.id ?? p.value),
          nombre: String(p.nombre ?? p.label ?? '')
        }))
        setAlternativasAsignaturas(asigOpts)
        setAlternativasParciales(parcialesOpts)
      } catch (error: any) {
        if (error?.name === 'AbortError') return
        const message = error?.data?.message || 'Error al cargar alternativas'
        toast.error(message)
      } finally {
        setParcialesLoading(false)
      }
    }
    loadAlternativas()
    return () => {
      controller.abort()
    }
  }, [form.periodo_lectivo_id, form.grado_id, form.id])

  const validate = (): boolean => {
    const fieldErrors: ValidationErrors = {}
    if (!form.materia_id) fieldErrors['materia_id'] = ['Campo requerido']
    if (!form.escala_id) fieldErrors['escala_id'] = ['Campo requerido']
    if (!form.nota_aprobar && form.nota_aprobar !== 0) fieldErrors['nota_aprobar'] = ['Campo requerido']
    if (!form.nota_maxima && form.nota_maxima !== 0) fieldErrors['nota_maxima'] = ['Campo requerido']
    setErrors(fieldErrors)
    return Object.keys(fieldErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Complete todos los campos requeridos')
      return
    }
    setLoading(true)
    try {
      const currentCorteIds = form.cortes.map(c => Number(c.id)).filter(id => Boolean(id))
      const removedCorteIds = originalCortesIds.filter(id => !currentCorteIds.includes(id))
      if (removedCorteIds.length) {
        await Promise.all(removedCorteIds.map(id => notAsignaturaGradoService.removeCorte(id)))
      }
      const payload = {
        id: form.id,
        ...(form.periodo_lectivo_id ? { periodo_lectivo_id: Number(form.periodo_lectivo_id) } : {}),
        ...(form.grado_id ? { grado_id: Number(form.grado_id) } : {}),
        materia_id: Number(form.materia_id),
        escala_id: Number(form.escala_id),
        nota_aprobar: Number(form.nota_aprobar),
        nota_maxima: Number(form.nota_maxima),
        incluir_en_promedio: form.incluir_en_promedio,
        incluir_en_reporte_mined: form.incluir_en_reporte_mined,
        incluir_horario: form.incluir_horario,
        incluir_boletin: form.incluir_boletin,
        mostrar_escala: form.mostrar_escala,
        tipo_evaluacion: form.tipo_evaluacion,
        es_para_educacion_iniciativa: form.es_para_educacion_iniciativa,
        permitir_copia: form.permitir_copia,
        incluir_plan_clase: form.incluir_plan_clase,
        cortes: form.cortes,
        parametros: form.parametros,
        hijas: form.hijas
      }
      await notAsignaturaGradoService.upsert(payload)
      toast.success(form.id ? 'Registro actualizado' : 'Registro creado')
      const q = new URLSearchParams()
      if (form.periodo_lectivo_id) q.set('periodo_lectivo_id', String(form.periodo_lectivo_id))
      if (form.grado_id) q.set('grado_id', String(form.grado_id))
      router.push(`/academico/asignaturas-por-grado${q.toString() ? `?${q.toString()}` : ''}`)
    } catch (error: any) {
      const data = error?.data || {}
      const specific = data?.errors?.configuracion?.[0]
      if (specific) toast.error(specific)
      const backendErrors = (data?.errors || {}) as ValidationErrors
      setErrors(backendErrors)
      const message = data?.message || 'Error al guardar'
      if (!specific) toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const addCorte = () => {
    const nuevo: CorteEntry = { corte_id: 0, evidencias: [] }
    setForm(prev => ({ ...prev, cortes: [...prev.cortes, nuevo] }))
    if (errors.cortes) setErrors(prev => ({ ...prev, cortes: [] }))
  }
  const removeCorte = (index: number) => {
    setForm(prev => ({ ...prev, cortes: prev.cortes.filter((_, i) => i !== index) }))
    if (errors.cortes) setErrors(prev => ({ ...prev, cortes: [] }))
  }
  const updateCorte = (index: number, patch: Partial<CorteEntry>) => {
    setForm(prev => ({
      ...prev,
      cortes: prev.cortes.map((c, i) => (i === index ? { ...c, ...patch } : c))
    }))
    if (errors.cortes) setErrors(prev => ({ ...prev, cortes: [] }))
  }

  const addEvidencia = (corteIndex: number) => {
    const nueva: Evidencia = { evidencia: '', indicador: null }
    setForm(prev => ({
      ...prev,
      cortes: prev.cortes.map((c, i) => (i === corteIndex ? { ...c, evidencias: [...c.evidencias, nueva] } : c))
    }))
    if (errors.cortes) setErrors(prev => ({ ...prev, cortes: [] }))
  }
  const removeEvidencia = (corteIndex: number, evidenciaIndex: number) => {
    setForm(prev => ({
      ...prev,
      cortes: prev.cortes.map((c, i) =>
        i === corteIndex ? { ...c, evidencias: c.evidencias.filter((_, j) => j !== evidenciaIndex) } : c
      )
    }))
    if (errors.cortes) setErrors(prev => ({ ...prev, cortes: [] }))
  }
  const updateEvidencia = (corteIndex: number, evidenciaIndex: number, patch: Partial<Evidencia>) => {
    setForm(prev => ({
      ...prev,
      cortes: prev.cortes.map((c, i) =>
        i === corteIndex
          ? {
              ...c,
              evidencias: c.evidencias.map((e, j) => (j === evidenciaIndex ? { ...e, ...patch } : e))
            }
          : c
      )
    }))
    if (errors.cortes) setErrors(prev => ({ ...prev, cortes: [] }))
  }

  const addParametro = () => {
    const nuevo: ParametroEntry = { parametro: '', valor: '' }
    setForm(prev => ({ ...prev, parametros: [...prev.parametros, nuevo] }))
    if (errors.parametros) setErrors(prev => ({ ...prev, parametros: [] }))
  }
  const removeParametro = (index: number) => {
    setForm(prev => ({ ...prev, parametros: prev.parametros.filter((_, i) => i !== index) }))
    if (errors.parametros) setErrors(prev => ({ ...prev, parametros: [] }))
  }
  const updateParametro = (index: number, patch: Partial<ParametroEntry>) => {
    setForm(prev => ({
      ...prev,
      parametros: prev.parametros.map((p, i) => (i === index ? { ...p, ...patch } : p))
    }))
    if (errors.parametros) setErrors(prev => ({ ...prev, parametros: [] }))
  }

  const addHija = () => {
    const nuevo: HijaEntry = { asignatura_hija_id: 0 }
    setForm(prev => ({ ...prev, hijas: [...prev.hijas, nuevo] }))
    if (errors.hijas) setErrors(prev => ({ ...prev, hijas: [] }))
  }
  const removeHija = (index: number) => {
    setForm(prev => ({ ...prev, hijas: prev.hijas.filter((_, i) => i !== index) }))
    if (errors.hijas) setErrors(prev => ({ ...prev, hijas: [] }))
  }
  const updateHija = (index: number, patch: Partial<HijaEntry>) => {
    setForm(prev => ({
      ...prev,
      hijas: prev.hijas.map((h, i) => (i === index ? { ...h, ...patch } : h))
    }))
    if (errors.hijas) setErrors(prev => ({ ...prev, hijas: [] }))
  }

  const title = useMemo(() => (id ? 'Editar Asignatura por Grado' : 'Nueva Asignatura por Grado'), [id])

  const corteNombre = useMemo(() => {
    if (!evidenciasCorteId) return ''
    const found = alternativasParciales.find(p => p.id === evidenciasCorteId)
    return found ? found.nombre : ''
  }, [evidenciasCorteId, alternativasParciales])

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4'>{title}</Typography>
        <Typography variant='body2' color='text.secondary'>
          Complete los campos requeridos
        </Typography>
      </Box>

      <Card>
        <CardContent>
          {catalogLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8} md={8}>
                <Autocomplete
                  size='small'
                  options={materias}
                  value={materias.find(m => m.id === form.materia_id) || null}
                  onChange={(_, option) => {
                    setForm(prev => ({ ...prev, materia_id: option ? option.id : '' }))
                    if (errors.materia_id) setErrors(prev => ({ ...prev, materia_id: [] }))
                  }}
                  getOptionLabel={o => (o?.nombre ? `${o.nombre}${o?.abreviatura ? ` (${o.abreviatura})` : ''}` : '')}
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  renderInput={params => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      label='Materia'
                      error={Boolean(errors.materia_id?.length)}
                      helperText={errors.materia_id?.[0] || ''}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4} md={4}>
                <TextField
                  select
                  size='small'
                  fullWidth
                  required
                  label='Escala'
                  value={form.escala_id}
                  error={Boolean(errors.escala_id?.length)}
                  helperText={errors.escala_id?.[0] || ''}
                  onChange={e => {
                    setForm(prev => ({ ...prev, escala_id: Number(e.target.value) }))
                    if (errors.escala_id) setErrors(prev => ({ ...prev, escala_id: [] }))
                  }}
                >
                  <MenuItem value=''>Seleccione</MenuItem>
                  {escalas.map(e => (
                    <MenuItem key={e.id} value={e.id}>
                      {e.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4} md={4}>
                <TextField
                  size='small'
                  fullWidth
                  required
                  label='Nota aprobar'
                  type='number'
                  value={form.nota_aprobar}
                  error={Boolean(errors.nota_aprobar?.length)}
                  helperText={errors.nota_aprobar?.[0] || ''}
                  onChange={e => {
                    setForm(prev => ({ ...prev, nota_aprobar: Number(e.target.value) }))
                    if (errors.nota_aprobar) setErrors(prev => ({ ...prev, nota_aprobar: [] }))
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4} md={4}>
                <TextField
                  size='small'
                  fullWidth
                  required
                  label='Nota máxima'
                  type='number'
                  value={form.nota_maxima}
                  error={Boolean(errors.nota_maxima?.length)}
                  helperText={errors.nota_maxima?.[0] || ''}
                  onChange={e => {
                    setForm(prev => ({ ...prev, nota_maxima: Number(e.target.value) }))
                    if (errors.nota_maxima) setErrors(prev => ({ ...prev, nota_maxima: [] }))
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4} md={4}>
                <TextField
                  select
                  size='small'
                  fullWidth
                  label='Tipo de evaluación'
                  value={form.tipo_evaluacion}
                  onChange={e => setForm(prev => ({ ...prev, tipo_evaluacion: e.target.value }))}
                >
                  <MenuItem value='promedio'>promedio</MenuItem>
                  <MenuItem value='sumativa'>sumativa</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4} md={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size='small'
                      checked={form.incluir_en_promedio}
                      onChange={e => setForm(prev => ({ ...prev, incluir_en_promedio: e.target.checked }))}
                    />
                  }
                  label='Incluir en promedio'
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size='small'
                      checked={form.incluir_en_reporte_mined}
                      onChange={e => setForm(prev => ({ ...prev, incluir_en_reporte_mined: e.target.checked }))}
                    />
                  }
                  label='Incluir en reporte MINED'
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size='small'
                      checked={form.incluir_horario}
                      onChange={e => setForm(prev => ({ ...prev, incluir_horario: e.target.checked }))}
                    />
                  }
                  label='Incluir en Horarios'
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size='small'
                      checked={form.incluir_boletin}
                      onChange={e => setForm(prev => ({ ...prev, incluir_boletin: e.target.checked }))}
                    />
                  }
                  label='Incluir en Boletín'
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size='small'
                      checked={form.mostrar_escala}
                      onChange={e => setForm(prev => ({ ...prev, mostrar_escala: e.target.checked }))}
                    />
                  }
                  label='Mostrar solo Escala'
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size='small'
                      checked={form.es_para_educacion_iniciativa}
                      onChange={e => setForm(prev => ({ ...prev, es_para_educacion_iniciativa: e.target.checked }))}
                    />
                  }
                  label='Esta asignatura es para educación inicial'
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size='small'
                      checked={form.permitir_copia}
                      onChange={e => setForm(prev => ({ ...prev, permitir_copia: e.target.checked }))}
                    />
                  }
                  label='Permitir Copia de Planes'
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size='small'
                      checked={form.incluir_plan_clase}
                      onChange={e => setForm(prev => ({ ...prev, incluir_plan_clase: e.target.checked }))}
                    />
                  }
                  label='Incluir en Planes de Clases'
                />
              </Grid>

              <Grid item xs={12}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
                  <Tab label='Cortes' />
                  <Tab label='Parámetros' />
                  <Tab label='Asignaturas hijas' />
                </Tabs>

                {activeTab === 0 && (
                  <Box>
                    <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 1 }}>
                      <Typography variant='h6'>Cortes</Typography>
                    </Stack>
                    {errors.cortes?.length ? (
                      <Alert severity='error' sx={{ mb: 2 }}>
                        {errors.cortes[0]}
                      </Alert>
                    ) : null}
                    <TableContainer component={Paper} variant='outlined'>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell width={80}>Seleccionar</TableCell>
                            <TableCell>Parcial</TableCell>
                            <TableCell align='right' width={160}>
                              Acciones
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {parcialesLoading ? (
                            <TableRow>
                              <TableCell colSpan={3}>
                                <Stack direction='row' spacing={1} alignItems='center'>
                                  <CircularProgress size={18} />
                                  <Typography variant='body2'>Cargando parciales...</Typography>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ) : alternativasParciales.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3}>No disponible (requiere periodo/grado)</TableCell>
                            </TableRow>
                          ) : (
                            alternativasParciales.map(p => {
                              const selectedIndex = form.cortes.findIndex(c => c.corte_id === p.id)
                              const isSelected = selectedIndex !== -1
                              return (
                                <TableRow key={p.id} hover>
                                  <TableCell>
                                    <Checkbox
                                      size='small'
                                      checked={isSelected}
                                      disabled={parcialesLoading}
                                      onChange={e => {
                                        const checked = e.target.checked
                                        setForm(prev => ({
                                          ...prev,
                                          cortes: checked
                                            ? [...prev.cortes, { corte_id: p.id, evidencias: [] }]
                                            : prev.cortes.filter(c => c.corte_id !== p.id)
                                        }))
                                        if (errors.cortes) setErrors(prev => ({ ...prev, cortes: [] }))
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>{p.nombre}</TableCell>
                                  <TableCell align='right'>
                                    <Button
                                      variant='outlined'
                                      size='small'
                                      startIcon={<AddIcon />}
                                      disabled={!isSelected || parcialesLoading}
                                      onClick={e => {
                                        ;(e.currentTarget as HTMLButtonElement).blur()
                                        const idx = form.cortes.findIndex(c => c.corte_id === p.id)
                                        const evs = idx !== -1 ? form.cortes[idx].evidencias : []
                                        const normalized = (
                                          evs.length ? evs : [{ evidencia: '', indicador: { criterios: [] } }]
                                        ).map(e => ({
                                          ...e,
                                          indicador:
                                            e.indicador && Array.isArray((e.indicador as any).criterios)
                                              ? { criterios: (e.indicador as any).criterios, type: (e.indicador as any).type || 'checkbox' }
                                              : e.indicador && (e.indicador as any).criterio
                                                ? { criterios: [String((e.indicador as any).criterio || '')], type: (e.indicador as any).type || 'checkbox' }
                                                : { criterios: [], type: (e.indicador as any)?.type || 'checkbox' }
                                        }))
                                        setTempEvidencias(normalized)
                                        setEvidenciasCorteId(p.id)
                                        setEvidenciasOpen(true)
                                      }}
                                    >
                                      Evidencias
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              )
                            })
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Dialog open={evidenciasOpen} onClose={() => setEvidenciasOpen(false)} fullWidth maxWidth='md'>
                      <DialogTitle>{`Evidencias${corteNombre ? ` - ${corteNombre}` : ''}`}</DialogTitle>
                      <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 0 }}>
                          {tempEvidencias.map((ev, ei) => (
                            <Grid item xs={12} key={`modal-ev-${ei}`}>
                              <Stack direction='row' spacing={2} alignItems='center'>
                                <TextField
                                  size='small'
                                  label='Evidencia'
                                  value={ev.evidencia}
                                  onChange={e => {
                                    const val = e.target.value
                                    setTempEvidencias(prev =>
                                      prev.map((x, i) => (i === ei ? { ...x, evidencia: val } : x))
                                    )
                                  }}
                                  sx={{ flex: 1 }}
                                  autoFocus={ei === 0}
                                />
                                <TextField
                                  select
                                  size='small'
                                  label='Modo'
                                  value={(ev.indicador as any)?.type || 'checkbox'}
                                  onChange={e => {
                                    const val = e.target.value
                                    setTempEvidencias(prev =>
                                      prev.map((x, i) => i === ei ? {
                                        ...x,
                                        indicador: {
                                          ...((x.indicador as any) || { criterios: [] }),
                                          type: val
                                        }
                                      } : x)
                                    )
                                  }}
                                  sx={{ flex: 1, maxWidth: 170 }}
                                >
                                  <MenuItem value='checkbox'>Casillas (múltiple)</MenuItem>
                                  <MenuItem value='select'>Opciones (Radio/Select)</MenuItem>
                                </TextField>
                                <Stack direction='row' spacing={1} sx={{ flex: 1, flexWrap: 'wrap' }}>
                                  {(ev.indicador as any)?.criterios?.map((crit: string, ci: number) => (
                                    <Stack key={`crit-${ei}-${ci}`} direction='row' spacing={0.5} alignItems='center'>
                                      <TextField
                                        size='small'
                                        label={(ev.indicador as any)?.type === 'select' ? 'Opción de Select' : 'Indicador criterio'}
                                        value={crit}
                                        onChange={e => {
                                          const val = e.target.value
                                          setTempEvidencias(prev =>
                                            prev.map((x, i) =>
                                              i === ei
                                                ? {
                                                    ...x,
                                                    indicador: {
                                                      ...((x.indicador as any) || { criterios: [] }),
                                                      criterios: ((x.indicador as any)?.criterios || []).map(
                                                        (c: string, idx: number) => (idx === ci ? val : c)
                                                      )
                                                    }
                                                  }
                                                : x
                                            )
                                          )
                                        }}
                                        sx={{ minWidth: 200 }}
                                      />
                                      <IconButton
                                        color='error'
                                        onClick={() => {
                                          setTempEvidencias(prev =>
                                            prev.map((x, i) =>
                                              i === ei
                                                ? {
                                                    ...x,
                                                    indicador: {
                                                      ...((x.indicador as any) || { criterios: [] }),
                                                      criterios: ((x.indicador as any)?.criterios || []).filter(
                                                        (_: string, idx: number) => idx !== ci
                                                      )
                                                    }
                                                  }
                                                : x
                                            )
                                          )
                                        }}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Stack>
                                  ))}
                                  <Button
                                    variant='outlined'
                                    size='small'
                                    startIcon={<AddIcon />}
                                    onClick={() => {
                                      setTempEvidencias(prev =>
                                        prev.map((x, i) =>
                                          i === ei
                                            ? {
                                                ...x,
                                                indicador: {
                                                  ...((x.indicador as any) || { criterios: [] }),
                                                  criterios: [
                                                    ...(((x.indicador as any)?.criterios as string[]) || []),
                                                    ''
                                                  ]
                                                }
                                              }
                                            : x
                                        )
                                      )
                                    }}
                                  >
                                    {(ev.indicador as any)?.type === 'select' ? 'Agregar opción' : 'Agregar indicador'}
                                  </Button>
                                </Stack>
                                <IconButton
                                  color='error'
                                  onClick={() => setTempEvidencias(prev => prev.filter((_, i) => i !== ei))}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Stack>
                            </Grid>
                          ))}
                        </Grid>
                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant='outlined'
                            startIcon={<AddIcon />}
                            onClick={() => setTempEvidencias(prev => [...prev, { evidencia: '', indicador: null }])}
                          >
                            Agregar evidencia
                          </Button>
                        </Box>
                      </DialogContent>
                      <DialogActions>
                        <Button
                          variant='contained'
                          onClick={() => {
                            if (evidenciasCorteId == null) {
                              setEvidenciasOpen(false)
                              return
                            }
                            const toSave = tempEvidencias.map(ev => ({
                              ...ev,
                              indicador:
                                (ev as any)?.indicador?.criterios && (ev as any).indicador.criterios.length > 0
                                  ? { criterios: (ev as any).indicador.criterios, type: (ev as any).indicador.type || 'checkbox' }
                                  : null
                            }))
                            setForm(prev => ({
                              ...prev,
                              cortes: prev.cortes.map(c =>
                                c.corte_id === evidenciasCorteId ? { ...c, evidencias: toSave } : c
                              )
                            }))
                            if (errors.cortes) setErrors(prev => ({ ...prev, cortes: [] }))
                            setEvidenciasOpen(false)
                          }}
                        >
                          Guardar
                        </Button>
                        <Button variant='outlined' onClick={() => setEvidenciasOpen(false)}>
                          Cerrar
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </Box>
                )}

                {activeTab === 1 && (
                  <Box>
                    <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 1 }}>
                      <Typography variant='h6'>Parámetros</Typography>
                      <Button variant='outlined' startIcon={<AddIcon />} onClick={addParametro}>
                        Agregar parámetro
                      </Button>
                    </Stack>
                    {errors.parametros?.length ? (
                      <Alert severity='error' sx={{ mb: 2 }}>
                        {errors.parametros[0]}
                      </Alert>
                    ) : null}
                    <Grid container spacing={2}>
                      {form.parametros.map((p, pi) => (
                        <Grid item xs={12} md={6} key={`param-${pi}`}>
                          <Stack direction='row' spacing={2} alignItems='center'>
                            <TextField
                              size='small'
                              label='Parámetro'
                              value={p.parametro}
                              onChange={e => updateParametro(pi, { parametro: e.target.value })}
                              sx={{ flex: 1 }}
                              error={Boolean(errors.parametros?.length)}
                              helperText={errors.parametros?.[0] || ''}
                            />
                            <TextField
                              size='small'
                              label='Valor'
                              value={p.valor}
                              onChange={e => updateParametro(pi, { valor: e.target.value })}
                              sx={{ flex: 1 }}
                              error={Boolean(errors.parametros?.length)}
                              helperText={errors.parametros?.[0] || ''}
                            />
                            <IconButton color='error' onClick={() => removeParametro(pi)}>
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {activeTab === 2 && (
                  <Box>
                    <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 1 }}>
                      <Typography variant='h6'>Asignaturas hijas</Typography>
                      <Button variant='outlined' startIcon={<AddIcon />} onClick={addHija}>
                        Agregar hija
                      </Button>
                    </Stack>
                    {errors.hijas?.length ? (
                      <Alert severity='error' sx={{ mb: 2 }}>
                        {errors.hijas[0]}
                      </Alert>
                    ) : null}
                    <Grid container spacing={2}>
                      {form.hijas.map((h, hi) => (
                        <Grid item xs={12} md={6} key={`hija-${hi}`}>
                          <Stack direction='row' spacing={2} alignItems='center'>
                            <TextField
                              select
                              size='small'
                              label='Asignatura hija'
                              value={h.asignatura_hija_id}
                              onChange={e => updateHija(hi, { asignatura_hija_id: Number(e.target.value) })}
                              sx={{ flex: 1 }}
                              disabled={alternativasAsignaturas.length === 0}
                              error={Boolean(errors.hijas?.length)}
                              helperText={errors.hijas?.[0] || ''}
                            >
                              {alternativasAsignaturas.length === 0 ? (
                                <MenuItem value={0}>No disponible (requiere periodo/grado)</MenuItem>
                              ) : (
                                alternativasAsignaturas.map(a => (
                                  <MenuItem key={a.id} value={a.id}>
                                    {a.nombre}
                                  </MenuItem>
                                ))
                              )}
                            </TextField>
                            <IconButton color='error' onClick={() => removeHija(hi)}>
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <Stack direction='row' justifyContent='flex-end' spacing={2}>
                  <Button variant='contained' startIcon={<SaveIcon />} onClick={handleSubmit} disabled={loading}>
                    {loading ? <CircularProgress size={18} /> : 'Guardar'}
                  </Button>
                  <Button
                    variant='outlined'
                    onClick={() => {
                      const q = new URLSearchParams()
                      if (form.periodo_lectivo_id) q.set('periodo_lectivo_id', String(form.periodo_lectivo_id))
                      if (form.grado_id) q.set('grado_id', String(form.grado_id))
                      router.push(`/academico/asignaturas-por-grado${q.toString() ? `?${q.toString()}` : ''}`)
                    }}
                  >
                    Cancelar
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default AsignaturaGradoEdit
