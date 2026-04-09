import { PermissionGuard } from '@/components/PermissionGuard'
import ConfigCatalogoCuentasPage from '@/features/config-catalogo-cuentas/pages/ConfigCatalogoCuentasPage'

export default function Page() {
  return (
    <PermissionGuard permission="config_catalogo_cuentas.index">
      <ConfigCatalogoCuentasPage />
    </PermissionGuard>
  );
}

export const metadata = {
  title: 'Catálogo de Cuentas',
  description: 'Gestión del catálogo de cuentas contables del sistema'
}