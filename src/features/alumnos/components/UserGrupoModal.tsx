'use client'

import { useState, useEffect, useCallback } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Alert,
  CircularProgress,
  Box
} from '@mui/material'
import { toast } from 'react-hot-toast'

import { UsersGruposService } from '../services/usersGruposService'
import type { UserGrupo, UserGrupoFormData, ValidationErrors, PeriodoLectivo, Grado, Grupo, Turno } from '../types'

interface UserGrupoModalProps {
  open: boolean
  mode: 'create' | 'edit'
  userGrupo?: UserGrupo
  userId: number
  onClose: () => void
  onSuccess: () => void
}

const initialFormData: UserGrupoFormData = {
  user_id: 0,
  fecha_matricula: '', // Dejar vacío para que se establezca dinámicamente
  periodo_lectivo_id: null,
  grado_id: null,
  grupo_id: null,
  turno_id: null,
  numero_recibo: '',
  maestra_anterior: '',
  tipo_ingreso: 'nuevo_ingreso',
  estado: 'activo',
  activar_estadistica: false,
  corte_retiro: null,
  corte_ingreso: null
}

export default function UserGrupoModal({ open, mode, userGrupo, userId, onClose, onSuccess }: UserGrupoModalProps) {
  // Estados
  const [formData, setFormData] = useState<UserGrupoFormData>(initialFormData)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Estados para opciones de selects
  const [periodosLectivos, setPeriodosLectivos] = useState<PeriodoLectivo[]>([])
  const [grados, setGrados] = useState<Grado[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  // Cargar opciones para los selects
  const loadOptions = useCallback(async () => {
    try {
      setLoadingOptions(true)

      // Cargar períodos lectivos, grados y turnos en paralelo
      const [periodosData, gradosData, turnosData] = await Promise.all([
        UsersGruposService.getPeriodosLectivos(),
        UsersGruposService.getGrados(),
        UsersGruposService.getTurnos()
      ])

      setPeriodosLectivos(periodosData)
      setGrados(gradosData)
      setTurnos(turnosData)
    } catch (error) {
      console.error('Error loading options:', error)
      toast.error('Error al cargar las opciones')
    } finally {
      setLoadingOptions(false)
    }
  }, [])

  // Cargar grupos filtrados cuando cambien período, grado o turno
  const loadGruposFiltered = useCallback(async (periodoId: number, gradoId: number, turnoId: number) => {
    try {
      const gruposData = await UsersGruposService.getGruposFiltered(periodoId, gradoId, turnoId)
      setGrupos(gruposData)
    } catch (error) {
      console.error('Error loading filtered grupos:', error)
      setGrupos([])
    }
  }, [])

  // Efectos
  useEffect(() => {
    if (open) {
      loadOptions()

      if (mode === 'edit' && userGrupo) {
        // Convertir fecha del backend al formato yyyy-MM-dd para el input date
        const formatDateForInput = (dateString: string) => {
          if (!dateString) return ''
          // Si la fecha viene en formato ISO, extraer solo la parte de la fecha
          if (dateString.includes('T')) {
            return dateString.split('T')[0]
          }
          // Si ya está en formato yyyy-MM-dd, devolverla tal como está
          return dateString
        }

        const editFormData = {
          user_id: userGrupo.user_id,
          fecha_matricula: formatDateForInput(userGrupo.fecha_matricula),
          periodo_lectivo_id: userGrupo.periodo_lectivo_id,
          grado_id: userGrupo.grado_id,
          grupo_id: userGrupo.grupo_id,
          turno_id: userGrupo.turno_id,
          numero_recibo: userGrupo.numero_recibo || '',
          maestra_anterior: userGrupo.maestra_anterior || '',
          tipo_ingreso: userGrupo.tipo_ingreso,
          estado: userGrupo.estado,
          activar_estadistica: userGrupo.activar_estadistica,
          corte_retiro: userGrupo.corte_retiro,
          corte_ingreso: userGrupo.corte_ingreso
        }

        setFormData(editFormData)

        // Cargar grupos filtrados para el registro en edición
        if (editFormData.periodo_lectivo_id && editFormData.grado_id && editFormData.turno_id) {
          loadGruposFiltered(editFormData.periodo_lectivo_id, editFormData.grado_id, editFormData.turno_id)
        }
      } else {
        // En modo create, generar una nueva fecha actual cada vez que se abre el modal
        // Usar fecha local en lugar de UTC para evitar problemas de zona horaria
        const today = new Date()
        const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000))
        setFormData({
          ...initialFormData,
          user_id: userId,
          fecha_matricula: localDate.toISOString().split('T')[0]
        })
      }

      setErrors({})
      setGeneralError(null)
    }
  }, [open, mode, userGrupo, userId, loadGruposFiltered])

  // useEffect adicional para forzar la actualización de la fecha en modo create
  useEffect(() => {
    if (open && mode === 'create') {
      // Forzar actualización de la fecha después de que el modal se abra
      // Usar fecha local en lugar de UTC para evitar problemas de zona horaria
      setTimeout(() => {
        const today = new Date()
        const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000))
        setFormData(prev => ({
          ...prev,
          fecha_matricula: localDate.toISOString().split('T')[0]
        }))
      }, 100)
    }
  }, [open, mode])

  // Validar que los valores del formData coincidan con las opciones disponibles
  useEffect(() => {
    if (mode === 'edit' && userGrupo && periodosLectivos.length > 0 && grados.length > 0 && turnos.length > 0) {
      setFormData(prevData => {
        const validatedData = { ...prevData }
        let hasChanges = false

        // Validar periodo_lectivo_id
        if (
          validatedData.periodo_lectivo_id &&
          !periodosLectivos.find(p => p.id === validatedData.periodo_lectivo_id)
        ) {
          validatedData.periodo_lectivo_id = null
          hasChanges = true
        }

        // Validar grado_id
        if (validatedData.grado_id && !grados.find(g => g.id === validatedData.grado_id)) {
          validatedData.grado_id = null
          hasChanges = true
        }

        // Validar turno_id
        if (validatedData.turno_id && !turnos.find(t => t.id === validatedData.turno_id)) {
          validatedData.turno_id = null
          hasChanges = true
        }

        // Validar grupo_id (solo si hay grupos cargados)
        if (validatedData.grupo_id && grupos.length > 0 && !grupos.find(g => g.id === validatedData.grupo_id)) {
          validatedData.grupo_id = null
          hasChanges = true
        }

        return hasChanges ? validatedData : prevData
      })
    }
  }, [mode, userGrupo, periodosLectivos, grados, turnos, grupos])

  // Función auxiliar para obtener valor seguro para Select
  const getSafeSelectValue = (value: number | null, options: any[]): number | string => {
    if (value === null || value === undefined) return ''

    // Verificar si el valor existe en las opciones
    const exists = options.some(option => option.id === value)
    return exists ? value : ''
  }

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    if (!formData.fecha_matricula) {
      newErrors.fecha_matricula = ['La fecha de matrícula es requerida']
    }

    if (!formData.periodo_lectivo_id) {
      newErrors.periodo_lectivo_id = ['El período lectivo es requerido']
    }

    if (!formData.grado_id) {
      newErrors.grado_id = ['El grado es requerido']
    }

    if (!formData.turno_id) {
      newErrors.turno_id = ['El turno es requerido']
    }

    if (!formData.tipo_ingreso.trim()) {
      newErrors.tipo_ingreso = ['El tipo de ingreso es requerido']
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manejo de cambios en el formulario
  const handleChange = (field: keyof UserGrupoFormData, value: any) => {
    // Si cambia tipo_ingreso a algo distinto de 'reingreso', limpiar maestra_anterior
    if (field === 'tipo_ingreso') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        maestra_anterior: value === 'reingreso' ? prev.maestra_anterior || '' : ''
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }

    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Si cambia período, grado o turno, cargar grupos filtrados
    if (field === 'periodo_lectivo_id' || field === 'grado_id' || field === 'turno_id') {
      const newFormData = { ...formData, [field]: value }

      // Limpiar grupo seleccionado cuando cambien los filtros
      setFormData(prev => ({
        ...prev,
        [field]: value,
        grupo_id: null
      }))

      // Cargar grupos si todos los filtros están seleccionados
      if (newFormData.periodo_lectivo_id && newFormData.grado_id && newFormData.turno_id) {
        loadGruposFiltered(newFormData.periodo_lectivo_id, newFormData.grado_id, newFormData.turno_id)
      } else {
        setGrupos([])
      }
    }
  }

  // Método específico para procesar errores del backend
  const processBackendErrors = (errorData: any) => {
    // Verificar si hay errores específicos (ej: usuario ya matriculado)
    if (errorData.errors?.user_id) {
      const userError = Array.isArray(errorData.errors.user_id) ? errorData.errors.user_id[0] : errorData.errors.user_id
      toast.error(userError)
      return
    }

    // Procesar errores de validación para campos específicos
    if (errorData.errors && Object.keys(errorData.errors).length > 0) {
      const newFieldErrors: ValidationErrors = {}

      Object.keys(errorData.errors).forEach(field => {
        // Saltar campos que ya se manejan específicamente arriba
        if (field === 'user_id') return

        const errorMessages = Array.isArray(errorData.errors[field])
          ? errorData.errors[field]
          : [errorData.errors[field]]

        if (errorMessages.length > 0 && errorMessages[0]) {
          newFieldErrors[field] = errorMessages
        }
      })

      if (Object.keys(newFieldErrors).length > 0) {
        setErrors(newFieldErrors)
        toast.error('Por favor corrige los errores en el formulario')
        return
      }
    }

    // Mostrar mensaje general si no hay errores específicos
    if (errorData.message) {
      toast.error(errorData.message)
    } else {
      toast.error('Error al procesar la solicitud')
    }
  }

  // Manejo del envío del formulario
  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setGeneralError(null)
      setErrors({}) // Limpiar errores previos

      let response

      if (mode === 'create') {
        response = await UsersGruposService.createUserGrupo(formData)
      } else if (userGrupo) {
        response = await UsersGruposService.updateUserGrupo(userGrupo.id, formData)
      }

      if (response?.success) {
        toast.success(response.message)
        onSuccess()
        onClose()
      } else {
        // Usar la función processBackendErrors para manejar errores
        processBackendErrors(response || {})
      }
    } catch (error: any) {
      console.error('Error saving user grupo:', error)

      // Usar la función processBackendErrors para manejar errores
      const errorData = error.data || {}
      processBackendErrors(errorData)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>{mode === 'create' ? 'Nueva Matrícula' : 'Editar Matrícula'}</DialogTitle>

      <DialogContent>
        {generalError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {generalError}
          </Alert>
        )}

        {loadingOptions ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Fecha de Matrícula */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Fecha de Matrícula'
                type='date'
                value={formData.fecha_matricula}
                onChange={e => handleChange('fecha_matricula', e.target.value)}
                error={!!errors.fecha_matricula}
                helperText={errors.fecha_matricula?.[0]}
                size='small'
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Número de Recibo */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Número de Recibo'
                value={formData.numero_recibo}
                onChange={e => handleChange('numero_recibo', e.target.value)}
                error={!!errors.numero_recibo}
                helperText={errors.numero_recibo?.[0]}
                size='small'
              />
            </Grid>

            {/* Período Lectivo */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small' error={!!errors.periodo_lectivo_id} required>
                <InputLabel>Período Lectivo</InputLabel>
                <Select
                  value={getSafeSelectValue(formData.periodo_lectivo_id, periodosLectivos)}
                  onChange={e => handleChange('periodo_lectivo_id', e.target.value || null)}
                  label='Período Lectivo'
                >
                  <MenuItem value=''>
                    <em>Seleccionar período lectivo</em>
                  </MenuItem>
                  {periodosLectivos.map(periodo => (
                    <MenuItem key={periodo.id} value={periodo.id}>
                      {periodo.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {errors.periodo_lectivo_id && (
                  <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>{errors.periodo_lectivo_id[0]}</Box>
                )}
              </FormControl>
            </Grid>

            {/* Grado */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small' error={!!errors.grado_id} required>
                <InputLabel>Grado</InputLabel>
                <Select
                  value={getSafeSelectValue(formData.grado_id, grados)}
                  onChange={e => handleChange('grado_id', e.target.value || null)}
                  label='Grado'
                >
                  <MenuItem value=''>
                    <em>Seleccionar grado</em>
                  </MenuItem>
                  {grados.map(grado => (
                    <MenuItem key={grado.id} value={grado.id}>
                      {grado.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {errors.grado_id && (
                  <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>{errors.grado_id[0]}</Box>
                )}
              </FormControl>
            </Grid>

            {/* Turno */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small' error={!!errors.turno_id} required>
                <InputLabel>Turno</InputLabel>
                <Select
                  value={getSafeSelectValue(formData.turno_id, turnos)}
                  onChange={e => handleChange('turno_id', e.target.value || null)}
                  label='Turno'
                >
                  <MenuItem value=''>
                    <em>Seleccionar turno</em>
                  </MenuItem>
                  {turnos.map(turno => (
                    <MenuItem key={turno.id} value={turno.id}>
                      {turno.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {errors.turno_id && (
                  <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>{errors.turno_id[0]}</Box>
                )}
              </FormControl>
            </Grid>

            {/* Grupo */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small' error={!!errors.grupo_id}>
                <InputLabel>Grupo</InputLabel>
                <Select
                  value={getSafeSelectValue(formData.grupo_id, grupos)}
                  onChange={e => handleChange('grupo_id', e.target.value || null)}
                  label='Grupo'
                >
                  <MenuItem value=''>
                    <em>Sin grupo asignado</em>
                  </MenuItem>
                  {grupos.map(grupo => (
                    <MenuItem key={grupo.id} value={grupo.id}>
                      {grupo.grado?.nombre || 'Sin grado'}-{grupo.seccion?.nombre || 'Sin sección'}
                    </MenuItem>
                  ))}
                </Select>
                {errors.grupo_id && (
                  <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>{errors.grupo_id[0]}</Box>
                )}
              </FormControl>
            </Grid>

            {/* Tipo de Ingreso */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small' error={!!errors.tipo_ingreso}>
                <InputLabel>Tipo de Ingreso</InputLabel>
                <Select
                  value={formData.tipo_ingreso}
                  onChange={e => handleChange('tipo_ingreso', e.target.value)}
                  label='Tipo de Ingreso'
                  required
                >
                  <MenuItem value='nuevo_ingreso'>Nuevo Ingreso</MenuItem>
                  <MenuItem value='reingreso'>Reingreso</MenuItem>
                  <MenuItem value='traslado'>Traslado</MenuItem>
                </Select>
                {errors.tipo_ingreso && (
                  <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>{errors.tipo_ingreso[0]}</Box>
                )}
              </FormControl>
            </Grid>

            {/* Maestra Anterior (solo en reingreso) */}
            {formData.tipo_ingreso === 'reingreso' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Maestra Anterior'
                  value={formData.maestra_anterior || ''}
                  onChange={e => handleChange('maestra_anterior', e.target.value)}
                  error={!!errors.maestra_anterior}
                  helperText={errors.maestra_anterior?.[0]}
                  size='small'
                />
              </Grid>
            )}

            {/* Estado */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size='small' error={!!errors.estado}>
                <InputLabel>Estado</InputLabel>
                <Select value={formData.estado} onChange={e => handleChange('estado', e.target.value)} label='Estado'>
                  <MenuItem value='activo'>Activo</MenuItem>
                  <MenuItem value='no_activo'>No Activo</MenuItem>
                  <MenuItem value='retiro_anticipado'>Retiro Anticipado</MenuItem>
                </Select>
                {errors.estado && (
                  <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>{errors.estado[0]}</Box>
                )}
              </FormControl>
            </Grid>

            {/* Activar Estadística */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.activar_estadistica}
                    onChange={e => handleChange('activar_estadistica', e.target.checked)}
                  />
                }
                label='Activar Estadística'
              />
            </Grid>

            {/* Cortes (solo si activar_estadistica es true) */}
            {formData.activar_estadistica && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size='small' error={!!errors.corte_ingreso}>
                    <InputLabel>Corte de Ingreso</InputLabel>
                    <Select
                      value={formData.corte_ingreso || ''}
                      onChange={e => handleChange('corte_ingreso', e.target.value || null)}
                      label='Corte de Ingreso'
                    >
                      <MenuItem value=''>
                        <em>Sin corte de ingreso</em>
                      </MenuItem>
                      <MenuItem value='corte1'>Corte 1</MenuItem>
                      <MenuItem value='corte2'>Corte 2</MenuItem>
                      <MenuItem value='corte3'>Corte 3</MenuItem>
                      <MenuItem value='corte4'>Corte 4</MenuItem>
                    </Select>
                    {errors.corte_ingreso && (
                      <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>{errors.corte_ingreso[0]}</Box>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size='small' error={!!errors.corte_retiro}>
                    <InputLabel>Corte de Retiro</InputLabel>
                    <Select
                      value={formData.corte_retiro || ''}
                      onChange={e => handleChange('corte_retiro', e.target.value || null)}
                      label='Corte de Retiro'
                    >
                      <MenuItem value=''>
                        <em>Sin corte de retiro</em>
                      </MenuItem>
                      <MenuItem value='corte1'>Corte 1</MenuItem>
                      <MenuItem value='corte2'>Corte 2</MenuItem>
                      <MenuItem value='corte3'>Corte 3</MenuItem>
                      <MenuItem value='corte4'>Corte 4</MenuItem>
                    </Select>
                    {errors.corte_retiro && (
                      <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>{errors.corte_retiro[0]}</Box>
                    )}
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={loading || loadingOptions}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Actualizar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
