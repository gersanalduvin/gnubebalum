'use client'

import { useEffect, useState } from 'react'

import { Delete as DeleteIcon, History as HistoryIcon, PhotoCamera } from '@mui/icons-material'
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Grid,
    IconButton,
    Paper,
    Typography
} from '@mui/material'

import type { AlumnoFormData } from '../types'

interface AlumnoHeaderProps {
  formData: AlumnoFormData
  photoUrl?: string
  onPhotoUpload?: (file: File) => void
  onPhotoDelete?: () => void
  onViewChanges?: () => void
  isEdit?: boolean
  isUploading?: boolean
  isDeleting?: boolean
  isActive?: boolean | null
  readOnly?: boolean
}

export default function AlumnoHeader({
  formData,
  photoUrl,
  onPhotoUpload,
  onPhotoDelete,
  onViewChanges,
  isEdit = false,
  isUploading = false,
  isDeleting = false,
  isActive = null,
  readOnly = false
}: AlumnoHeaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Limpiar previsualización anterior si existe
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      // Crear nueva previsualización
      const fileUrl = URL.createObjectURL(file)
      setPreviewUrl(fileUrl)

      // Llamar al callback para subir al backend
      if (onPhotoUpload) {
        onPhotoUpload(file)
      }
    }
  }

  // NUEVA LÓGICA: Solo limpiar previsualización cuando photoUrl cambie Y sea exitoso
  useEffect(() => {
    // Si tenemos photoUrl del servidor Y hay previsualización, limpiar SOLO la previsualización
    // PERO mantener photoUrl como displayImageUrl
    if (photoUrl && previewUrl && !isUploading) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }, [photoUrl, isUploading])

  // LÓGICA SIMPLIFICADA: Mostrar photoUrl si existe, sino previsualización
  const displayImageUrl = photoUrl || previewUrl || undefined

  const getFullName = () => {
    const firstName = formData.primer_nombre || ''
    const secondName = formData.segundo_nombre || ''
    const firstLastName = formData.primer_apellido || ''
    const secondLastName = formData.segundo_apellido || ''

    return `${firstName} ${secondName} ${firstLastName} ${secondLastName}`.trim()
  }

  const getInitials = () => {
    const firstName = formData.primer_nombre?.[0] || ''
    const firstLastName = formData.primer_apellido?.[0] || ''
    return `${firstName}${firstLastName}`
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 3,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: 2
      }}
    >
      <Grid container spacing={3} alignItems="center">
        {/* Foto del alumno */}
        <Grid item xs={12} sm="auto">
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <Box position="relative">
              <Avatar
                src={displayImageUrl}
                sx={{
                  width: 120,
                  height: 120,
                  border: '4px solid white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  opacity: isUploading ? 0.7 : 1,
                  transition: 'opacity 0.3s ease'
                }}
              >
                {getInitials()}
              </Avatar>

              {/* Indicador de carga superpuesto */}
              {isUploading && (
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  sx={{
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CircularProgress
                    size={40}
                    thickness={4}
                    sx={{
                      color: 'primary.main',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Solo mostrar botones de foto en modo edición y si no es solo lectura */}
            {isEdit && !readOnly && (
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={isUploading ? <CircularProgress size={16} /> : <PhotoCamera />}
                  size="small"
                  disabled={isUploading}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    minWidth: 120
                  }}
                >
                  {isUploading ? 'Subiendo...' : (displayImageUrl ? 'Cambiar Foto' : 'Subir Foto')}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={isUploading}
                  />
                </Button>

                {photoUrl && onPhotoDelete && !isUploading && (
                  <IconButton
                    color="error"
                    size="small"
                    onClick={isDeleting ? undefined : onPhotoDelete}
                    disabled={isDeleting}
                    sx={{
                      bgcolor: 'error.light',
                      color: 'white',
                      '&:hover': {
                        bgcolor: isDeleting ? 'error.light' : 'error.main'
                      }
                    }}
                  >
                    {isDeleting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <DeleteIcon />
                    )}
                  </IconButton>
                )}
              </Box>
            )}
          </Box>
        </Grid>

        {/* Información del alumno */}
        <Grid item xs={12} sm>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="h4"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    mb: 1
                  }}
                >
                  {getFullName() || 'Nuevo Alumno'}
                </Typography>
                {isActive !== null && (
                  <Chip label={isActive ? 'Activo' : 'Inactivo'} color={isActive ? 'success' : 'error'} size="small" sx={{ ml: 1 }} />
                )}
              </Box>

              {formData.email && (
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    fontWeight: 400
                  }}
                >
                  {formData.email}
                </Typography>
              )}

              <Box display="flex" flexWrap="wrap" gap={2}>
                {formData.codigo_unico && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Código Único
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formData.codigo_unico}
                    </Typography>
                  </Box>
                )}

                {formData.codigo_mined && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Código MINED
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formData.codigo_mined}
                    </Typography>
                  </Box>
                )}

                {formData.fecha_nacimiento && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Fecha de Nacimiento
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {new Date(formData.fecha_nacimiento).toLocaleDateString('es-ES')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Botón de historial - Solo en modo edición y si no es solo lectura */}
            {isEdit && onViewChanges && !readOnly && (
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={onViewChanges}
                sx={{
                  ml: 2,
                  flexShrink: 0,
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                Ver Cambios
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )
}
