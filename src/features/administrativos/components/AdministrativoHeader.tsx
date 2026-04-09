'use client'

import { useState, useEffect } from 'react'

import { Box, Avatar, Typography, Button, IconButton, Paper, Grid, CircularProgress, Chip } from '@mui/material'
import { PhotoCamera, Delete as DeleteIcon, History as HistoryIcon } from '@mui/icons-material'

import type { AdministrativoFormData } from '../types'

interface AdministrativoHeaderProps {
  formData: AdministrativoFormData
  photoUrl?: string | null
  onPhotoUpload?: (file: File) => void
  onPhotoDelete?: () => void
  onViewChanges?: () => void
  isEdit?: boolean
  isUploading?: boolean
  isDeleting?: boolean
  isActive?: boolean | null
}

export default function AdministrativoHeader({
  formData,
  photoUrl,
  onPhotoUpload,
  onPhotoDelete,
  onViewChanges,
  isEdit = false,
  isUploading = false,
  isDeleting = false,
  isActive = null
}: AdministrativoHeaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      const fileUrl = URL.createObjectURL(file)
      setPreviewUrl(fileUrl)
      if (onPhotoUpload) onPhotoUpload(file)
    }
  }

  useEffect(() => {
    if (photoUrl && previewUrl && !isUploading) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }, [photoUrl, isUploading])

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
    <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', borderRadius: 2 }}>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} sm="auto">
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <Box position="relative">
              <Avatar src={displayImageUrl} sx={{ width: 120, height: 120, border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', opacity: isUploading ? 0.7 : 1, transition: 'opacity 0.3s ease' }}>
                {getInitials()}
              </Avatar>
              {isUploading && (
                <Box position="absolute" top="50%" left="50%" sx={{ transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress size={40} thickness={4} sx={{ color: 'primary.main', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                </Box>
              )}
            </Box>

            {isEdit && (
              <Box display="flex" gap={1}>
                <Button variant="outlined" component="label" startIcon={isUploading ? <CircularProgress size={16} /> : <PhotoCamera />} size="small" disabled={isUploading} sx={{ borderRadius: 2, textTransform: 'none', minWidth: 120 }}>
                  {isUploading ? 'Subiendo...' : (displayImageUrl ? 'Cambiar Foto' : 'Subir Foto')}
                  <input type="file" hidden accept="image/*" onChange={handlePhotoChange} disabled={isUploading} />
                </Button>

                {photoUrl && onPhotoDelete && !isUploading && (
                  <IconButton color="error" size="small" onClick={isDeleting ? undefined : onPhotoDelete} disabled={isDeleting} sx={{ bgcolor: 'error.light', color: 'white', '&:hover': { bgcolor: isDeleting ? 'error.light' : 'error.main' } }}>
                    {isDeleting ? (<CircularProgress size={16} color="inherit" />) : (<DeleteIcon />)}
                  </IconButton>
                )}
              </Box>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} sm>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
                  {getFullName() || 'Nuevo Administrativo'}
                </Typography>
                {isActive !== null && (
                  <Chip
                    label={isActive ? 'Activo' : 'Inactivo'}
                    color={isActive ? 'success' : 'error'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
              {formData.email && (
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2, fontWeight: 400 }}>
                  {formData.email}
                </Typography>
              )}
            </Box>
            {isEdit && onViewChanges && (
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={onViewChanges}
                sx={{ ml: 2, flexShrink: 0, borderRadius: 2, textTransform: 'none' }}
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
