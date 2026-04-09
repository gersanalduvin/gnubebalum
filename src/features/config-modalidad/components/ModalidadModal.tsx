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

import type { ConfigModalidad, CreateModalidadRequest, ValidationErrors } from '../types'
import modalidadService from '../services/modalidadService'

interface ModalidadModalProps {
  open: boolean
  mode: 'create' | 'edit'
  modalidad?: ConfigModalidad
  onClose: () => void
  onSuccess: () => void
}

const ModalidadModal: React.FC<ModalidadModalProps> = ({
  open,
  mode,
  modalidad,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateModalidadRequest>({
    nombre: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Resetear formulario cuando cambie el modal
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && modalidad) {
        setFormData({
          nombre: modalidad.nombre
        })
      } else {
        setFormData({
          nombre: ''
        })
      }
      setErrors({})
      setGeneralError(null)
    }
  }, [open, mode, modalidad])

  const handleInputChange = (field: keyof CreateModalidadRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value
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
        response = await modalidadService.createModalidad(formData)
      } else if (mode === 'edit' && modalidad) {
        response = await modalidadService.updateModalidad(modalidad.id, formData)
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
          setGeneralError(response?.message || 'Error al guardar la modalidad')
          toast.error(response?.message || 'Error al guardar la modalidad')
        }
      }
    } catch (error: any) {
      console.error('Error inesperado al guardar modalidad:', error)
      setGeneralError('Error inesperado al guardar la modalidad')
      toast.error('Error inesperado al guardar la modalidad')
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
        sx: { minHeight: '350px' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          {mode === 'create' ? 'Crear Nueva Modalidad' : 'Editar Modalidad'}
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
            placeholder="Ej: Presencial, Virtual, Semipresencial"
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

export default ModalidadModal