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
  IconButton
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { toast } from 'react-hot-toast'

import turnosService from '../services/turnosService'
import type { ConfigTurnos, CreateTurnosRequest, UpdateTurnosRequest, ValidationErrors } from '../types'

interface TurnosModalProps {
  open: boolean
  mode: 'create' | 'edit'
  turnos?: ConfigTurnos
  onClose: () => void
  onSuccess: () => void
}

const TurnosModal: React.FC<TurnosModalProps> = ({ open, mode, turnos, onClose, onSuccess }) => {
  // Estados del formulario
  const [formData, setFormData] = useState<CreateTurnosRequest>({
    nombre: '',
    orden: 1
  })

  // Estados de UI
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Efecto para cargar datos cuando se edita
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && turnos) {
        setFormData({
          nombre: turnos.nombre,
          orden: turnos.orden
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
  }, [open, mode, turnos])

  // Manejar cambios en los campos
  const handleChange = (field: keyof CreateTurnosRequest) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'orden' ? parseInt(event.target.value) || 0 : event.target.value
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

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = ['El nombre es requerido']
    }

    if (!formData.orden || formData.orden < 1) {
      newErrors.orden = ['El orden debe ser un número mayor a 0']
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manejar envío del formulario
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setGeneralError(null)
    setErrors({})

    try {
      let response

      if (mode === 'create') {
        response = await turnosService.createTurnos(formData)
      } else if (mode === 'edit' && turnos) {
        const updateData: UpdateTurnosRequest = {
          nombre: formData.nombre,
          orden: formData.orden
        }
        response = await turnosService.updateTurnos(turnos.id, updateData)
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
          setGeneralError(response?.message || 'Error al guardar el turno')
          toast.error(response?.message || 'Error al guardar el turno')
        }
      }
    } catch (error: any) {
      console.error('Error inesperado al guardar turno:', error)
      setGeneralError('Error inesperado al guardar el turno')
      toast.error('Error inesperado al guardar el turno')
    } finally {
      setLoading(false)
    }
  }

  // Manejar cierre del modal
  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {mode === 'create' ? 'Crear Nuevo Turno' : 'Editar Turno'}
        <IconButton onClick={handleClose} disabled={loading} size='small'>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {generalError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {generalError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label='Nombre del Turno'
            value={formData.nombre}
            onChange={handleChange('nombre')}
            error={!!errors.nombre}
            helperText={errors.nombre?.[0]}
            disabled={loading}
            required
            fullWidth
            size='small'
            placeholder='Ej: Mañana, Tarde, Noche'
          />

          <TextField
            label='Orden'
            type='number'
            value={formData.orden}
            onChange={handleChange('orden')}
            error={!!errors.orden}
            helperText={errors.orden?.[0] || 'Orden de visualización del turno'}
            disabled={loading}
            required
            fullWidth
            size='small'
            inputProps={{ min: 1 }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading} color='inherit'>
          Cancelar
        </Button>
        <Button
          type='submit'
          variant='contained'
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Actualizar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TurnosModal
