'use client'

import { useState, useEffect, useCallback } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Typography,
  FormControlLabel,
  Switch
} from '@mui/material'
import { toast } from 'react-hot-toast'

import periodoLectivoService from '../services/periodoLectivoService'
import type { ConfPeriodoLectivo, CreatePeriodoLectivoRequest } from '../types'

interface PeriodoLectivoModalProps {
  open: boolean
  mode: 'create' | 'edit'
  periodoLectivo?: ConfPeriodoLectivo
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  nombre: string
  prefijo_alumno: string
  prefijo_docente: string
  prefijo_familia: string
  prefijo_admin: string
  incremento_alumno: number
  incremento_docente: number
  incremento_familia: number
  periodo_nota: boolean
  periodo_matricula: boolean
}

interface FormErrors {
  nombre?: string
  prefijo_alumno?: string
  prefijo_docente?: string
  prefijo_familia?: string
  prefijo_admin?: string
  incremento_alumno?: string
  incremento_docente?: string
  incremento_familia?: string
}

const PeriodoLectivoModal = ({ open, mode, periodoLectivo, onClose, onSuccess }: PeriodoLectivoModalProps) => {
  
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    prefijo_alumno: '',
    prefijo_docente: '',
    prefijo_familia: '',
    prefijo_admin: '',
    incremento_alumno: 1,
    incremento_docente: 1,
    incremento_familia: 1,
    periodo_nota: false,
    periodo_matricula: false
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Cargar datos del período en modo edición
  useEffect(() => {
    if (open && mode === 'edit' && periodoLectivo) {
      setFormData({
        nombre: periodoLectivo.nombre,
        prefijo_alumno: periodoLectivo.prefijo_alumno,
        prefijo_docente: periodoLectivo.prefijo_docente,
        prefijo_familia: periodoLectivo.prefijo_familia,
        prefijo_admin: periodoLectivo.prefijo_admin,
        incremento_alumno: periodoLectivo.incremento_alumno,
        incremento_docente: periodoLectivo.incremento_docente,
        incremento_familia: periodoLectivo.incremento_familia,
        periodo_nota: periodoLectivo.periodo_nota,
        periodo_matricula: periodoLectivo.periodo_matricula
      })
    } else if (open && mode === 'create') {
      // Resetear formulario para crear
      setFormData({
        nombre: '',
        prefijo_alumno: '',
        prefijo_docente: '',
        prefijo_familia: '',
        prefijo_admin: '',
        incremento_alumno: 1,
        incremento_docente: 1,
        incremento_familia: 1,
        periodo_nota: false,
        periodo_matricula: false
      })
    }
    
    // Limpiar errores al abrir/cerrar modal
    if (open) {
      setErrors({})
      setSubmitError(null)
    }
  }, [open, mode, periodoLectivo])

  const handleInputChange = useCallback((field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'number' 
      ? parseInt(event.target.value) || 0
      : event.target.value

    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Limpiar error del campo al escribir
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }, [errors])

  const handleSwitchChange = useCallback((field: 'periodo_nota' | 'periodo_matricula') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }))
  }, [])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    }

    if (!formData.prefijo_alumno.trim()) {
      newErrors.prefijo_alumno = 'El prefijo de alumno es obligatorio'
    } else if (formData.prefijo_alumno.length > 10) {
      newErrors.prefijo_alumno = 'El prefijo no puede tener más de 10 caracteres'
    }

    if (!formData.prefijo_docente.trim()) {
      newErrors.prefijo_docente = 'El prefijo de docente es obligatorio'
    } else if (formData.prefijo_docente.length > 10) {
      newErrors.prefijo_docente = 'El prefijo no puede tener más de 10 caracteres'
    }

    if (!formData.prefijo_familia.trim()) {
      newErrors.prefijo_familia = 'El prefijo de familia es obligatorio'
    } else if (formData.prefijo_familia.length > 10) {
      newErrors.prefijo_familia = 'El prefijo no puede tener más de 10 caracteres'
    }

    if (!formData.prefijo_admin.trim()) {
      newErrors.prefijo_admin = 'El prefijo de admin es obligatorio'
    } else if (formData.prefijo_admin.length > 10) {
      newErrors.prefijo_admin = 'El prefijo no puede tener más de 10 caracteres'
    }

    if (formData.incremento_alumno < 1) {
      newErrors.incremento_alumno = 'El incremento debe ser mayor a 0'
    }

    if (formData.incremento_docente < 1) {
      newErrors.incremento_docente = 'El incremento debe ser mayor a 0'
    }

    if (formData.incremento_familia < 1) {
      newErrors.incremento_familia = 'El incremento debe ser mayor a 0'
    }

    setErrors(newErrors)
    
