'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, Button } from '@mui/material'
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { toast } from 'react-hot-toast'

import type { DocenteFormData, ValidationErrors } from '../types'
import { DocentesService } from '../services/docentesService'
import DocenteFormTabs from '../components/DocenteFormTabs'
import { PermissionGuard } from '@/components/PermissionGuard'

export default function DocentesCreate() {
  const router = useRouter()
  const [formData, setFormData] = useState<DocenteFormData>({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    email: '',
    sexo: 'M',
    role_id: null,
    correo_notificaciones: ''
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      setErrors({})
      const res = await DocentesService.createDocente({ ...formData, tipo_usuario: 'docente' })
      if (res?.success) {
        if (res?.message) toast.success(res.message)
        const id = (res?.data as any)?.id
        if (id) {
          router.push(`/usuarios/docentes/edit/${id}`)
        } else {
          router.push('/usuarios/docentes')
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
      const e = DocentesService.handleError(err) as any
      setErrors(e.errors || {})
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Nuevo Docente</h1>
          <p className="text-gray-600">Registre un nuevo usuario docente</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push('/usuarios/docentes')}>
            Volver
          </Button>
          <PermissionGuard permission="usuarios.docentes.crear">
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
              Guardar
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <CardContent>
          <DocenteFormTabs value={0} onChange={() => {}} formData={formData} setFormData={setFormData} errors={errors} />
        </CardContent>
      </Card>
    </div>
  )
}
