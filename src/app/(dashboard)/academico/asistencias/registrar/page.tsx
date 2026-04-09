'use client'
import RegistrarPage from '@/features/asistencias/pages/RegistrarPage'
import { PermissionGuard } from '@/components/PermissionGuard'

export default function Page() {
  return (
    <PermissionGuard permission="asistencias.registrar">
      <RegistrarPage />
    </PermissionGuard>
  )
}
