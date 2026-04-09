'use client'

import { useState, useEffect } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Typography
} from '@mui/material'
import { toast } from 'react-hot-toast'

import type { ConfigSeccion, CreateSeccionRequest, ValidationErrors } from '../types'
import seccionService from '../services/seccionService'

interface SeccionModalProps {
  open: boolean
  mode: 'create' | 'edit'
  seccion?: ConfigSeccion
  onClose: () => void
  onSuccess: () => void
}

const SeccionModal: React.FC<SeccionModalProps> = ({
  open,
  mode,
  seccion,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateSeccionRequest>({
    nombre: '',
    orden: 1
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Resetear formulario cuando cambie el modal
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && seccion) {
        setFormData({
          nombre: seccion.nombre,
          orden: seccion.orden
        })
      } else {
        setFormData({
          nombre: '',
          orden: 1
        })
      }
      setErrors({})
      setGeneralError(null)
    }
  }, [open, mode, seccion])

  const handleInputChange = (field: keyof CreateSeccionRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'orden' ? parseInt(event.target.value) || 1 : event.target.value
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
        response = await seccionService.createSeccion(formData)
      } else if (mode === 'edit' && seccion) {
        response = await seccionService.updateSeccion(seccion.id, formData)
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
          setGeneralError(response?.message || 'Error al guardar la sección')
          toast.error(response?.message || 'Error al guardar la sección')
        }
      }
    } catch (error: any) {
      console.error('Error inesperado al guardar sección:', error)
      setGeneralError('Error inesperado al guardar la sección')
      toast.error('Error inesperado al guardar la sección')
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
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          {mode === 'create' ? 'Crear Nueva Sección' : 'Editar Sección'}
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
            placeholder="Ej: Sección A"
          />

          <TextField
            label="Orden"
            type="number"
            value={formData.orden}
            onChange={handleInputChange('orden')}
            error={!!errors.orden}
            helperText={errors.orden?.[0]}
            fullWidth
            required
            size="small"
            disabled={loading}
            inputProps={{ min: 1 }}
          />
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

export default SeccionModal