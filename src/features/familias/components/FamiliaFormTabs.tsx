'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'

import { Link as LinkIcon, LinkOff as LinkOffIcon } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Paper,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import { toast } from 'react-hot-toast'

import { PermissionGuard } from '@/components/PermissionGuard'
import { FamiliasService } from '../services/familiasService'
import type { Alumno, FamiliaFormData, ValidationErrors } from '../types'
import AlumnoSearchModal from './AlumnoSearchModal'

interface Props {
  value: number
  onChange: (index: number) => void
  formData: FamiliaFormData
  setFormData: (data: FamiliaFormData) => void
  errors: ValidationErrors
  isEdit?: boolean
  familiaId?: number
  password?: string
  confirmPassword?: string
  onPasswordChange?: (value: string) => void
  onConfirmPasswordChange?: (value: string) => void
  passwordErrors?: { new_password?: string[]; new_password_confirmation?: string[] }
}

export default function FamiliaFormTabs({
  value,
  onChange,
  formData,
  setFormData,
  errors,
  isEdit = false,
  familiaId,
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  passwordErrors
}: Props) {
  const [estudiantes, setEstudiantes] = useState<Alumno[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [confirmUnlink, setConfirmUnlink] = useState<{ open: boolean; alumno?: Alumno }>({ open: false })
  const [listLoading, setListLoading] = useState(false)
  const [unlinking, setUnlinking] = useState(false)

  const getInitials = (al: Alumno) => {
    const name = `${al.primer_nombre} ${al.segundo_nombre || ''} ${al.primer_apellido} ${al.segundo_apellido || ''}`
      .replace(/\s+/g, ' ')
      .trim()
    const parts = name.split(' ')
    const first = parts[0]?.[0] || ''
    const last = parts[parts.length - 1]?.[0] || ''
    return `${first}${last}`.toUpperCase()
  }

  const getFieldError = useCallback(
    (field: keyof FamiliaFormData): string => {
      const fieldErrors = errors[field as string]
      if (!fieldErrors || fieldErrors.length === 0) return ''
      return fieldErrors[0]
    },
    [errors]
  )

  const hasFieldError = useCallback(
    (field: keyof FamiliaFormData): boolean => {
      const fieldErrors = errors[field as string]
      return !!(fieldErrors && fieldErrors.length > 0)
    },
    [errors]
  )

  useEffect(() => {
    const load = async () => {
      if (!isEdit || !familiaId) return
      try {
        setListLoading(true)
        const list = await FamiliasService.getEstudiantes(familiaId)
        setEstudiantes(list)
      } catch {
      } finally {
        setListLoading(false)
      }
    }
    load()
  }, [isEdit, familiaId])

  const handleSelectAlumno = async (alumno: Alumno) => {
    if (!familiaId) return
    setListLoading(true)
    const res = await FamiliasService.vincularEstudiante(familiaId, alumno.id)
    if (!res?.success) {
      toast.error(res?.message || 'Error al vincular estudiante')
      setListLoading(false)
      return
    }
    toast.success(res?.message || 'Estudiante vinculado')
    try {
      const list = await FamiliasService.getEstudiantes(familiaId)
      setEstudiantes(list)
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'No se pudo refrescar la lista')
    } finally {
      setListLoading(false)
    }
  }

  const handleUnlink = async () => {
    if (!familiaId || !confirmUnlink.alumno) return
    setUnlinking(true)
    setListLoading(true)
    try {
      const res = await FamiliasService.desvincularEstudiante(familiaId, confirmUnlink.alumno.id)
      if (!res?.success) {
        toast.error(res?.message || 'Error al desvincular estudiante')
        setListLoading(false)
        setUnlinking(false)
        return
      }
      toast.success(res?.message || 'Estudiante desvinculado')
      const list = await FamiliasService.getEstudiantes(familiaId)
      setEstudiantes(list)
      setConfirmUnlink({ open: false })
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'No se pudo refrescar la lista')
    } finally {
      setListLoading(false)
      setUnlinking(false)
    }
  }

  return (
    <Box>
      <Tabs value={value} onChange={(_, v) => onChange(v)}>
        <Tab label='Datos Generales' />
        {isEdit && <Tab label='Estudiantes Asociados' />}
        {isEdit && <Tab label='Cambiar contraseña' />}
      </Tabs>

      {value === 0 && (
        <Box p={3}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <TextField
                label='Nombre de Familia'
                value={formData.primer_nombre}
                onChange={e => setFormData({ ...formData, primer_nombre: e.target.value })}
                error={hasFieldError('primer_nombre')}
                helperText={getFieldError('primer_nombre')}
                fullWidth
                size='small'
                required
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
                required
              />
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

      {isEdit && value === 1 && (
        <Box p={3}>
          <div className='flex justify-between items-center mb-2'>
            <h3 className='text-lg font-semibold'>Estudiantes vinculados</h3>
            <PermissionGuard permission='usuarios.familias.vincular_estudiante'>
              <Button
                variant='outlined'
                onClick={() => setSearchOpen(true)}
                startIcon={<LinkIcon />}
                disabled={listLoading}
              >
                Vincular estudiante
              </Button>
            </PermissionGuard>
          </div>
          {listLoading && (
            <div className='flex justify-center my-2'>
              <CircularProgress size={20} />
            </div>
          )}
          {estudiantes.length === 0 && !listLoading ? (
            <Typography variant='body2' color='text.secondary'>
              Sin estudiantes vinculados
            </Typography>
          ) : (
            <Paper variant='outlined' sx={{ borderRadius: 2 }}>
              <List dense>
                {estudiantes.map((al, idx) => (
                  <Fragment key={al.id}>
                    <ListItem
                      secondaryAction={
                        <PermissionGuard permission='usuarios.familias.desvincular_estudiante'>
                          <Tooltip title='Desvincular'>
                            <IconButton
                              edge='end'
                              onClick={() => setConfirmUnlink({ open: true, alumno: al })}
                              disabled={listLoading}
                            >
                              <LinkOffIcon />
                            </IconButton>
                          </Tooltip>
                        </PermissionGuard>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar src={(al as any).foto_url || undefined}>{getInitials(al)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${al.primer_nombre} ${al.segundo_nombre || ''} ${al.primer_apellido} ${al.segundo_apellido || ''}`
                          .replace(/\s+/g, ' ')
                          .trim()}
                        secondary={al.email || ''}
                      />
                    </ListItem>
                    {idx < estudiantes.length - 1 && <Divider component='li' />}
                  </Fragment>
                ))}
              </List>
            </Paper>
          )}

          <AlumnoSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleSelectAlumno} />

          <Dialog open={confirmUnlink.open} onClose={() => setConfirmUnlink({ open: false })} maxWidth='xs' fullWidth>
            <DialogTitle>Confirmar desvinculación</DialogTitle>
            <DialogContent>¿Desea desvincular a este estudiante de la familia?</DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmUnlink({ open: false })}>Cancelar</Button>
              <LoadingButton
                onClick={handleUnlink}
                variant='contained'
                color='warning'
                loading={unlinking}
                disabled={listLoading}
              >
                Desvincular
              </LoadingButton>
            </DialogActions>
          </Dialog>
        </Box>
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
          </Grid>
        </Box>
      )}
    </Box>
  )
}
