# Sistema de Permisos - Guía de Uso

Este documento explica cómo utilizar el sistema de permisos implementado en la aplicación.

## Estructura del Sistema

El sistema de permisos consta de varios componentes:

1. **Middleware de permisos** - Valida acceso a rutas
2. **Hook usePermissions** - Para verificar permisos en componentes
3. **Componente PermissionGuard** - Para ocultar elementos
4. **HOC withPermissions** - Para proteger páginas completas
5. **Configuración de rutas protegidas** - Define qué rutas requieren permisos

## Configuración de Rutas Protegidas

### Archivo: `src/configs/protectedRoutes.ts`

```typescript
// Ejemplo de configuración
export const PROTECTED_ROUTES: RoutePermission[] = [
  {
    path: '/admin',
    permissions: ['admin.access'],
    requireAll: false
  },
  {
    path: '/users',
    permissions: ['users.view', 'users.manage'],
    requireAll: false // Solo necesita uno de los permisos
  },
  {
    path: '/reports/financial',
    permissions: ['reports.financial', 'admin.access'],
    requireAll: true // Necesita TODOS los permisos
  }
]
```

## Uso del Hook usePermissions

### En componentes React:

```typescript
import { usePermissions } from '@/hooks/usePermissions'

function MyComponent() {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    canAccessRoute,
    getUserPermissions 
  } = usePermissions()

  // Verificar un permiso específico
  const canEditUsers = hasPermission('users.edit')

  // Verificar si tiene al menos uno de varios permisos
  const canManageContent = hasAnyPermission(['posts.edit', 'pages.edit'])

  // Verificar si tiene todos los permisos
  const canAccessFinancials = hasAllPermissions(['reports.view', 'financial.access'])

  // Verificar acceso a una ruta
  const canAccessAdmin = canAccessRoute('/admin')

  return (
    <div>
      {canEditUsers && (
        <button>Editar Usuario</button>
      )}
      
      {canManageContent && (
        <div>Panel de Gestión de Contenido</div>
      )}
    </div>
  )
}
```

## Uso del Componente PermissionGuard

### Ocultar elementos basado en permisos:

```typescript
import { PermissionGuard } from '@/components/PermissionGuard'

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Mostrar solo si tiene el permiso específico */}
      <PermissionGuard permission="users.view">
        <button>Ver Usuarios</button>
      </PermissionGuard>

      {/* Mostrar si tiene al menos uno de los permisos */}
      <PermissionGuard 
        permissions={['posts.create', 'pages.create']}
        requireAll={false}
      >
        <button>Crear Contenido</button>
      </PermissionGuard>

      {/* Mostrar solo si tiene TODOS los permisos */}
      <PermissionGuard 
        permissions={['admin.access', 'system.manage']}
        requireAll={true}
      >
        <button>Configuración del Sistema</button>
      </PermissionGuard>

      {/* Con contenido alternativo */}
      <PermissionGuard 
        permission="reports.view"
        fallback={<p>No tienes permisos para ver reportes</p>}
      >
        <ReportsComponent />
      </PermissionGuard>
    </div>
  )
}
```

## Uso del HOC withPermissions

### Proteger páginas completas:

```typescript
import { withPermissions } from '@/hocs/withPermissions'

function AdminPage() {
  return (
    <div>
      <h1>Panel de Administración</h1>
      <p>Solo los administradores pueden ver esto</p>
    </div>
  )
}

// Proteger la página con permisos específicos
export default withPermissions(AdminPage, {
  permissions: ['admin.access'],
  requireAll: false,
  redirectTo: '/unauthorized'
})
```

### Ejemplo con múltiples permisos:

```typescript
function FinancialReportsPage() {
  return (
    <div>
      <h1>Reportes Financieros</h1>
      <p>Contenido sensible financiero</p>
    </div>
  )
}

// Requiere TODOS los permisos especificados
export default withPermissions(FinancialReportsPage, {
  permissions: ['reports.financial', 'data.sensitive'],
  requireAll: true, // Debe tener ambos permisos
  loadingComponent: <div>Verificando permisos...</div>,
  redirectTo: '/unauthorized'
})
```

## Verificación en el Servidor

### En API Routes o Server Components:

```typescript
import { checkServerPermissions } from '@/utils/permissionMiddleware'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Verificar permisos en el servidor
  const { hasAccess, user } = await checkServerPermissions(
    request,
    ['api.users.read'],
    false // requireAll
  )

  if (!hasAccess) {
    return new Response('Forbidden', { status: 403 })
  }

  // Continuar con la lógica de la API
  return Response.json({ users: [] })
}
```

## Tipos de Usuario

### Superadmin
- `superadmin: true` en la sesión
- Tiene acceso a TODAS las rutas y funcionalidades
- Bypasea todas las verificaciones de permisos

### Usuario con Rol
- `role_id` asignado
- Permisos basados en el rol y permisos individuales
- Acceso limitado según los permisos asignados

## Estructura de Datos Esperada

### Respuesta del API de autenticación:

```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@test.com",
    "superadmin": false,
    "role_id": 1,
    "role_name": "Administrador"
  },
  "permisos": {
    "tipo": "rol",
    "rol": "Administrador",
    "permisos": [
      "usuarios.ver",
      "usuarios.crear",
      "reportes.ver"
    ],
    "descripcion": "Permisos asignados por rol: Administrador"
  },
  "token": "..."
}
```

## Mejores Prácticas

1. **Principio de menor privilegio**: Asigna solo los permisos mínimos necesarios
2. **Nombres descriptivos**: Usa nombres claros para los permisos (ej: `users.edit`, `reports.financial`)
3. **Agrupación lógica**: Agrupa permisos por módulo o funcionalidad
4. **Verificación doble**: Verifica permisos tanto en frontend como backend
5. **Manejo de errores**: Siempre maneja casos donde los permisos fallen
6. **Feedback al usuario**: Proporciona mensajes claros cuando no tenga permisos

## Debugging

### Para debuggear permisos:

```typescript
const { getUserPermissions } = usePermissions()

// Ver todos los permisos del usuario actual
console.log('Permisos del usuario:', getUserPermissions())
```

### En el middleware:

```typescript
// El middleware ya incluye logs de errores
// Revisa la consola del servidor para errores de permisos
```

## Rutas Especiales

- `/unauthorized` - Página mostrada cuando no se tienen permisos
- `/login` - Redirección automática para usuarios no autenticados
- Rutas públicas definidas en `PUBLIC_ROUTES` no requieren autenticación
- Rutas autenticadas en `AUTHENTICATED_ROUTES` solo requieren login