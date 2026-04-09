'use client'

import { useState, useEffect } from 'react'

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
  Switch,
  Grid,
  Box,
  CircularProgress,
  Typography,
  Autocomplete
} from '@mui/material'

import { toast } from 'react-hot-toast'

import catalogoCuentasService from '../services/services_catalogoCuentasService'
import type { 
  ConfigCatalogoCuenta, 
  CreateCuentaRequest, 
  UpdateCuentaRequest,
  ValidationErrors
} from '../types/types_index'

interface ConfigCatalogoCuentaFormProps {
  open: boolean
  onClose: () => void
  cuenta?: ConfigCatalogoCuenta | null
  onSuccess: () => void
}

const TIPOS_CUENTA = [
  { value: 'activo', label: 'Activo' },
  { value: 'pasivo', label: 'Pasivo' },
  { value: 'patrimonio', label: 'Patrimonio' },
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'gasto', label: 'Gasto' }
]

const NATURALEZAS_CUENTA = [
  { value: 'deudora', label: 'Deudora' },
  { value: 'acreedora', label: 'Acreedora' }
]

const ESTADOS_CUENTA = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' }
]

export default function ConfigCatalogoCuentaForm({ 
  open, 
  onClose, 
  cuenta, 
  onSuccess 
}: ConfigCatalogoCuentaFormProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [cuentasPadre, setCuentasPadre] = useState<ConfigCatalogoCuenta[]>([])
  const [loadingPadres, setLoadingPadres] = useState(false)

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tipo: 'activo' as 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto',
    padre_id: null as number | null,
    es_grupo: false,
    permite_movimiento: true,
    naturaleza: 'deudora' as 'deudora' | 'acreedora',
    descripcion: '',
    estado: 'activo' as 'activo' | 'inactivo',
    moneda_usd: false
  })

  // Cargar cuentas padre disponibles
  const loadCuentasPadre = async () => {
    setLoadingPadres(true)
    try {
      const response = await catalogoCuentasService.getCuentas({ per_page: 1000 })
      
      // El servicio ya devuelve CuentaPaginatedResponse directamente
      if (response && response.data && Array.isArray(response.data.data)) {
        // Filtrar solo cuentas que pueden ser padre (es_grupo = true)
        const cuentasGrupo = response.data.data.filter(c => c.es_grupo)
        setCuentasPadre(cuentasGrupo)
      } else {
        setCuentasPadre([])
        toast.error('Error al cargar cuentas padre: estructura de respuesta inválida')
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Error al cargar cuentas padre'
      toast.error(errorMessage)
      setCuentasPadre([])
    } finally {
      setLoadingPadres(false)
    }
  }

  // Inicializar formulario
  useEffect(() => {
    if (open) {
      if (cuenta) {
        // Modo edición
        setFormData({
          codigo: cuenta.codigo,
          nombre: cuenta.nombre,
          tipo: cuenta.tipo,
          padre_id: cuenta.padre_id,
          es_grupo: cuenta.es_grupo,
          permite_movimiento: cuenta.permite_movimiento,
          naturaleza: cuenta.naturaleza,
          descripcion: cuenta.descripcion || '',
          estado: cuenta.estado,
          moneda_usd: cuenta.moneda_usd
        })
      } else {
        // Modo creación
        setFormData({
          codigo: '',
          nombre: '',
          tipo: 'activo',
          padre_id: null,
          es_grupo: false,
          permite_movimiento: true,
          naturaleza: 'deudora',
          descripcion: '',
          estado: 'activo',
          moneda_usd: false
        })
      }
      setErrors({})
      loadCuentasPadre()
    }
  }, [open, cuenta])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: []
      }))
    }
  }

  const processBackendErrors = (error: any) => {
    const errorData = error.data || {}
    
    // Verificar errores específicos primero
    if (errorData.errors?.configuracion) {
      toast.error(errorData.errors.configuracion[0])
      return
    }
    
    // Procesar errores de validación de campos
    if (errorData.errors) {
      const newFieldErrors: ValidationErrors = {}
      Object.keys(errorData.errors).forEach(field => {
        const errorMessages = errorData.errors[field]
        if (Array.isArray(errorMessages)) {
          newFieldErrors[field] = errorMessages
        }
      })
      setErrors(newFieldErrors)
      
      // No mostrar toast general si hay errores de validación específicos
      return
    }
    
    // Mostrar mensaje general si existe y no hay errores de validación
    if (errorData.message) {
      toast.error(errorData.message)
    } else {
      toast.error('Error al procesar la solicitud')
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setErrors({})
    
    try {
      let response
      
      if (cuenta) {
        // Actualizar cuenta existente
        const updateData: UpdateCuentaRequest = {
          codigo: formData.codigo,
          nombre: formData.nombre,
          tipo: formData.tipo,
          padre_id: formData.padre_id,
          es_grupo: formData.es_grupo,
          permite_movimiento: formData.permite_movimiento,
          naturaleza: formData.naturaleza,
          descripcion: formData.descripcion || undefined,
          estado: formData.estado,
          moneda_usd: formData.moneda_usd
        }
        
        response = await catalogoCuentasService.updateCuenta(cuenta.id, updateData)
      } else {
        // Crear nueva cuenta
        const createData: CreateCuentaRequest = {
          codigo: formData.codigo,
          nombre: formData.nombre,
          tipo: formData.tipo,
          padre_id: formData.padre_id,
          es_grupo: formData.es_grupo,
          permite_movimiento: formData.permite_movimiento,
          naturaleza: formData.naturaleza,
          descripcion: formData.descripcion || undefined,
          estado: formData.estado,
          moneda_usd: formData.moneda_usd
        }
        
        response = await catalogoCuentasService.createCuenta(createData)
      }
      
      // Verificar si la respuesta fue exitosa
      if (response.success) {
        toast.success(cuenta ? 'Cuenta actualizada exitosamente' : 'Cuenta creada exitosamente')
        onSuccess()
        onClose()
      } else {
        // Procesar errores de validación sin cerrar el modal
        processBackendErrors({ data: response })
      }
    } catch (error: any) {
      processBackendErrors(error)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    return formData.codigo.trim() !== '' && 
           formData.nombre.trim() !== ''
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        {cuenta ? 'Editar Cuenta' : 'Nueva Cuenta'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Código */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Código *"
                value={formData.codigo}
                onChange={(e) => handleInputChange('codigo', e.target.value)}
                error={!!errors.codigo}
                helperText={errors.codigo?.[0]}
                placeholder="Ej: 1.1.01"
                size="small"
              />
            </Grid>

            {/* Nombre */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre *"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                error={!!errors.nombre}
                helperText={errors.nombre?.[0]}
                placeholder="Nombre de la cuenta"
                size="small"
              />
            </Grid>

            {/* Tipo */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" error={!!errors.tipo}>
                <InputLabel>Tipo *</InputLabel>
                <Select
                  value={formData.tipo}
                  label="Tipo *"
                  onChange={(e) => handleInputChange('tipo', e.target.value)}
                >
                  {TIPOS_CUENTA.map((tipo) => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.tipo && (
                  <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                    {errors.tipo[0]}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Naturaleza */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" error={!!errors.naturaleza}>
                <InputLabel>Naturaleza *</InputLabel>
                <Select
                  value={formData.naturaleza}
                  label="Naturaleza *"
                  onChange={(e) => handleInputChange('naturaleza', e.target.value)}
                >
                  {NATURALEZAS_CUENTA.map((naturaleza) => (
                    <MenuItem key={naturaleza.value} value={naturaleza.value}>
                      {naturaleza.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.naturaleza && (
                  <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                    {errors.naturaleza[0]}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Cuenta Padre */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                size="small"
                options={cuentasPadre}
                getOptionLabel={(option) => `${option.codigo} - ${option.nombre}`}
                value={cuentasPadre.find(c => c.id === formData.padre_id) || null}
                onChange={(_, newValue) => handleInputChange('padre_id', newValue?.id || null)}
                loading={loadingPadres}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cuenta Padre"
                    error={!!errors.padre_id}
                    helperText={errors.padre_id?.[0]}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingPadres ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* Estado */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" error={!!errors.estado}>
                <InputLabel>Estado *</InputLabel>
                <Select
                  value={formData.estado}
                  label="Estado *"
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                >
                  {ESTADOS_CUENTA.map((estado) => (
                    <MenuItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.estado && (
                  <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                    {errors.estado[0]}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Descripción */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={formData.descripcion}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                error={!!errors.descripcion}
                helperText={errors.descripcion?.[0]}
                multiline
                rows={3}
                size="small"
              />
            </Grid>

            {/* Switches */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.es_grupo}
                      onChange={(e) => handleInputChange('es_grupo', e.target.checked)}
                    />
                  }
                  label="Es cuenta de grupo"
                />
                
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.permite_movimiento}
                        onChange={(e) => handleInputChange('permite_movimiento', e.target.checked)}
                      />
                    }
                    label="Permite movimientos contables"
                  />
                  {errors.permite_movimiento && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', ml: 2, mt: 0.5 }}>
                      {errors.permite_movimiento[0]}
                    </Typography>
                  )}
                </Box>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.moneda_usd}
                      onChange={(e) => handleInputChange('moneda_usd', e.target.checked)}
                    />
                  }
                  label="Moneda en dólares (USD)"
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={loading || !isFormValid()}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : (
            cuenta ? 'Actualizar' : 'Crear'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}