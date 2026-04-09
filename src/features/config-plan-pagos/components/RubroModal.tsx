'use client'

import { useEffect, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
  Typography
} from '@mui/material'
import { toast } from 'react-hot-toast'

import planPagoService from '../services/planPagoService'
import type { CatalogoCuenta, ConfigRubro, CreateRubroRequest, ValidationErrors } from '../types'

interface RubroModalProps {
  open: boolean
  mode: 'create' | 'edit'
  rubro?: ConfigRubro
  planPagoId?: number
  onClose: () => void
  onSuccess: () => void
}

const MESES_OPTIONS = [
  { value: 'enero', label: 'Enero' },
  { value: 'febrero', label: 'Febrero' },
  { value: 'marzo', label: 'Marzo' },
  { value: 'abril', label: 'Abril' },
  { value: 'mayo', label: 'Mayo' },
  { value: 'junio', label: 'Junio' },
  { value: 'julio', label: 'Julio' },
  { value: 'agosto', label: 'Agosto' },
  { value: 'septiembre', label: 'Septiembre' },
  { value: 'octubre', label: 'Octubre' },
  { value: 'noviembre', label: 'Noviembre' },
  { value: 'diciembre', label: 'Diciembre' }
]

const TIPO_RECARGO_OPTIONS = [
  { value: 'fijo', label: 'Fijo' },
  { value: 'porcentaje', label: 'Porcentaje' }
]