return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setSubmitError(null)

    try {
      const requestData: CreatePeriodoLectivoRequest = {
        nombre: formData.nombre.trim(),
        prefijo_alumno: formData.prefijo_alumno.trim(),
        prefijo_docente: formData.prefijo_docente.trim(),
        prefijo_familia: formData.prefijo_familia.trim(),
        prefijo_admin: formData.prefijo_admin.trim(),
        incremento_alumno: formData.incremento_alumno,
        incremento_docente: formData.incremento_docente,
        incremento_familia: formData.incremento_familia,
        periodo_nota: formData.periodo_nota,
        periodo_matricula: formData.periodo_matricula
      }

      let response

      if (mode === 'create') {
        response = await periodoLectivoService.createPeriodoLectivo(requestData)
      } else {
        if (!periodoLectivo) {
          throw new Error('Período lectivo no encontrado')
        }
        response = await periodoLectivoService.updatePeriodoLectivo(periodoLectivo.id, requestData)
      }

      if (response.success) {
        toast.success(response.message)
        onSuccess()
        onClose()
      } else {
        // Manejar errores de validación del backend
        if (response.errors) {
          const backendErrors: FormErrors = {}

          Object.entries(response.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              backendErrors[field as keyof FormErrors] = messages[0]
            }
          })
          setErrors(backendErrors)
        } else {
          setSubmitError(response.message)
        }
      }
    } catch (error: any) {
      console.error('Error al guardar período lectivo:', error)
      setSubmitError('Error inesperado al guardar el período lectivo')
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
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {mode === 'create' ? 'Crear Período Lectivo' : 'Editar Período Lectivo'}
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2 }}>
        {submitError && (
          <Alert severity="error" className="mb-3" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Información General */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" className="mb-2" sx={{ fontWeight: 600, mb: 1 }}>
              Información General
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Nombre del Período"
              value={formData.nombre}
              onChange={handleInputChange('nombre')}
              error={!!errors.nombre}
              helperText={errors.nombre}
              placeholder="Ej: Período 2024-2025"
              disabled={loading}
            />
          </Grid>

          {/* Prefijos */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" className="mb-2 mt-2" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>
              Prefijos de Usuarios
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Prefijo Alumno"
              value={formData.prefijo_alumno}
              onChange={handleInputChange('prefijo_alumno')}
              error={!!errors.prefijo_alumno}
              helperText={errors.prefijo_alumno}
              placeholder="Ej: ALU"
              disabled={loading}
              inputProps={{ maxLength: 10 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Prefijo Docente"
              value={formData.prefijo_docente}
              onChange={handleInputChange('prefijo_docente')}
              error={!!errors.prefijo_docente}
              helperText={errors.prefijo_docente}
              placeholder="Ej: DOC"
              disabled={loading}
              inputProps={{ maxLength: 10 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Prefijo Familia"
              value={formData.prefijo_familia}
              onChange={handleInputChange('prefijo_familia')}
              error={!!errors.prefijo_familia}
              helperText={errors.prefijo_familia}
              placeholder="Ej: FAM"
              disabled={loading}
              inputProps={{ maxLength: 10 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Prefijo Admin"
              value={formData.prefijo_admin}
              onChange={handleInputChange('prefijo_admin')}
              error={!!errors.prefijo_admin}
              helperText={errors.prefijo_admin}
              placeholder="Ej: ADM"
              disabled={loading}
              inputProps={{ maxLength: 10 }}
            />
          </Grid>

          {/* Incrementos */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" className="mb-2 mt-2" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>
              Incrementos Numéricos
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Incremento Alumno"
              value={formData.incremento_alumno}
              onChange={handleInputChange('incremento_alumno')}
              error={!!errors.incremento_alumno}
              helperText={errors.incremento_alumno}
              disabled={loading}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Incremento Docente"
              value={formData.incremento_docente}
              onChange={handleInputChange('incremento_docente')}
              error={!!errors.incremento_docente}
              helperText={errors.incremento_docente}
              disabled={loading}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Incremento Familia"
              value={formData.incremento_familia}
              onChange={handleInputChange('incremento_familia')}
              error={!!errors.incremento_familia}
              helperText={errors.incremento_familia}
              disabled={loading}
              inputProps={{ min: 1 }}
            />
          </Grid>

          {/* Configuraciones */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" className="mb-2 mt-2" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>
              Configuraciones del Período
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={formData.periodo_nota}
                  onChange={handleSwitchChange('periodo_nota')}
                  disabled={loading}
                />
              }
              label="Período de Notas"
              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={formData.periodo_matricula}
                  onChange={handleSwitchChange('periodo_matricula')}
                  disabled={loading}
                />
              }
              label="Período de Matrícula"
              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          size="small"
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          size="small"
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Guardando...' : (mode === 'create' ? 'Crear' : 'Actualizar')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PeriodoLectivoModal