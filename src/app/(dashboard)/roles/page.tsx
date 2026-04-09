import { PermissionGuard } from '@/components/PermissionGuard'
import RolesPage from '@/features/roles/pages/RolesPage'

export default function Page() {
  return (
    <PermissionGuard permission="roles.ver">
      <RolesPage />
    </PermissionGuard>
  );
}

export const metadata = {
  title: 'Gestión de Roles',
  description: 'Administra los roles y permisos del sistema'
}