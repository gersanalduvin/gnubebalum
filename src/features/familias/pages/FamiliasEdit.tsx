'use client'

import { useEffect, useRef, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

import {
  ArrowBack as ArrowBackIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  ManageHistory as ManageHistoryIcon,
  Save as SaveIcon
} from '@mui/icons-material'
import {
  Button,
  Card,
  CardContent,
  Chip,
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
import FamiliaFormTabs from '../components/FamiliaFormTabs'
import { FamiliasService } from '../services/familiasService'
import type { FamiliaFormData, ValidationErrors } from '../types'

export default function FamiliasEdit() {
  const router = useRouter()
  const params = useParams()
  const idParam = params?.id as string
  const id = Number(idParam)

  const [tabIndex, setTabIndex] = useState(0)
  const [formData, setFormData] = useState<FamiliaFormData>({
    primer_nombre: '',
    email: ''
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isActive, setIsActive] = useState<boolean | null>(null)
  const [toggleLoading, setToggleLoading] = useState(false)
  const lastLoadedIdRef = useRef<number | null>(null)
  const [auditOpen, setAuditOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

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
        const data = await FamiliasService.getFamiliaById(id)
        setFormData({
          primer_nombre: data.primer_nombre || '',
          email: data.email || '',
          correo_notificaciones: (data as any)?.correo_notificaciones || ''
        })
        setIsActive(computeActive(data))
      } catch (err: any) {
        const e = FamiliasService.handleError(err)
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

  const handleSave = async () => {
    try {
      setSaving(true)
      setErrors({})
      if (tabIndex === 2) {
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
        const res = await FamiliasService.changePasswordAdmin(id, {
          new_password: password,
          new_password_confirmation: confirmPassword
        })
        if (res?.success) {
          if (res?.message) toast.success(res.message)
          router.push('/usuarios/familias')
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
        const res = await FamiliasService.updateFamilia(id, formData)
        if (res?.success) {
          if (res?.message) toast.success(res.message)
          router.push('/usuarios/familias')
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
      const e = FamiliasService.handleError(err) as any
      setErrors(e.errors || {})
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async () => {
    try {
      setToggleLoading(true)
      const res = await FamiliasService.activateFamilia(id)
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
      const res = await FamiliasService.deactivateFamilia(id)
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

  const handleViewChanges = () => {
    setAuditOpen(true)
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await FamiliasService.deleteFamilia(id)
      toast.success('Familia eliminada exitosamente')
      router.push('/usuarios/familias')
    } catch (err: any) {
      const e = FamiliasService.handleError(err)
      toast.error(e.message || 'Error al eliminar la familia')
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

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold'>Editar Familia</h1>
          <p className='text-gray-600'>Actualiza la información del usuario familia</p>
          {isActive !== null && (
            <div className='mt-2'>
              <Chip label={isActive ? 'Activo' : 'Inactivo'} color={isActive ? 'success' : 'error'} size='small' />
            </div>
          )}
        </div>
        <div className='flex gap-2'>
          <Button variant='outlined' startIcon={<ArrowBackIcon />} onClick={() => router.push('/usuarios/familias')}>
            Volver
          </Button>
          <PermissionGuard permission='auditoria.ver'>
            <Button variant='outlined' startIcon={<ManageHistoryIcon />} onClick={handleViewChanges}>
              Ver cambios
            </Button>
          </PermissionGuard>
          <PermissionGuard permission='usuarios.familias.editar'>
            <Button variant='contained' startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
              Guardar cambios
            </Button>
          </PermissionGuard>
          {isActive === true ? (
            <PermissionGuard permission='usuarios.familias.desactivar'>
              <Button
                variant='contained'
                color='warning'
                startIcon={toggleLoading ? <CircularProgress size={20} /> : <BlockIcon />}
                onClick={handleDeactivate}
                disabled={saving || toggleLoading}
              >
                Desactivar
              </Button>
            </PermissionGuard>
          ) : isActive === false ? (
            <PermissionGuard permission='usuarios.familias.activar'>
              <Button
                variant='contained'
                color='success'
                startIcon={toggleLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                onClick={handleActivate}
                disabled={saving || toggleLoading}
              >
                Activar
              </Button>
            </PermissionGuard>
          ) : null}
          <PermissionGuard permission='usuarios.familias.eliminar'>
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
          <FamiliaFormTabs
            value={tabIndex}
            onChange={setTabIndex}
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            isEdit
            familiaId={id}
            password={password}
            confirmPassword={confirmPassword}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            passwordErrors={{
              new_password: errors.new_password,
              new_password_confirmation: errors.new_password_confirmation
            }}
          />
        </CardContent>
      </Card>

      <AuditoriaModal open={auditOpen} model={'users'} id={id} onClose={() => setAuditOpen(false)} />

      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Está seguro de que desea eliminar esta familia?</Typography>
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
