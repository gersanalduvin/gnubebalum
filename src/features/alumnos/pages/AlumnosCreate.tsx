'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  Card,
  CardContent,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material'
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material'
import { toast } from 'react-hot-toast'

import type { AlumnoFormData, ValidationErrors } from '../types'
import { AlumnosService } from '../services/alumnosService'
import AlumnoFormTabs from '../components/AlumnoFormTabs'

export default function AlumnosCreate() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [formData, setFormData] = useState<AlumnoFormData>({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    email: '',
    tipo_usuario: 'alumno'
  })

  const handleFieldChange = (field: keyof AlumnoFormData, value: any) => {
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

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Validaciones requeridas
    if (!formData.primer_nombre?.trim()) {
      newErrors.primer_nombre = ['El primer nombre es requerido']
    }
    
    if (!formData.primer_apellido?.trim()) {
      newErrors.primer_apellido = ['El primer apellido es requerido']
    }

    if (!formData.sexo) {
      newErrors.sexo = ['El sexo es requerido']
    }

    if (!formData.fecha_nacimiento) {
      newErrors.fecha_nacimiento = ['La fecha de nacimiento es requerida']
    }

    // Validación de email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = ['El formato del email no es válido']
    }

    // Validación de correo de notificaciones
    if (formData.correo_notificaciones && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo_notificaciones)) {
      newErrors.correo_notificaciones = ['El formato del correo de notificaciones no es válido']
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija los errores en el formulario')
      return
    }

    try {
      setLoading(true)
      setErrors({})
      
      const response = await AlumnosService.createAlumno(formData)
      
      if (response.success) {
        toast.success(response.message)
        // Redireccionar al componente de edición
        router.push(`/usuarios/alumnos/edit/${response.data.id}`)
      } else {
        // Manejar errores de validación del backend
        if (response.errors) {
          const backendErrors: ValidationErrors = {}

          Object.entries(response.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              backendErrors[field as keyof ValidationErrors] = messages
            }
          })
          setErrors(backendErrors)
          toast.error('Por favor corrige los errores en el formulario')
        } else {
          toast.error(response.message || 'Error al crear el alumno')
        }
      }
    } catch (error: any) {
      console.error('Error inesperado al crear alumno:', error)
      toast.error('Error inesperado al crear el alumno')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/usuarios/alumnos')
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Alumno</h1>
          <p className="text-gray-600">Registra la información del nuevo estudiante</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={handleBack}
            disabled={loading}
          >
            Volver
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar Alumno'}
          </Button>
        </div>
      </div>

      {/* Mostrar errores generales */}
      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Por favor, corrija los errores en el formulario antes de continuar.
        </Alert>
      )}

      <Card>
        <CardContent>
          <AlumnoFormTabs
            formData={formData}
            onChange={handleFieldChange}
            errors={errors}
            isEdit={false}
          />
        </CardContent>
      </Card>

      {/* Botones de acción en la parte inferior */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Alumno'}
        </Button>
      </Box>
    </div>
  )
}