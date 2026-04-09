'use client'

import { useCallback } from 'react'

import { Box, FormControl, Grid, InputLabel, MenuItem, Select, Tab, Tabs, TextField } from '@mui/material'

import { PermissionGuard } from '@/components/PermissionGuard'
import type { DocenteFormData, ValidationErrors } from '../types'
import AsociarAsignaturasTab from './AsociarAsignaturasTab'
import DocenteHeader from './DocenteHeader'

interface Props {
  value: number
  onChange: (index: number) => void
  formData: DocenteFormData
  setFormData: (data: DocenteFormData) => void
  errors: ValidationErrors
  isEdit?: boolean
  photoUrl?: string | null
  onPhotoUpload?: (file: File) => void
  onPhotoDelete?: () => void
  isUploadingPhoto?: boolean
  isDeletingPhoto?: boolean
  onViewChanges?: () => void
  isActive?: boolean | null
  password?: string
  confirmPassword?: string
  onPasswordChange?: (value: string) => void
  onConfirmPasswordChange?: (value: string) => void
  passwordErrors?: { new_password?: string[]; new_password_confirmation?: string[] }
  docenteId?: number
}

export default function DocenteFormTabs({
  value,
  onChange,
  formData,
  setFormData,
  errors,
  isEdit = false,
  photoUrl,
  onPhotoUpload,
  onPhotoDelete,
  isUploadingPhoto = false,
  isDeletingPhoto = false,
  onViewChanges,
  isActive,
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  passwordErrors,
  docenteId
}: Props) {
  const getFieldError = useCallback(
    (field: keyof DocenteFormData): string => {
      const fieldErrors = errors[field as string]
      if (!fieldErrors || fieldErrors.length === 0) return ''
      return fieldErrors[0]
    },
    [errors]
  )

  const hasFieldError = useCallback(
    (field: keyof DocenteFormData): boolean => {
      const fieldErrors = errors[field as string]
      return !!(fieldErrors && fieldErrors.length > 0)
    },
    [errors]
  )

  return (
    <Box>
      <DocenteHeader
        formData={formData}
        photoUrl={photoUrl}
        onPhotoUpload={onPhotoUpload}
        onPhotoDelete={onPhotoDelete}
        onViewChanges={onViewChanges}
        isEdit={isEdit}
        isUploading={isUploadingPhoto}
        isDeleting={isDeletingPhoto}
        isActive={isActive}
      />
      <Tabs value={value} onChange={(_, v) => onChange(v)}>
        <Tab label='Datos Generales' />
        {isEdit && <Tab label='Asociar asignaturas' />}
        {isEdit && <Tab label='Cambiar contraseña' />}
      </Tabs>

      {value === 0 && (
        <Box p={3}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Primer Nombre'
                value={formData.primer_nombre}
                onChange={e => setFormData({ ...formData, primer_nombre: e.target.value })}
                error={hasFieldError('primer_nombre')}
                helperText={getFieldError('primer_nombre')}
                fullWidth
                size='small'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Segundo Nombre'
                value={formData.segundo_nombre}
                onChange={e => setFormData({ ...formData, segundo_nombre: e.target.value })}
                error={hasFieldError('segundo_nombre')}
                helperText={getFieldError('segundo_nombre')}
                fullWidth
                size='small'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Primer Apellido'
                value={formData.primer_apellido}
                onChange={e => setFormData({ ...formData, primer_apellido: e.target.value })}
                error={hasFieldError('primer_apellido')}
                helperText={getFieldError('primer_apellido')}
                fullWidth
                size='small'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Segundo Apellido'
                value={formData.segundo_apellido}
                onChange={e => setFormData({ ...formData, segundo_apellido: e.target.value })}
                error={hasFieldError('segundo_apellido')}
                helperText={getFieldError('segundo_apellido')}
                fullWidth
                size='small'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Correo'
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                error={hasFieldError('email')}
                helperText={getFieldError('email')}
                fullWidth
                size='small'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={hasFieldError('sexo')} size='small'>
                <InputLabel id='sexo-select-label'>Sexo</InputLabel>
                <Select
                  labelId='sexo-select-label'
                  label='Sexo'
                  value={formData.sexo || ''}
                  onChange={e => setFormData({ ...formData, sexo: e.target.value as 'M' | 'F' })}
                  size='small'
                >
                  <MenuItem value='M'>Masculino</MenuItem>
                  <MenuItem value='F'>Femenino</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Correo de Notificaciones'
                value={formData.correo_notificaciones || ''}
                onChange={e => setFormData({ ...formData, correo_notificaciones: e.target.value })}
                error={hasFieldError('correo_notificaciones')}
                helperText={getFieldError('correo_notificaciones')}
                fullWidth
                size='small'
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {isEdit && value === 1 && docenteId && (
        <AsociarAsignaturasTab docenteId={docenteId} />
      )}

      {isEdit && value === 2 && (
        <Box p={3}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <TextField
                type='password'
                label='Nueva contraseña'
                value={password || ''}
                onChange={e => onPasswordChange?.(e.target.value)}
                fullWidth
                size='small'
                error={!!passwordErrors?.new_password && passwordErrors.new_password.length > 0}
                helperText={passwordErrors?.new_password?.[0] || ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type='password'
                label='Confirmar contraseña'
                value={confirmPassword || ''}
                onChange={e => onConfirmPasswordChange?.(e.target.value)}
                fullWidth
                size='small'
                error={
                  !!passwordErrors?.new_password_confirmation && passwordErrors.new_password_confirmation.length > 0
                }
                helperText={passwordErrors?.new_password_confirmation?.[0] || ''}
              />
            </Grid>
            <Grid item xs={12}>
              <PermissionGuard permission='usuarios.docentes.cambiar_password'>
                <small className='text-gray-500'>Use Guardar cambios para aplicar la nueva contraseña.</small>
              </PermissionGuard>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  )
}
