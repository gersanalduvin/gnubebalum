'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Email as EmailIcon } from '@mui/icons-material'
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Select, Tab, Tabs, TextField, Typography } from '@mui/material'

import { PermissionGuard } from '@/components/PermissionGuard'
import { EmailGeneratorService } from '@/features/alumnos/services/emailGeneratorService'
import type { Role } from '@/features/roles/types'
import { openDialogAccessibly } from '@/utils/dialogUtils'
import { AdministrativosService } from '../services/administrativosService'
import type { AdministrativoFormData, ValidationErrors } from '../types'
import AdministrativoHeader from './AdministrativoHeader'

interface Props {
  value: number
  onChange: (index: number) => void
  formData: AdministrativoFormData
  setFormData: (data: AdministrativoFormData) => void
  errors: ValidationErrors
  onGenerateEmail?: () => Promise<void>
  photoUrl?: string | null
  onPhotoUpload?: (file: File) => void
  onPhotoDelete?: () => void
  isEdit?: boolean
  isUploadingPhoto?: boolean
  isDeletingPhoto?: boolean
  onViewChanges?: () => void
  isActive?: boolean | null
  // Control de cambio de contraseña
  password?: string
  confirmPassword?: string
  onPasswordChange?: (value: string) => void
  onConfirmPasswordChange?: (value: string) => void
  passwordErrors?: { new_password?: string[]; new_password_confirmation?: string[] }
  onResetPassword?: () => Promise<void>
  isResetting?: boolean
}

