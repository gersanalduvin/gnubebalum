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
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import { toast } from 'react-hot-toast'

import planPagoService from '../services/planPagoService'
import type { ConfigPlanPago, ConfigRubro, CreatePlanPagoRequest, ValidationErrors } from '../types'

interface PlanPagoModalProps {
  open: boolean
  mode: 'create' | 'edit'
  planPago?: ConfigPlanPago
  cursoLectivoId: number
  rubros: ConfigRubro[]
  onClose: () => void
  onSuccess: () => void
}

const PlanPagoModal: React.FC<PlanPagoModalProps> = ({
  open,
  mode,
  planPago,
  cursoLectivoId,
  rubros,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreatePlanPagoRequest>({
    nombre: '',
    estado: true,
    periodo_lectivo_id: cursoLectivoId || 0
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Resetear formulario cuando cambie el modal
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && planPago) {
        setFormData({
          nombre: planPago.nombre,
          estado: planPago.estado,
          periodo_lectivo_id: planPago.periodo_lectivo_id
        })
      } else {
        setFormData({
          nombre: '',
          estado: true,
          periodo_lectivo_id: cursoLectivoId || 0
        })
      }
      setErrors({})
      setGeneralError(null)
    }
  }, [open, mode, planPago, cursoLectivoId])

  const handleInputChange =
    (field: keyof CreatePlanPagoRequest) => (event: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
      let value: any = event.target.value

      // Conversiones de tipo según el campo
      if (field === 'estado') {
        value = value === 'true'
      } else if (field === 'periodo_lectivo_id') {
        value = parseInt(value) || 0
      }

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
        response = await planPagoService.createPlanPago(formData)
      } else if (mode === 'edit' && planPago) {
        response = await planPagoService.updatePlanPago(planPago.id, formData)
      }

      if (response?.success) {
        toast.success(response.message)
        onSuccess()
        onClose()
      } else {
        // Manejar errores de validación del backend
        if (response?.errors) {
          const backendErrors: ValidationErrors = {}

          Object.entries(response.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              backendErrors[field as keyof ValidationErrors] = messages
            }
          })
          setErrors(backendErrors)
          toast.error('Por favor corrige los errores en el formulario')
        } else {
          setGeneralError(response?.message || 'Error al guardar el plan de pago')
          toast.error(response?.message || 'Error al guardar el plan de pago')
        }
      }
    } catch (error: any) {
      const errorData = error.data || {}
      
      // Manejar errores específicos
      if (errorData.errors?.configuracion) {
        toast.error(errorData.errors.configuracion[0])
        return
      }
      
      // Manejar errores de validación
      if (errorData.errors) {
        const backendErrors: ValidationErrors = {}
        Object.entries(errorData.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            backendErrors[field as keyof ValidationErrors] = messages
          }
        })
        setErrors(backendErrors)
        toast.error('Por favor corrige los errores en el formulario')
      } else {
        setGeneralError(errorData.message || 'Error inesperado al guardar el plan de pago')
        toast.error(errorData.message || 'Error inesperado al guardar el plan de pago')
      }
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
      <DialogTitle>
        <Typography variant='h6' component='div'>
          {mode === 'create' ? 'Crear Nuevo Plan de Pago' : 'Editar Plan de Pago'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {generalError && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {generalError}
            </Alert>
          )}

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
            placeholder='Ej: Plan Mensual'
          />

          <FormControl fullWidth size='small' error={!!errors.estado} disabled={loading}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={(formData.estado ?? true).toString()}
              onChange={event => {
                const value = event.target.value === 'true'
                setFormData(prev => ({ ...prev, estado: value }))
                setErrors(prev => ({ ...prev, estado: [] }))
              }}
              label='Estado'
            >
              <MenuItem value='true'>Activo</MenuItem>
              <MenuItem value='false'>Inactivo</MenuItem>
            </Select>
            {errors.estado && <FormHelperText>{errors.estado[0]}</FormHelperText>}
          </FormControl>
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

export default PlanPagoModal
