'use client'

import { useEffect, useRef, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

import { ArrowBack as ArrowBackIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material'
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Typography
} from '@mui/material'
import { toast } from 'react-hot-toast'

import { PermissionGuard } from '@/components/PermissionGuard'
import AuditoriaModal from '@/features/auditoria/components/AuditoriaModal'
import AdministrativoFormTabs from '../components/AdministrativoFormTabs'
import { AdministrativosService } from '../services/administrativosService'
import type { AdministrativoFormData, ValidationErrors } from '../types'

export default function AdministrativosEdit() {
  const router = useRouter()
  const params = useParams()
  const idParam = params?.id as string
  const id = Number(idParam)

  const [tabIndex, setTabIndex] = useState(0)
  const [formData, setFormData] = useState<AdministrativoFormData>({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    email: '',
    sexo: 'M',
    role_id: undefined,
    correo_notificaciones: '',
    direccion_madre: '',
    telefono_claro_madre: ''
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [saving, setSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [administrativo, setAdministrativo] = useState<any | null>(null)
  const [isActive, setIsActive] = useState<boolean | null>(null)
  const [toggleLoading, setToggleLoading] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  // Estado de contraseña controlado por la página para integrar con Guardar cambios
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const lastLoadedIdRef = useRef<number | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const computeActive = (obj: any): boolean | null => {
    if (!obj) return null
    if (typeof obj.activo === 'boolean') return obj.activo
    if ('deleted_at' in obj) return obj.deleted_at === null
    return null
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await AdministrativosService.getAdministrativoById(id)
        setFormData({
          primer_nombre: data.primer_nombre || '',
          segundo_nombre: data.segundo_nombre || '',
          primer_apellido: data.primer_apellido || '',
          segundo_apellido: data.segundo_apellido || '',
          email: data.email || '',
          sexo: (data.sexo as 'M' | 'F') || 'M',
          role_id: data.role_id ?? undefined,
          correo_notificaciones: data.correo_notificaciones || '',
          fecha_nacimiento: data.fecha_nacimiento || '',
          direccion_madre: data.direccion_madre || '',
          telefono_claro_madre: data.telefono_claro_madre || ''
        })
        setPhotoUrl(data.foto_url || null)
        setAdministrativo(data)
        setIsActive(computeActive(data))
      } catch (err: any) {
        const e = AdministrativosService.handleError(err)
        toast.error(e.message)
      } finally {
        setLoading(false)
      }
    }
    if (!id) return
    if (lastLoadedIdRef.current === id) return
    lastLoadedIdRef.current = id
    load()
  }, [id])

  const onGenerateEmail = async () => {
    if (!formData.primer_nombre || !formData.primer_apellido) return
    const email =
      `${formData.primer_nombre}.${formData.primer_apellido}`.toLowerCase().replace(/\s+/g, '') + '@example.com'
    setFormData({ ...formData, email })
  }

  const handleViewChanges = () => {
    setAuditOpen(true)
  }

  const handleActivate = async () => {
    try {
      setToggleLoading(true)
      const res = await AdministrativosService.activateAdministrativo(id)
      if (res?.success) {
        setIsActive(computeActive(res?.data) ?? true)
        toast.success(res?.message || 'Usuario activado')
      } else {
        toast.error(res?.message || 'Error al activar usuario')
      }
    } finally {
      setToggleLoading(false)
    }
  }

  const handleDeactivate = async () => {
    try {
      setToggleLoading(true)
      const res = await AdministrativosService.deactivateAdministrativo(id)
      if (res?.success) {
        setIsActive(computeActive(res?.data) ?? false)
        toast.success(res?.message || 'Usuario desactivado')
      } else {
        toast.error(res?.message || 'Error al desactivar usuario')
      }
    } finally {
      setToggleLoading(false)
    }
  }

  const handlePhotoUpload = async (file: File) => {
    try {
      setIsUploadingPhoto(true)
      const updated = await AdministrativosService.uploadPhoto(id, file)
      setPhotoUrl(updated.foto_url || null)
    } catch (err: any) {
      const e = AdministrativosService.handleError(err)
      toast.error(e.message)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handlePhotoDelete = async () => {
    try {
      setIsDeletingPhoto(true)
      const updated = await AdministrativosService.deletePhoto(id)
      setPhotoUrl(updated.foto_url || null)
    } catch (err: any) {
      const e = AdministrativosService.handleError(err)
      toast.error(e.message)
    } finally {
      setIsDeletingPhoto(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setErrors({})
      // Si el tab activo es Cambiar contraseña, ejecutar cambio de contraseña
      if (tabIndex === 1) {
        const localErrors: ValidationErrors = {}
        if (!password || password.trim() === '') {
          localErrors.new_password = ['La contraseña es requerida']
        }
        if (password.length < 8) {
          localErrors.new_password = [
            ...(localErrors.new_password || []),
            'La contraseña debe tener al menos 8 caracteres'
          ]
        }
        if (password !== confirmPassword) {
          localErrors.new_password_confirmation = ['Las contraseñas no coinciden']
        }

        if (Object.keys(localErrors).length > 0) {
          setErrors(localErrors)
          toast.error('Errores de validación')
          return
        }

        const res = await AdministrativosService.changePasswordAdmin(id, {
          new_password: password,
          new_password_confirmation: confirmPassword
        })
        if (res?.success) {
          if (res?.message) toast.success(res.message)
          router.push('/usuarios/administrativos')
        } else {
          const backendErrors: ValidationErrors = {}
          Object.entries(res?.errors || {}).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              backendErrors[field as keyof ValidationErrors] = messages
            }
          })
          setErrors(backendErrors)
          toast.error(res?.message || 'Errores de validación')
        }
      } else {
        // Actualización de datos generales
        const res = await AdministrativosService.updateAdministrativo(id, formData)
        if (res?.success) {
          if (res?.message) toast.success(res.message)
          router.push('/usuarios/administrativos')
        } else {
          const backendErrors: ValidationErrors = {}
          Object.entries(res?.errors || {}).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              backendErrors[field as keyof ValidationErrors] = messages
            }
          })
          setErrors(backendErrors)
          toast.error(res?.message || 'Errores de validación')
        }
      }
    } catch (err: any) {
      const e = AdministrativosService.handleError(err) as any
      setErrors(e.errors || {})
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    try {
      if (!id) return
      setIsResetting(true)
      const res = await AdministrativosService.resetPasswordAdmin(id)
      if (res?.success) {
        toast.success(res?.message || 'Contraseña reiniciada y correo encolado para envío')
      } else {
        // Mostrar mensaje de error genérico o específico
        if (res?.errors && (res.errors as any).email) {
          const emailErr = (res.errors as any).email
          toast.error(Array.isArray(emailErr) ? emailErr[0] : String(emailErr))
        } else {
          toast.error(res?.message || 'No se pudo resetear la contraseña')
        }
      }
    } catch (err: any) {
      const e = AdministrativosService.handleError(err)
      toast.error(e.message)
    } finally {
      setIsResetting(false)
    }
  }

  const handleDelete = async () => {
    if (!administrativo) return

    try {
      setIsDeleting(true)
      await AdministrativosService.deleteAdministrativo(administrativo.id)
      toast.success('Administrativo eliminado exitosamente')
      router.push('/usuarios/administrativos')
    } catch (err: any) {
      const e = AdministrativosService.handleError(err)
      toast.error(e.message || 'Error al eliminar el administrativo')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className='p-6'>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <Skeleton variant='text' width={200} height={32} />
            <Skeleton variant='text' width={300} height={20} />
          </div>
          <div className='flex gap-2'>
            <Skeleton variant='rectangular' width={100} height={36} />
            <Skeleton variant='rectangular' width={120} height={36} />
            <Skeleton variant='rectangular' width={120} height={36} />
          </div>
        </div>
        <Card>
          <CardContent>
            <Skeleton variant='rectangular' width='100%' height={400} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!administrativo) {
    return (
      <div className='p-6'>
        <Alert severity='error'>No se pudo cargar la información del administrativo.</Alert>
      </div>
    )
  }

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold'>Editar Administrativo</h1>
          <p className='text-gray-600'>Actualiza la información del usuario administrativo</p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outlined'
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/usuarios/administrativos')}
          >
            Volver
          </Button>
          <PermissionGuard permission='usuarios.administrativos.editar'>
            <Button variant='contained' startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
              Guardar cambios
            </Button>
          </PermissionGuard>
          {isActive === true ? (
            <PermissionGuard permission='usuarios.administrativos.desactivar'>
              <Button
                variant='contained'
                color='warning'
                startIcon={toggleLoading ? <CircularProgress size={20} /> : undefined}
                onClick={handleDeactivate}
                disabled={saving || toggleLoading}
              >
                Desactivar
              </Button>
            </PermissionGuard>
          ) : isActive === false ? (
            <PermissionGuard permission='usuarios.administrativos.activar'>
              <Button
                variant='contained'
                color='success'
                startIcon={toggleLoading ? <CircularProgress size={20} /> : undefined}
                onClick={handleActivate}
                disabled={saving || toggleLoading}
              >
                Activar
              </Button>
            </PermissionGuard>
          ) : null}
          <PermissionGuard permission='usuarios.administrativos.eliminar'>
            <Button
              variant='contained'
              color='error'
              startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
              onClick={() => setShowDeleteModal(true)}
              disabled={saving || isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <CardContent>
          <AdministrativoFormTabs
            value={tabIndex}
            onChange={setTabIndex}
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            onGenerateEmail={onGenerateEmail}
            photoUrl={photoUrl}
            onPhotoUpload={handlePhotoUpload}
            onPhotoDelete={handlePhotoDelete}
            isEdit
            isUploadingPhoto={isUploadingPhoto}
            isDeletingPhoto={isDeletingPhoto}
            onViewChanges={handleViewChanges}
            isActive={isActive}
            // Props controladas para cambio de contraseña
            password={password}
            confirmPassword={confirmPassword}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            passwordErrors={{
              new_password: errors.new_password,
              new_password_confirmation: errors.new_password_confirmation
            }}
            onResetPassword={handleResetPassword}
            isResetting={isResetting}
          />
        </CardContent>
      </Card>

      <AuditoriaModal open={auditOpen} model={'users'} id={id} onClose={() => setAuditOpen(false)} />

      {/* Pie de formulario con acciones */}
      <div className='flex justify-end gap-2 mt-4'>
        <Button
          variant='outlined'
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/usuarios/administrativos')}
        >
          Volver
        </Button>
        <PermissionGuard permission='usuarios.administrativos.editar'>
          <Button variant='contained' startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
            Guardar cambios
          </Button>
        </PermissionGuard>
        {isActive === true ? (
          <PermissionGuard permission='usuarios.administrativos.desactivar'>
            <Button
              variant='contained'
              color='warning'
              startIcon={toggleLoading ? <CircularProgress size={20} /> : undefined}
              onClick={handleDeactivate}
              disabled={saving}
            >
              Desactivar
            </Button>
          </PermissionGuard>
        ) : isActive === false ? (
          <PermissionGuard permission='usuarios.administrativos.activar'>
            <Button
              variant='contained'
              color='success'
              startIcon={toggleLoading ? <CircularProgress size={20} /> : undefined}
              onClick={handleActivate}
              disabled={saving}
            >
              Activar
            </Button>
          </PermissionGuard>
        ) : null}
        <PermissionGuard permission='usuarios.administrativos.eliminar'>
          <Button
            variant='contained'
            color='error'
            startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
            onClick={() => setShowDeleteModal(true)}
            disabled={saving || isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </PermissionGuard>
      </div>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar al administrativo{' '}
            <strong>
              {administrativo?.primer_nombre} {administrativo?.primer_apellido}
            </strong>
            ?
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            color='error'
            variant='contained'
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