const RubroModal: React.FC<RubroModalProps> = ({ open, mode, rubro, planPagoId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateRubroRequest>({
    plan_pago_id: 0,
    codigo: '',
    nombre: '',
    importe: 0,
    cuenta_debito_id: undefined,
    cuenta_credito_id: undefined,
    cuenta_recargo_id: undefined,
    es_colegiatura: false,
    asociar_mes: undefined,
    fecha_vencimiento: '',
    importe_recargo: 0,
    tipo_recargo: undefined,
    moneda: false
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [cuentas, setCuentas] = useState<CatalogoCuenta[]>([])
  const [loadingCuentas, setLoadingCuentas] = useState(false)

  // Cargar catálogo de cuentas
  // Función para convertir fecha ISO a formato yyyy-MM-dd
  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return ''
    
    try {
      // Si ya está en formato yyyy-MM-dd, devolverlo tal como está
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString
      }
      
      // Si está en formato ISO, convertir a yyyy-MM-dd
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      
      return date.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  useEffect(() => {
    const loadCuentas = async () => {
      setLoadingCuentas(true)
      try {
        const response = await planPagoService.getCatalogoCuentas()
        
        // getCatalogoCuentas ahora devuelve directamente CatalogoCuenta[]
        setCuentas(response)
      } catch (error) {
        setCuentas([])
        toast.error('Error al cargar el catálogo de cuentas')
      } finally {
        setLoadingCuentas(false)
      }
    }

    if (open) {
      loadCuentas()
    }
  }, [open])

  // Resetear formulario cuando cambie el modal - solo después de cargar las cuentas
  useEffect(() => {
    if (open && !loadingCuentas) {
      if (mode === 'edit' && rubro) {
        // Validar que los IDs de cuentas existen en las opciones cargadas y convertir null a undefined
        const cuentaDebitoValida = rubro.cuenta_debito_id && cuentas.some(c => c.id === rubro.cuenta_debito_id)
        const cuentaCreditoValida = rubro.cuenta_credito_id && cuentas.some(c => c.id === rubro.cuenta_credito_id)
        const cuentaRecargoValida = rubro.cuenta_recargo_id && cuentas.some(c => c.id === rubro.cuenta_recargo_id)

        setFormData({
          plan_pago_id: rubro.plan_pago_id,
          codigo: rubro.codigo,
          nombre: rubro.nombre,
          importe: rubro.importe,
          cuenta_debito_id: cuentaDebitoValida ? rubro.cuenta_debito_id! : undefined,
          cuenta_credito_id: cuentaCreditoValida ? rubro.cuenta_credito_id! : undefined,
          cuenta_recargo_id: cuentaRecargoValida ? rubro.cuenta_recargo_id! : undefined,
          es_colegiatura: rubro.es_colegiatura,
          asociar_mes: rubro.asociar_mes || undefined,
          fecha_vencimiento: formatDateForInput(rubro.fecha_vencimiento),
          importe_recargo: rubro.importe_recargo,
          tipo_recargo: rubro.tipo_recargo || undefined,
          moneda: rubro.moneda
        })
      } else {
        setFormData({
          plan_pago_id: planPagoId || 0,
          codigo: '',
          nombre: '',
          importe: 0,
          cuenta_debito_id: undefined,
          cuenta_credito_id: undefined,
          cuenta_recargo_id: undefined,
          es_colegiatura: false,
          asociar_mes: undefined,
          fecha_vencimiento: '',
          importe_recargo: 0,
          tipo_recargo: undefined,
          moneda: false
        })
      }
      setErrors({})
      setGeneralError(null)
    }
  }, [open, mode, rubro, planPagoId, loadingCuentas])

  const handleInputChange =
    (field: keyof CreateRubroRequest) => (event: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
      let value: any = event.target.value

      // Conversiones de tipo específicas
      if (field === 'importe' || field === 'importe_recargo') {
        value = parseFloat(value) || 0
      } else if (field === 'cuenta_debito_id' || field === 'cuenta_credito_id') {
        value = value ? parseInt(value as string) : undefined
      } else if (field === 'es_colegiatura' || field === 'moneda') {
        value = value === 'true' || value === true
      }

      setFormData(prev => ({ ...prev, [field]: value }))

      // Limpiar error del campo cuando el usuario empiece a escribir
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: [] }))
      }
    }

  const handleSelectChange =
    (field: 'cuenta_debito_id' | 'cuenta_credito_id' | 'cuenta_recargo_id') => (event: SelectChangeEvent<number>) => {
      const value = event.target.value ? parseInt(event.target.value as string) : undefined
      setFormData(prev => ({ ...prev, [field]: value }))

      // Limpiar error del campo
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: [] }))
      }
    }

  const handleMesSelectChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as
      | 'enero'
      | 'febrero'
      | 'marzo'
      | 'abril'
      | 'mayo'
      | 'junio'
      | 'julio'
      | 'agosto'
      | 'septiembre'
      | 'octubre'
      | 'noviembre'
      | 'diciembre'
      | undefined
    setFormData(prev => ({ ...prev, asociar_mes: value || undefined }))

    // Limpiar error del campo
    if (errors.asociar_mes) {
      setErrors(prev => ({ ...prev, asociar_mes: [] }))
    }
  }

  const handleTipoRecargoSelectChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as 'fijo' | 'porcentaje' | undefined
    setFormData(prev => ({ ...prev, tipo_recargo: value || undefined }))

    // Limpiar error del campo
    if (errors.tipo_recargo) {
      setErrors(prev => ({ ...prev, tipo_recargo: [] }))
    }
  }

  const handleMonedaSelectChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value === 'true'
    setFormData(prev => ({ ...prev, moneda: value }))

    // Limpiar error del campo
    if (errors.moneda) {
      setErrors(prev => ({ ...prev, moneda: [] }))
    }
  }

  const handleSwitchChange = (field: 'es_colegiatura' | 'moneda') => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: event.target.checked }))

    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }))
    }
  }

  const processBackendErrors = (errorData: any) => {
    // Limpiar errores previos
    setErrors({})
    setGeneralError(null)

    if (!errorData) return

    // Verificar errores específicos primero
    if (errorData.errors?.configuracion) {
      toast.error(errorData.errors.configuracion[0])
      return
    }

    // Si hay errores de validación de campos
    if (errorData.errors && typeof errorData.errors === 'object') {
      const newFieldErrors: ValidationErrors = {}
      let hasFieldErrors = false

      Object.keys(errorData.errors).forEach(field => {
        const errorMessages = errorData.errors[field]
        if (Array.isArray(errorMessages) && errorMessages.length > 0) {
          newFieldErrors[field] = errorMessages
          hasFieldErrors = true
        }
      })

      if (hasFieldErrors) {
        setErrors(newFieldErrors)
        toast.error('Por favor corrige los errores en el formulario')
        return
      }
    }

    // Error general
    const message = errorData.message || 'Error al procesar la solicitud'
    setGeneralError(message)
    toast.error(message)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setErrors({})
    setGeneralError(null)

    try {
      let response

      if (mode === 'create') {
        response = await planPagoService.createRubro(formData)
      } else if (mode === 'edit' && rubro) {
        response = await planPagoService.updateRubro(rubro.id, formData)
      }

      if (response?.success) {
        if (mode === 'create') {
          toast.success('Rubro creado exitosamente')
        } else {
          toast.success('Rubro actualizado exitosamente')
        }
        onSuccess()
        onClose()
      } else {
        // Procesar errores de validación usando la respuesta del servicio
        processBackendErrors(response)
      }
    } catch (error: any) {
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
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Typography variant='h6' component='div'>
          {mode === 'create' ? 'Crear Nuevo Rubro' : 'Editar Rubro'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {generalError && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {generalError}
            </Alert>
          )}

          {/* Sección: Información del Rubro */}
          <Box
            sx={{
              mb: 4,
              p: 3,
              border: '1px solid',
              borderColor: 'primary.light',
              borderRadius: 2,
              backgroundColor: 'primary.50'
            }}
          >
            <Typography variant='h6' sx={{ mb: 2, color: 'primary.main', fontWeight: 600 }}>
              📋 Información del Rubro
            </Typography>
            <Grid container spacing={3}>
              {/* Primera fila - Información básica */}
              <Grid item xs={12} md={6}>
                <TextField
                  label='Código'
                  value={formData.codigo}
                  onChange={handleInputChange('codigo')}
                  error={!!errors.codigo}
                  helperText={errors.codigo?.[0]}
                  fullWidth
                  required
                  size='small'
                  disabled={loading}
                  placeholder='Ej: MAT001'
                />
              </Grid>

              <Grid item xs={12} md={12}>
                <TextField
                  label='Nombre'
                  value={formData.nombre}
                  onChange={handleInputChange('nombre')}
                  error={!!errors.nombre}
                  helperText={errors.nombre?.[0]}
                  fullWidth
                  required
                  size='small'
                  disabled={loading}
                  placeholder='Ej: Matrícula'
                />
              </Grid>

              {/* Segunda fila - Importe y moneda */}
              <Grid item xs={12} md={6}>
                <TextField
                  label='Importe'
                  type='number'
                  value={formData.importe}
                  onChange={handleInputChange('importe')}
                  error={!!errors.importe}
                  helperText={errors.importe?.[0]}
                  fullWidth
                  required
                  size='small'
                  disabled={loading}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size='small' error={!!errors.moneda} disabled={loading}>
                  <InputLabel>Moneda</InputLabel>
                  <Select
                    value={(formData.moneda ?? false).toString()}
                    onChange={handleMonedaSelectChange}
                    label='Moneda'
                  >
                    <MenuItem value='false'>Córdoba</MenuItem>
                    <MenuItem value='true'>Dólar</MenuItem>
                  </Select>
                  {errors.moneda && <FormHelperText>{errors.moneda[0]}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* Tercera fila - Cuentas contables */}
              <Grid item xs={12} md={6}>
                <FormControl
                  fullWidth
                  size='small'
                  error={!!errors.cuenta_debito_id}
                  disabled={loading || loadingCuentas}
                >
                  <InputLabel>Cuenta Débito</InputLabel>
                  <Select
                    value={formData.cuenta_debito_id || ''}
                    onChange={handleSelectChange('cuenta_debito_id')}
                    label='Cuenta Débito'
                  >
                    <MenuItem value=''>
                      <em>Ninguna</em>
                    </MenuItem>
                    {cuentas.map(cuenta => (
                      <MenuItem key={cuenta.id} value={cuenta.id}>
                        {cuenta.codigo} - {cuenta.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.cuenta_debito_id && <FormHelperText>{errors.cuenta_debito_id[0]}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl
                  fullWidth
                  size='small'
                  error={!!errors.cuenta_credito_id}
                  disabled={loading || loadingCuentas}
                >
                  <InputLabel>Cuenta Crédito</InputLabel>
                  <Select
                    value={formData.cuenta_credito_id || ''}
                    onChange={handleSelectChange('cuenta_credito_id')}
                    label='Cuenta Crédito'
                  >
                    <MenuItem value=''>
                      <em>Ninguna</em>
                    </MenuItem>
                    {cuentas.map(cuenta => (
                      <MenuItem key={cuenta.id} value={cuenta.id}>
                        {cuenta.codigo} - {cuenta.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.cuenta_credito_id && <FormHelperText>{errors.cuenta_credito_id[0]}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* Cuarta fila - Configuración temporal */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size='small' error={!!errors.asociar_mes} disabled={loading}>
                  <InputLabel>Asociar Mes</InputLabel>
                  <Select value={formData.asociar_mes || ''} onChange={handleMesSelectChange} label='Asociar Mes'>
                    <MenuItem value=''>
                      <em>Ninguno</em>
                    </MenuItem>
                    {MESES_OPTIONS.map(mes => (
                      <MenuItem key={mes.value} value={mes.value}>
                        {mes.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.asociar_mes && <FormHelperText>{errors.asociar_mes[0]}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* Quinta fila - Configuración adicional */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.es_colegiatura}
                        onChange={handleSwitchChange('es_colegiatura')}
                        disabled={loading}
                      />
                    }
                    label='Es Colegiatura'
                  />
                </Box>
                {errors.es_colegiatura && <FormHelperText error>{errors.es_colegiatura[0]}</FormHelperText>}
              </Grid>
            </Grid>
          </Box>

          {/* Sección: Configuración de Recargo */}
          <Box
            sx={{
              mb: 2,
              p: 3,
              border: '1px solid',
              borderColor: 'warning.light',
              borderRadius: 2,
              backgroundColor: 'warning.50'
            }}
          >
            <Typography variant='h6' sx={{ mb: 2, color: 'warning.main', fontWeight: 600 }}>
              ⚠️ Configuración de Recargo
            </Typography>
            <Grid container spacing={3}>
              {/* Primera fila - Recargo */}
              <Grid item xs={12} md={6}>
                <TextField
                  label='Fecha Vencimiento'
                  type='date'
                  value={formData.fecha_vencimiento || ''}
                  onChange={handleInputChange('fecha_vencimiento')}
                  error={!!errors.fecha_vencimiento}
                  helperText={errors.fecha_vencimiento?.[0]}
                  fullWidth
                  size='small'
                  disabled={loading}
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size='small' error={!!errors.tipo_recargo} disabled={loading}>
                  <InputLabel>Tipo Recargo</InputLabel>
                  <Select
                    value={formData.tipo_recargo || ''}
                    onChange={handleTipoRecargoSelectChange}
                    label='Tipo Recargo'
                  >
                    <MenuItem value=''>
                      <em>Ninguno</em>
                    </MenuItem>
                    {TIPO_RECARGO_OPTIONS.map(tipo => (
                      <MenuItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.tipo_recargo && <FormHelperText>{errors.tipo_recargo[0]}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label='Importe Recargo'
                  type='number'
                  value={formData.importe_recargo}
                  onChange={handleInputChange('importe_recargo')}
                  error={!!errors.importe_recargo}
                  helperText={errors.importe_recargo?.[0]}
                  fullWidth
                  size='small'
                  disabled={loading}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl
                  fullWidth
                  size='small'
                  error={!!errors.cuenta_recargo_id}
                  disabled={loading || loadingCuentas}
                >
                  <InputLabel>Cuenta Recargo</InputLabel>
                  <Select
                    value={formData.cuenta_recargo_id || ''}
                    onChange={handleSelectChange('cuenta_recargo_id')}
                    label='Cuenta Recargo'
                  >
                    <MenuItem value=''>
                      <em>Ninguna</em>
                    </MenuItem>
                    {cuentas.map(cuenta => (
                      <MenuItem key={cuenta.id} value={cuenta.id}>
                        {cuenta.codigo} - {cuenta.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.cuenta_recargo_id && <FormHelperText>{errors.cuenta_recargo_id[0]}</FormHelperText>}
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading} variant='outlined'>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          variant='contained'
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Actualizar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RubroModal
