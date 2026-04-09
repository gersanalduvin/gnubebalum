'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { Card, CardContent, Button } from '@mui/material'

import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material'

import { toast } from 'react-hot-toast'

import type { AdministrativoFormData, ValidationErrors } from '../types'
import { AdministrativosService } from '../services/administrativosService'
import AdministrativoFormTabs from '../components/AdministrativoFormTabs'
import { PermissionGuard } from '@/components/PermissionGuard'

export default function AdministrativosCreate() {
  const router = useRouter()
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
    telefono_claro_madre: '',
    fecha_nacimiento: ''
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [saving, setSaving] = useState(false)

  const onGenerateEmail = async () => {
    if (!formData.primer_nombre || !formData.primer_apellido) return
    const email = `${formData.primer_nombre}.${formData.primer_apellido}`.toLowerCase().replace(/\s+/g, '') + '@example.com'
    setFormData({ ...formData, email })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setErrors({})
      const res = await AdministrativosService.createAdministrativo(formData)
      if (res?.success) {
        if (res?.message) toast.success(res.message)
        const id = (res?.data as any)?.id
        if (id) {
          router.push(`/usuarios/administrativos/edit/${id}`)
        } else {
          router.push('/usuarios/administrativos')
        }
      } else {
        // Mostrar errores de validación del backend en los campos
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
      const e = AdministrativosService.handleError(err) as any
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
          <h1 className="text-2xl font-bold">Crear Administrativo</h1>
          <p className="text-gray-600">Registra un nuevo usuario administrativo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push('/usuarios/administrativos')}>
            Volver
          </Button>
          <PermissionGuard permission="usuarios.administrativos.crear">
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
              Guardar
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
            isEdit={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
