'use client'
import ReportesPage from '@/features/asistencias/pages/ReportesPage'
import { PermissionGuard } from '@/components/PermissionGuard'

export default function Page() {
  return (
    <PermissionGuard permission="asistencias.ver">
      <ReportesPage />
    </PermissionGuard>
  )
}
