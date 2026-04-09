'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material'
import { Button, Card, CardContent } from '@mui/material'
import { toast } from 'react-hot-toast'

import { PermissionGuard } from '@/components/PermissionGuard'
import FamiliaFormTabs from '../components/FamiliaFormTabs'
import { FamiliasService } from '../services/familiasService'
import type { FamiliaFormData, ValidationErrors } from '../types'

export default function FamiliasCreate() {
  const router = useRouter()
  const [formData, setFormData] = useState<FamiliaFormData>({
    primer_nombre: '',
    email: '',
    correo_notificaciones: ''
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      setErrors({})
      const res = await FamiliasService.createFamilia({ ...formData, tipo_usuario: 'familia' })
      if (res?.success) {
        if (res?.message) toast.success(res.message)
        const id = (res?.data as any)?.id
        if (id) {
          router.push(`/usuarios/familias/edit/${id}`)
        } else {
          router.push('/usuarios/familias')
        }
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
    } catch (err: any) {
      const e = FamiliasService.handleError(err) as any
      setErrors(e.errors || {})
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold'>Nueva Familia</h1>
          <p className='text-gray-600'>Registre un nuevo usuario familia</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outlined' startIcon={<ArrowBackIcon />} onClick={() => router.push('/usuarios/familias')}>
            Volver
          </Button>
          <PermissionGuard permission='usuarios.familias.crear'>
            <Button variant='contained' startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
              Guardar
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <CardContent>
          <FamiliaFormTabs
            value={0}
            onChange={() => {}}
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        </CardContent>
      </Card>
    </div>
  )
}