export default function AdministrativoFormTabs({ value, onChange, formData, setFormData, errors, onGenerateEmail, photoUrl, onPhotoUpload, onPhotoDelete, isEdit = false, isUploadingPhoto = false, isDeletingPhoto = false, onViewChanges, isActive, password, confirmPassword, onPasswordChange, onConfirmPasswordChange, passwordErrors, onResetPassword, isResetting }: Props) {
  const [roles, setRoles] = useState<Role[]>([])
  const [emailManuallyEdited, setEmailManuallyEdited] = useState(false)
  const [generatingEmail, setGeneratingEmail] = useState(false)
  const [emailGenerationCounter, setEmailGenerationCounter] = useState(0)
  const didLoadRolesRef = useRef(false)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)

  const handleOpenConfirmReset = useCallback(() => {
    openDialogAccessibly(() => setConfirmResetOpen(true))
  }, [])

  const handleCloseConfirmReset = useCallback(() => {
    if (!isResetting) {
      setConfirmResetOpen(false)
    }
  }, [isResetting])

  const handleConfirmReset = useCallback(() => {
    onResetPassword?.()
    setConfirmResetOpen(false)
  }, [onResetPassword])

  // Helpers para manejo de errores y estilos compactos
  const getFieldError = useCallback(
    (field: keyof AdministrativoFormData): string => {
      const fieldErrors = errors[field]
      if (!fieldErrors || fieldErrors.length === 0) return ''
      return fieldErrors[0]
    },
    [errors]
  )

  const hasFieldError = useCallback(
    (field: keyof AdministrativoFormData): boolean => {
      const fieldErrors = errors[field]
      return !!(fieldErrors && fieldErrors.length > 0)
    },
    [errors]
  )

  const getFieldStyles = useCallback(
    (field: keyof AdministrativoFormData): any => {
      const fieldValue = formData[field]
      const isEmpty = !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')
      if (isEmpty) {
        return {
          '& .MuiInputLabel-root': {
            color: 'warning.main'
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: 'warning.main'
          }
        }
      }
      return {}
    },
    [formData]
  )

  // Normaliza la fecha para el input type="date" (requiere formato yyyy-MM-dd)
  const formatDateForInput = (value?: string | null): string => {
    if (!value) return ''
    const s = String(value)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    return s.length >= 10 ? s.slice(0, 10) : s
  }

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const list = await AdministrativosService.getAdministrativoRolesList()
        setRoles(list)
      } catch (e) {
        // Silenciar errores de permisos o red
        setRoles([])
      }
    }
    if (!didLoadRolesRef.current) {
      didLoadRolesRef.current = true
      loadRoles()
    }
  }, [])

  // Auto-generar email en modo creación, similar a alumnos (con debounce)
  useEffect(() => {
    if (!isEdit && !emailManuallyEdited && formData.primer_nombre && formData.primer_apellido) {
      setEmailGenerationCounter(0)
      const timeoutId = setTimeout(() => {
        const currentEmail = formData.email || ''
        const newEmail = EmailGeneratorService.generateEmail(formData.primer_nombre, formData.primer_apellido)
        // Generar automáticamente si el email está vacío o sigue el patrón
        if ((!currentEmail || currentEmail.includes('@cempp.com')) && newEmail && newEmail !== currentEmail) {
          setFormData({ ...formData, email: newEmail })
        }
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [formData.primer_nombre, formData.primer_apellido, formData.email, emailManuallyEdited, isEdit, setFormData])

  const handleGenerateEmail = useCallback(() => {
    if (!formData.primer_nombre || !formData.primer_apellido) return
    setGeneratingEmail(true)
    const baseEmail = EmailGeneratorService.generateEmail(formData.primer_nombre, formData.primer_apellido)
    if (baseEmail) {
      let finalEmail = baseEmail
      if (emailGenerationCounter > 0) {
        const [localPart, domain] = baseEmail.split('@')
        finalEmail = `${localPart}${emailGenerationCounter}@${domain}`
      }
      setFormData({ ...formData, email: finalEmail })
      setEmailGenerationCounter(prev => prev + 1)
      setEmailManuallyEdited(false)
    }
    setGeneratingEmail(false)
  }, [formData.primer_nombre, formData.primer_apellido, emailGenerationCounter, setFormData])

  const handleEmailChange = useCallback((value: string) => {
    setFormData({ ...formData, email: value })
    setEmailManuallyEdited(true)
    setEmailGenerationCounter(0)
  }, [formData, setFormData])

  return (
    <Box>
      {/* Header con foto y datos básicos */}
      <AdministrativoHeader
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
        <Tab label="Datos Generales" />
        {isEdit && <Tab label="Cambiar contraseña" />}
      </Tabs>

      {value === 0 && (
        <Box p={3}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Primer Nombre"
                value={formData.primer_nombre}
                onChange={e => setFormData({ ...formData, primer_nombre: e.target.value })}
                error={hasFieldError('primer_nombre')}
                helperText={getFieldError('primer_nombre')}
                fullWidth
                size="small"
                sx={getFieldStyles('primer_nombre')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Segundo Nombre"
                value={formData.segundo_nombre}
                onChange={e => setFormData({ ...formData, segundo_nombre: e.target.value })}
                error={hasFieldError('segundo_nombre')}
                helperText={getFieldError('segundo_nombre')}
                fullWidth
                size="small"
                sx={getFieldStyles('segundo_nombre')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Primer Apellido"
                value={formData.primer_apellido}
                onChange={e => setFormData({ ...formData, primer_apellido: e.target.value })}
                error={hasFieldError('primer_apellido')}
                helperText={getFieldError('primer_apellido')}
                fullWidth
                size="small"
                sx={getFieldStyles('primer_apellido')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Segundo Apellido"
                value={formData.segundo_apellido}
                onChange={e => setFormData({ ...formData, segundo_apellido: e.target.value })}
                error={hasFieldError('segundo_apellido')}
                helperText={getFieldError('segundo_apellido')}
                fullWidth
                size="small"
                sx={getFieldStyles('segundo_apellido')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Correo"
                value={formData.email || ''}
                onChange={e => handleEmailChange(e.target.value)}
                error={hasFieldError('email')}
                helperText={getFieldError('email')}
                fullWidth
                size="small"
                sx={getFieldStyles('email')}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleGenerateEmail} disabled={generatingEmail}>
                        <EmailIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={hasFieldError('sexo')} required size="small">
                <InputLabel id="sexo-select-label">Sexo *</InputLabel>
                <Select
                  labelId="sexo-select-label"
                  label="Sexo *"
                  value={formData.sexo || ''}
                  onChange={e => setFormData({ ...formData, sexo: (e.target.value as 'M' | 'F') })}
                  size="small"
                >
                  <MenuItem value="M">Masculino</MenuItem>
                  <MenuItem value="F">Femenino</MenuItem>
                </Select>
                {hasFieldError('sexo') && (
                  <Box mt={0.5}>
                    <span className="text-red-600 text-sm">{getFieldError('sexo')}</span>
                  </Box>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha de nacimiento"
                type="date"
                value={formatDateForInput(formData.fecha_nacimiento)}
                onChange={e => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                error={hasFieldError('fecha_nacimiento')}
                helperText={getFieldError('fecha_nacimiento')}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={hasFieldError('role_id')} size="small">
                <InputLabel id="role-select-label">Rol</InputLabel>
                <Select
                  labelId="role-select-label"
                  label="Rol"
                  value={formData.role_id ?? ''}
                  onChange={e => setFormData({ ...formData, role_id: e.target.value === '' ? null : Number(e.target.value) })}
                  size="small"
                >
                  <MenuItem value="">
                    <em>Sin rol</em>
                  </MenuItem>
                  {roles.map(role => (
                    <MenuItem key={role.id} value={role.id}>{role.nombre}</MenuItem>
                  ))}
                </Select>
                {hasFieldError('role_id') && (
                  <Box mt={0.5}>
                    <span className="text-red-600 text-sm">{getFieldError('role_id')}</span>
                  </Box>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Correo de Notificaciones"
                value={formData.correo_notificaciones || ''}
                onChange={e => setFormData({ ...formData, correo_notificaciones: e.target.value })}
                error={hasFieldError('correo_notificaciones')}
                helperText={getFieldError('correo_notificaciones')}
                fullWidth
                size="small"
                sx={getFieldStyles('correo_notificaciones')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Dirección"
                value={formData.direccion_madre || ''}
                onChange={e => setFormData({ ...formData, direccion_madre: e.target.value })}
                error={hasFieldError('direccion_madre')}
                helperText={getFieldError('direccion_madre')}
                fullWidth
                size="small"
                sx={getFieldStyles('direccion_madre')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Teléfono"
                value={formData.telefono_claro_madre || ''}
                onChange={e => setFormData({ ...formData, telefono_claro_madre: e.target.value })}
                error={hasFieldError('telefono_claro_madre')}
                helperText={getFieldError('telefono_claro_madre')}
                fullWidth
                size="small"
                sx={getFieldStyles('telefono_claro_madre')}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {isEdit && value === 1 && (
        <Box p={3}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <TextField
                type="password"
                label="Nueva contraseña"
                value={password || ''}
                onChange={e => onPasswordChange?.(e.target.value)}
                fullWidth
                size="small"
                error={!!passwordErrors?.new_password && passwordErrors.new_password.length > 0}
                helperText={passwordErrors?.new_password?.[0] || ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="password"
                label="Confirmar contraseña"
                value={confirmPassword || ''}
                onChange={e => onConfirmPasswordChange?.(e.target.value)}
                fullWidth
                size="small"
                error={!!passwordErrors?.new_password_confirmation && passwordErrors.new_password_confirmation.length > 0}
                helperText={passwordErrors?.new_password_confirmation?.[0] || ''}
              />
            </Grid>
            <Grid item xs={12}>
              <div className="flex justify-start mt-2">
                <PermissionGuard permission="usuarios.administrativos.cambiar_password">
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleOpenConfirmReset}
                    disabled={!!isResetting}
                    startIcon={isResetting ? <CircularProgress size={16} /> : undefined}
                  >
                    {isResetting ? 'Reseteando...' : 'Resetear y enviar por correo'}
                  </Button>
                  <Dialog open={confirmResetOpen} onClose={handleCloseConfirmReset} maxWidth="sm" fullWidth>
                    <DialogTitle>
                      <Box className="flex items-center gap-2">
                        <i className='ri-shield-keyhole-line' />
                        Confirmar reseteo de contraseña
                      </Box>
                    </DialogTitle>
                    <DialogContent>
                      <Typography variant="body1" color="text.secondary">
                        ¿Está seguro de que desea resetear la contraseña de este usuario?
                        Se generará una nueva contraseña y será enviada por correo electrónico.
                      </Typography>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={handleCloseConfirmReset} disabled={!!isResetting}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleConfirmReset}
                        variant="contained"
                        color="warning"
                        disabled={!!isResetting}
                        startIcon={isResetting ? <CircularProgress size={16} /> : undefined}
                      >
                        {isResetting ? 'Reseteando...' : 'Confirmar'}
                      </Button>
                    </DialogActions>
                  </Dialog>
                </PermissionGuard>
              </div>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  )
}
