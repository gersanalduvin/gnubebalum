'use client'

import ProfessionalProfileForm from '@/features/perfil-profesional/components/ProfessionalProfileForm'
import ProfessionalProfileView from '@/features/perfil-profesional/components/ProfessionalProfileView'
import { ProfessionalProfileService } from '@/features/perfil-profesional/services/professionalProfileService'
import type {
    UserProfessionalProfile,
    UserProfessionalProfileFormData,
    ValidationErrors
} from '@/features/perfil-profesional/types'
import { Edit as EditIcon, Save as SaveIcon, Visibility as VisibilityIcon } from '@mui/icons-material'
import { Alert, Box, Button, CircularProgress, Container, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function MiPerfilProfesionalPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfessionalProfile | null>(null)
  const [formData, setFormData] = useState<UserProfessionalProfileFormData>({
    experiencia_laboral: [],
    formacion_academica: [],
    habilidades_blandas: [],
    referencias: []
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingDocument, setIsUploadingDocument] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const data = await ProfessionalProfileService.getMyProfile()

      if (data) {
        setProfile(data)
        setFormData({
          cedula: data.cedula || '',
          estado_civil: data.estado_civil || '',
          nacionalidad: data.nacionalidad || '',
          presentacion: data.presentacion || '',
          telefono_profesional: data.telefono_profesional || '',
          email_profesional: data.email_profesional || '',
          linkedin_url: data.linkedin_url || '',
          sitio_web: data.sitio_web || '',
          experiencia_laboral: data.experiencia_laboral || [],
          formacion_academica: data.formacion_academica || [],
          habilidades_blandas: data.habilidades_blandas || [],
          referencias: data.referencias || []
        })
        setIsEditMode(false)
      } else {
        // No existe perfil, activar modo edición
        setIsEditMode(true)
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Error al cargar el perfil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setErrors({})
      setSuccessMessage('')
      setErrorMessage('')

      const updatedProfile = await ProfessionalProfileService.updateMyProfile(formData)
      setProfile(updatedProfile)
      setSuccessMessage('Perfil actualizado exitosamente')
      setIsEditMode(false)
    } catch (error: any) {
      if (error.validationErrors) {
        setErrors(error.validationErrors)
      }
      setErrorMessage(error.message || 'Error al guardar el perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDocumentUpload = async (formacionIndex: number, file: File) => {
    try {
      setIsUploadingDocument(true)
      setErrorMessage('')

      const uploadResult = await ProfessionalProfileService.uploadMyFormacionDocument(formacionIndex, file)

      // Actualizar el formData con la URL del documento
      const updatedFormacion = [...(formData.formacion_academica || [])]
      updatedFormacion[formacionIndex] = {
        ...updatedFormacion[formacionIndex],
        documento_path: uploadResult.path,
        documento_url: uploadResult.url
      }
      setFormData({ ...formData, formacion_academica: updatedFormacion })

      setSuccessMessage('Documento subido exitosamente')
    } catch (error: any) {
      setErrorMessage(error.message || 'Error al subir el documento')
    } finally {
      setIsUploadingDocument(false)
    }
  }

  const handleDocumentDelete = async (formacionIndex: number) => {
    try {
      setIsUploadingDocument(true)
      setErrorMessage('')

      await ProfessionalProfileService.deleteMyFormacionDocument(formacionIndex)

      // Actualizar el formData eliminando la referencia al documento
      const updatedFormacion = [...(formData.formacion_academica || [])]
      delete updatedFormacion[formacionIndex].documento_path
      delete updatedFormacion[formacionIndex].documento_url
      setFormData({ ...formData, formacion_academica: updatedFormacion })

      setSuccessMessage('Documento eliminado exitosamente')
    } catch (error: any) {
      setErrorMessage(error.message || 'Error al eliminar el documento')
    } finally {
      setIsUploadingDocument(false)
    }
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box py={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Mi Perfil Profesional</Typography>
          <Box display="flex" gap={2}>
            {!isEditMode && profile && (
              <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setIsEditMode(true)}>
                Editar
              </Button>
            )}
            {isEditMode && profile && (
              <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={() => setIsEditMode(false)}>
                Ver Perfil
              </Button>
            )}
            {isEditMode && (
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            )}
          </Box>
        </Box>

        {successMessage && (
          <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {isEditMode ? (
          <ProfessionalProfileForm
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            onDocumentUpload={handleDocumentUpload}
            onDocumentDelete={handleDocumentDelete}
            isUploadingDocument={isUploadingDocument}
          />
        ) : profile ? (
          <ProfessionalProfileView profile={profile} />
        ) : (
          <Alert severity="info">
            No tienes un perfil profesional creado. Haz clic en "Editar" para crear uno.
          </Alert>
        )}
      </Box>
    </Container>
  )
}
