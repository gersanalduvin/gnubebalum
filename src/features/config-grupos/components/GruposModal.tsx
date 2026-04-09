'use client'

import { useEffect, useState } from 'react';

import { Close as CloseIcon } from '@mui/icons-material';
import type {
    SelectChangeEvent
} from '@mui/material';
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
    IconButton,
    InputLabel,
    MenuItem,
    Select
} from '@mui/material';
import { toast } from 'react-hot-toast';

import gruposService from '../services/gruposService';
import type {
    ConfigGrupos,
    CreateGruposRequest,
    Docente,
    Grado,
    Seccion,
    SelectOption,
    Turno,
    UpdateGruposRequest,
    ValidationErrors
} from '../types';

interface GruposModalProps {
  open: boolean
  mode: 'create' | 'edit'
  grupos?: ConfigGrupos
  periodoLectivoId: number | null
  onClose: () => void
  onSuccess: () => void
}

const GruposModal: React.FC<GruposModalProps> = ({
  open,
  mode,
  grupos,
  periodoLectivoId,
  onClose,
  onSuccess
}) => {
  // Estados del formulario
  const [formData, setFormData] = useState<CreateGruposRequest>({
    grado_id: 0,
    seccion_id: 0,
    turno_id: 0,
    periodo_lectivo_id: 0,
    docente_guia: null
  })

  // Estados de opciones para selects
  const [grados, setGrados] = useState<SelectOption[]>([])
  const [secciones, setSecciones] = useState<SelectOption[]>([])
  const [turnos, setTurnos] = useState<SelectOption[]>([])
  const [docentes, setDocentes] = useState<SelectOption[]>([])

  // Estados de UI
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  // Cargar opciones para los selects
  const loadOptions = async () => {
    setLoadingOptions(true)
    try {
      const [gradosRes, seccionesRes, turnosRes, docentesRes] = await Promise.all([
        gruposService.getGrados(),
        gruposService.getSecciones(),
        gruposService.getTurnos(),
        gruposService.getDocentes()
      ])

      // El httpClient ahora devuelve directamente la respuesta del backend
      // No necesitamos acceder a .data adicional
      setGrados(gradosRes?.data?.map((g: Grado) => ({ 
        value: g.id, 
        label: g.abreviatura ? `${g.nombre} (${g.abreviatura})` : g.nombre 
      })) || [])
      setSecciones(seccionesRes?.data?.map((s: Seccion) => ({ value: s.id, label: s.nombre })) || [])
      setTurnos(turnosRes?.data?.map((t: Turno) => ({ value: t.id, label: t.nombre })) || [])
      setDocentes(docentesRes?.data?.map((d: Docente) => ({ value: d.id, label: d.name })) || [])
    } catch (error: any) {
      console.error('Error al cargar opciones:', error)
      toast.error('Error al cargar las opciones del formulario')
    } finally {
      setLoadingOptions(false)
    }
  }

  // Efecto para cargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      loadOptions()
      
      if (mode === 'edit' && grupos) {
        setFormData({
          grado_id: grupos.grado_id,
          seccion_id: grupos.seccion_id,
          turno_id: grupos.turno_id,
          periodo_lectivo_id: periodoLectivoId || 0,
          docente_guia: (typeof grupos.docente_guia === 'object' && grupos.docente_guia !== null) 
            ? (grupos.docente_guia as any).id 
            : grupos.docente_guia
        })
      } else {
        // En modo crear, usar el período lectivo seleccionado de la página principal
        setFormData({
          grado_id: 0,
          seccion_id: 0,
          turno_id: 0,
          periodo_lectivo_id: periodoLectivoId || 0,
          docente_guia: null
        })
      }
      setErrors({})
      setGeneralError(null)
    }
  }, [open, mode, grupos, periodoLectivoId])

  // Manejar cambios en los selects
  const handleSelectChange = (field: keyof CreateGruposRequest) => (
    event: SelectChangeEvent<number>
  ) => {
    const value = event.target.value === '' ? (field === 'docente_guia' ? null : 0) : Number(event.target.value)
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Limpiar error del campo cuando el usuario cambie la selección
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

    if (!formData.grado_id || formData.grado_id === 0) {
      newErrors.grado_id = ['El grado es requerido']
    }

    if (!formData.seccion_id || formData.seccion_id === 0) {
      newErrors.seccion_id = ['La sección es requerida']
    }

    if (!formData.turno_id || formData.turno_id === 0) {
      newErrors.turno_id = ['El turno es requerido']
    }


    if (!formData.periodo_lectivo_id || formData.periodo_lectivo_id === 0) {
      newErrors.periodo_lectivo_id = ['Debe seleccionar un período lectivo en la página principal']
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Método específico para procesar errores de configuración
  const processBackendErrors = (response: any) => {
    // Verificar si hay errores específicos de configuración
    if (response.errors?.configuracion) {
      const configError = Array.isArray(response.errors.configuracion) 
        ? response.errors.configuracion[0] 
        : response.errors.configuracion
      toast.error(configError)
      return
    }

    // Procesar errores de validación para campos específicos (excluyendo configuracion)
    if (response.errors && Object.keys(response.errors).length > 0) {
      const newFieldErrors: ValidationErrors = {}

      Object.keys(response.errors).forEach(field => {
        // Saltar el campo configuracion ya que se maneja arriba
        if (field === 'configuracion') return
        
        const errorMessages = Array.isArray(response.errors[field]) ? response.errors[field] : [response.errors[field]]
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
    if (response.message) {
      toast.error(response.message)
    } else {
      toast.error('Error al procesar la solicitud')
    }
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
        response = await gruposService.createGrupos(formData)
      } else if (mode === 'edit' && grupos) {
        const updateData: UpdateGruposRequest = {
          grado_id: formData.grado_id,
          seccion_id: formData.seccion_id,
          turno_id: formData.turno_id,
          periodo_lectivo_id: formData.periodo_lectivo_id,
          docente_guia: formData.docente_guia
        }
        response = await gruposService.updateGrupos(grupos.id, updateData)
      }

      if (response?.success) {
        toast.success(response.message)
        onSuccess()
        onClose()
      } else {
        // Usar el método específico para procesar errores
        processBackendErrors(response)
      }
    } catch (error: any) {
      console.error('Error inesperado al guardar grupo:', error)
      
      // También procesar errores del catch con el mismo método
      if (error.response?.data) {
        processBackendErrors(error.response.data)
      } else {
        toast.error('Error inesperado al guardar el grupo')
      }
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
      maxWidth="md"
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {mode === 'create' ? 'Crear Nuevo Grupo' : 'Editar Grupo'}
        <IconButton
          onClick={handleClose}
          disabled={loading}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {generalError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {generalError}
          </Alert>
        )}

        {!periodoLectivoId && mode === 'create' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Debe seleccionar un período lectivo en la página principal antes de crear un grupo.
          </Alert>
        )}

        {loadingOptions ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl size="small" error={!!errors.grado_id} required>
                <InputLabel>Grado</InputLabel>
                <Select
                  value={formData.grado_id || ''}
                  onChange={handleSelectChange('grado_id')}
                  label="Grado"
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Seleccionar grado</em>
                  </MenuItem>
                  {grados.map((grado) => (
                    <MenuItem key={grado.value} value={grado.value}>
                      {grado.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.grado_id && (
                  <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                    {errors.grado_id[0]}
                  </Box>
                )}
              </FormControl>

              <FormControl size="small" error={!!errors.seccion_id} required>
                <InputLabel>Sección</InputLabel>
                <Select
                  value={formData.seccion_id || ''}
                  onChange={handleSelectChange('seccion_id')}
                  label="Sección"
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Seleccionar sección</em>
                  </MenuItem>
                  {secciones.map((seccion) => (
                    <MenuItem key={seccion.value} value={seccion.value}>
                      {seccion.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.seccion_id && (
                  <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                    {errors.seccion_id[0]}
                  </Box>
                )}
              </FormControl>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl size="small" error={!!errors.turno_id} required>
                <InputLabel>Turno</InputLabel>
                <Select
                  value={formData.turno_id || ''}
                  onChange={handleSelectChange('turno_id')}
                  label="Turno"
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Seleccionar turno</em>
                  </MenuItem>
                  {turnos.map((turno) => (
                    <MenuItem key={turno.value} value={turno.value}>
                      {turno.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.turno_id && (
                  <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                    {errors.turno_id[0]}
                  </Box>
                )}
              </FormControl>

              {/* Modalidad eliminada del módulo según especificación */}
            </Box>

            <FormControl size="small" error={!!errors.docente_guia}>
              <InputLabel>Docente Guía (Opcional)</InputLabel>
              <Select
                value={formData.docente_guia || ''}
                onChange={handleSelectChange('docente_guia')}
                label="Docente Guía (Opcional)"
                disabled={loading}
              >
                <MenuItem value="">
                  <em>Sin docente guía</em>
                </MenuItem>
                {docentes.map((docente) => (
                  <MenuItem key={docente.value} value={docente.value}>
                    {docente.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.docente_guia && (
                <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                  {errors.docente_guia[0]}
                </Box>
              )}
            </FormControl>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading || loadingOptions}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || loadingOptions || (!periodoLectivoId && mode === 'create')}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Guardando...' : (mode === 'create' ? 'Crear' : 'Actualizar')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default GruposModal
