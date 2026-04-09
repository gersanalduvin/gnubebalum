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
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography
} from '@mui/material'
import { toast } from 'react-hot-toast'

import formaPagoService from '../services/formaPagoService'
import type { ConfigFormaPago, CreateFormaPagoRequest, ValidationErrors } from '../types'

interface FormaPagoModalProps {
  open: boolean
  mode: 'create' | 'edit'
  formaPago?: ConfigFormaPago
  onClose: () => void
  onSuccess: () => void
}

const FormaPagoModal: React.FC<FormaPagoModalProps> = ({
  open,
  mode,
  formaPago,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateFormaPagoRequest>({
    nombre: '',
    abreviatura: '',
    es_efectivo: false,
    moneda: 0,
    activo: true
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Resetear formulario cuando cambie el modal
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && formaPago) {
        setFormData({
          nombre: formaPago.nombre,
          abreviatura: formaPago.abreviatura,
          es_efectivo: formaPago.es_efectivo,
          moneda: Number(formaPago.moneda),
          activo: formaPago.activo
        })
      } else {
        setFormData({
          nombre: '',
          abreviatura: '',
          es_efectivo: false,
          moneda: 0,
          activo: true
        })
      }
      // Limpiar errores cuando se abre el modal
      setErrors({})
      setGeneralError(null)
    }
  }, [open, mode, formaPago])

  const handleInputChange = (field: keyof CreateFormaPagoRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'activo' || field === 'es_efectivo' ? event.target.checked : event.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }))
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setErrors({})
    setGeneralError(null)

    try {
      let response

      if (mode === 'create') {
        response = await formaPagoService.createFormaPago(formData)
      } else if (mode === 'edit' && formaPago) {
        response = await formaPagoService.updateFormaPago(formaPago.id, formData)
      }

      if (response?.success) {
        toast.success(response.message)
        onSuccess()
        onClose()
      } else {
        // Procesar errores según las reglas del proyecto
        if (response?.errors) {
          // Procesar errores de validación
          const backendErrors: ValidationErrors = {}
          Object.entries(response.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              backendErrors[field as keyof ValidationErrors] = messages
            }
          })
          setErrors(backendErrors)
          
          // Mostrar mensaje general de error de validación
          toast.error('Por favor corrige los errores en el formulario')
        } else {
          // Error general sin validaciones específicas
          const errorMessage = response?.message || 'Error al guardar la forma de pago'
          setGeneralError(errorMessage)
          toast.error(errorMessage)
        }
      }
    } catch (error: any) {
      // Error inesperado
      const errorMessage = 'Error inesperado al guardar la forma de pago'
      setGeneralError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      // Limpiar errores al cerrar el modal
      setErrors({})
      setGeneralError(null)
      onClose()
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '450px' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          {mode === 'create' ? 'Crear Nueva Forma de Pago' : 'Editar Forma de Pago'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {generalError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {generalError}
            </Alert>
          )}

          <TextField
            label="Nombre"
            value={formData.nombre}
            onChange={handleInputChange('nombre')}
            error={!!errors.nombre}
            helperText={errors.nombre?.[0]}
            fullWidth
            required
            size="small"
            disabled={loading}
            placeholder="Ej: Efectivo, Tarjeta de Crédito"
          />

          <TextField
            label="Abreviatura"
            value={formData.abreviatura}
            onChange={handleInputChange('abreviatura')}
            error={!!errors.abreviatura}
            helperText={errors.abreviatura?.[0]}
            fullWidth
            required
            size="small"
            disabled={loading}
            placeholder="Ej: EFE, TC"
            inputProps={{ maxLength: 10 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.activo}
                onChange={handleInputChange('activo')}
                disabled={loading}
                color="primary"
              />
            }
            label="Activo"
            sx={{ alignSelf: 'flex-start' }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={!!formData.es_efectivo}
                onChange={handleInputChange('es_efectivo')}
                disabled={loading}
                color="primary"
              />
            }
            label="Es efectivo"
            sx={{ alignSelf: 'flex-start' }}
          />

          <FormControl fullWidth size="small">
            <InputLabel>Moneda</InputLabel>
            <Select
              label="Moneda"
              value={typeof formData.moneda === 'number' ? formData.moneda : 0}
              onChange={e => setFormData(prev => ({ ...prev, moneda: Number(e.target.value) }))}
              disabled={loading}
            >
              <MenuItem value={0}>Córdobas (C$)</MenuItem>
              <MenuItem value={1}>Dólares (US$)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Guardando...' : (mode === 'create' ? 'Crear' : 'Actualizar')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FormaPagoModal
