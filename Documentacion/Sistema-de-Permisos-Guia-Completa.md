# Sistema de Permisos - Guía Completa de Implementación

## 📋 Índice

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Estructura de Archivos](#estructura-de-archivos)
5. [Configuración de Rutas Protegidas](#configuración-de-rutas-protegidas)
6. [Uso de Componentes](#uso-de-componentes)
7. [Hooks Disponibles](#hooks-disponibles)
8. [Middleware de Validación](#middleware-de-validación)
9. [Ejemplos Prácticos](#ejemplos-prácticos)
10. [Tipos de Usuario](#tipos-de-usuario)
11. [API y Backend](#api-y-backend)
12. [Troubleshooting](#troubleshooting)

---

## Introducción

Este sistema de permisos permite controlar el acceso a diferentes partes de la aplicación basándose en roles y permisos específicos de usuario. Soporta dos tipos principales de usuarios:

- **Superadmin**: Acceso completo a toda la aplicación
- **Usuarios con rol**: Acceso limitado según permisos asignados

### Características Principales

✅ **Middleware automático** - Valida permisos en cada ruta
✅ **Componentes reactivos** - Oculta elementos según permisos
✅ **Protección de páginas** - HOC para proteger rutas completas
✅ **Verificación servidor/cliente** - Doble validación de seguridad
✅ **TypeScript completo** - Tipado fuerte en toda la implementación
✅ **Integración Laravel Sanctum** - Compatible con tu API existente

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE LAYER                        │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   middleware.ts │────│  permissionMiddleware.ts        │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   COMPONENT LAYER                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ PermissionGuard │  │ withPermissions │  │usePermissions│ │
│  │   (Elements)    │  │    (Pages)      │  │   (Hooks)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                 CONFIGURATION LAYER                        │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │protectedRoutes.ts│    │        types/permissions.ts     │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Instalación y Configuración

### Requisitos Previos

- Next.js 13+ con App Router
- NextAuth.js configurado
- Laravel Sanctum API funcionando
- TypeScript habilitado

### Archivos Creados

El sistema incluye los siguientes archivos:

```
src/
├── types/permissions.ts              # Tipos TypeScript
├── utils/permissionMiddleware.ts     # Lógica de validación
├── hooks/usePermissions.ts           # Hook para componentes
├── components/PermissionGuard.tsx    # Componente para ocultar elementos
├── hocs/withPermissions.tsx          # HOC para proteger páginas
├── configs/protectedRoutes.ts        # Configuración de rutas
├── app/unauthorized/page.tsx         # Página de acceso denegado
├── middleware.ts                     # Middleware principal (modificado)
└── libs/auth.ts                      # Configuración auth (modificado)
```

---

## Estructura de Archivos

### 1. Tipos TypeScript (`types/permissions.ts`)

```typescript
export interface Permission {
  id: number
  name: string
  description?: string
}

export interface Role {
  id: number
  name: string
  permissions: Permission[]
}

export interface User {
  id: number
  name: string
  email: string
  superadmin: boolean
  role_id?: number
  role?: Role
  permissions?: Permission[]
}
```

### 2. Configuración de Rutas (`configs/protectedRoutes.ts`)

```typescript
export const PROTECTED_ROUTES: RoutePermission[] = [
  {
    path: '/admin',
    permissions: ['admin.acceso'],
    requireAll: false
  },
  {
    path: '/users',
    permissions: ['usuarios.ver', 'usuarios.gestionar'],
    requireAll: false
  }
]
```

---

## Configuración de Rutas Protegidas

### Tipos de Rutas

1. **Rutas Públicas** (`PUBLIC_ROUTES`)
   - No requieren autenticación
   - Ejemplos: `/`, `/login`, `/register`

2. **Rutas Autenticadas** (`AUTHENTICATED_ROUTES`)
   - Solo requieren estar logueado
   - Ejemplos: `/profile`, `/dashboard`

3. **Rutas Protegidas** (`PROTECTED_ROUTES`)
   - Requieren permisos específicos
   - Ejemplos: `/admin`, `/users/manage`

### Configuración de Permisos

```typescript
// Requiere UN permiso de la lista
{
  path: '/content',
  permissions: ['contenido.ver', 'contenido.editar'],
  requireAll: false  // Solo necesita uno
}

// Requiere TODOS los permisos
{
  path: '/reports/financial',
  permissions: ['reportes.ver', 'datos.financieros'],
  requireAll: true   // Necesita ambos
}
```

---

## Uso de Componentes

### PermissionGuard - Ocultar Elementos

```typescript
import { PermissionGuard } from '@/components/PermissionGuard'

function Dashboard() {
  return (
    <div>
      {/* Mostrar solo si tiene el permiso */}
      <PermissionGuard permission="usuarios.crear">
        <button>Crear Usuario</button>
      </PermissionGuard>

      {/* Múltiples permisos - necesita UNO */}
      <PermissionGuard 
        permissions={['posts.crear', 'contenido.crear']}
        requireAll={false}
      >
        <button>Crear Contenido</button>
      </PermissionGuard>

      {/* Múltiples permisos - necesita TODOS */}
      <PermissionGuard 
        permissions={['admin.acceso', 'sistema.configurar']}
        requireAll={true}
      >
        <button>Configuración Avanzada</button>
      </PermissionGuard>

      {/* Con contenido alternativo */}
      <PermissionGuard 
        permission="reportes.ver"
        fallback={<p>No tienes acceso a reportes</p>}
      >
        <ReportsComponent />
      </PermissionGuard>
    </div>
  )
}
```

### withPermissions - Proteger Páginas Completas

```typescript
import { withPermissions } from '@/hocs/withPermissions'

function AdminPage() {
  return (
    <div>
      <h1>Panel de Administración</h1>
      <p>Solo administradores pueden ver esto</p>
    </div>
  )
}

// Proteger la página
export default withPermissions(AdminPage, {
  permissions: ['admin.acceso'],
  requireAll: false,
  redirectTo: '/unauthorized',
  loadingComponent: <div>Verificando permisos...</div>
})
```

---

## Hooks Disponibles

### usePermissions

```typescript
import { usePermissions } from '@/hooks/usePermissions'

function MyComponent() {
  const { 
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    getUserPermissions,
    isLoading
  } = usePermissions()

  // Verificaciones individuales
  const canEdit = hasPermission('usuarios.editar')
  const canManage = hasAnyPermission(['posts.editar', 'contenido.editar'])
  const canAccess = hasAllPermissions(['admin.acceso', 'sistema.ver'])
  const canGoToAdmin = canAccessRoute('/admin')

  // Obtener todos los permisos
  const allPermissions = getUserPermissions()

  if (isLoading) return <div>Cargando...</div>

  return (
    <div>
      {canEdit && <button>Editar</button>}
      {canManage && <div>Panel de Gestión</div>}
    </div>
  )
}
```

---

## Middleware de Validación

### Funcionamiento Automático

El middleware se ejecuta en cada navegación y:

1. **Verifica autenticación** - Redirige a `/login` si no está logueado
2. **Valida permisos** - Comprueba si tiene acceso a la ruta
3. **Redirige según resultado**:
   - ✅ Permite acceso si tiene permisos
   - ❌ Redirige a `/unauthorized` si no tiene permisos
   - 🔄 Redirige a `/login` si no está autenticado

### Configuración del Middleware

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // ... lógica de i18n ...
  
  // Validar permisos antes de procesar i18n
  const permissionResponse = await validatePermissions(request)
  if (permissionResponse) {
    return permissionResponse
  }
  
  // ... resto del middleware ...
}
```

---

## Ejemplos Prácticos

### Ejemplo 1: Dashboard con Permisos

```typescript
'use client'

import { usePermissions } from '@/hooks/usePermissions'
import { PermissionGuard } from '@/components/PermissionGuard'

function Dashboard() {
  const { hasPermission, canAccessRoute } = usePermissions()

  return (
    <div className="p-6">
      <h1>Dashboard</h1>
      
      {/* Sección de usuarios */}
      <PermissionGuard permission="usuarios.ver">
        <div className="bg-white p-4 rounded shadow">
          <h2>Gestión de Usuarios</h2>
          
          <PermissionGuard permission="usuarios.crear">
            <button className="bg-blue-500 text-white px-4 py-2 rounded">
              Crear Usuario
            </button>
          </PermissionGuard>
          
          <PermissionGuard permission="usuarios.editar">
            <button className="bg-green-500 text-white px-4 py-2 rounded ml-2">
              Editar Usuarios
            </button>
          </PermissionGuard>
        </div>
      </PermissionGuard>

      {/* Navegación condicional */}
      <div className="mt-4">
        {canAccessRoute('/admin') && (
          <a href="/admin" className="text-blue-600 hover:underline">
            Panel de Administración
          </a>
        )}
      </div>
    </div>
  )
}

export default Dashboard
```

### Ejemplo 2: Página Protegida

```typescript
import { withPermissions } from '@/hocs/withPermissions'

function UsersManagement() {
  return (
    <div>
      <h1>Gestión de Usuarios</h1>
      <p>Solo usuarios con permisos pueden ver esto</p>
      
      {/* Contenido de la página */}
    </div>
  )
}

// Proteger con múltiples permisos
export default withPermissions(UsersManagement, {
  permissions: ['usuarios.ver', 'usuarios.gestionar'],
  requireAll: false, // Solo necesita uno de los permisos
  redirectTo: '/unauthorized'
})
```

### Ejemplo 3: API Route Protegida

```typescript
// app/api/users/route.ts
import { checkServerPermissions } from '@/utils/permissionMiddleware'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { hasAccess, user } = await checkServerPermissions(
    request,
    ['usuarios.ver'],
    false
  )

  if (!hasAccess) {
    return new Response('Forbidden', { status: 403 })
  }

  // Lógica de la API
  return Response.json({ users: [] })
}
```

---

## Tipos de Usuario

### Superadmin

```json
{
  "user": {
    "id": 1,
    "name": "Super Admin",
    "email": "admin@app.com",
    "superadmin": true,
    "role_id": null
  }
}
```

**Características:**
- ✅ Acceso a TODAS las rutas
- ✅ Ve TODOS los elementos
- ✅ Bypasea todas las verificaciones de permisos

### Usuario con Rol

```json
{
  "user": {
    "id": 2,
    "name": "Editor",
    "email": "editor@app.com",
    "superadmin": false,
    "role_id": 2,
    "role_name": "Editor"
  },
  "permisos": {
    "tipo": "rol",
    "rol": "Editor",
    "permisos": [
      "contenido.ver",
      "contenido.crear",
      "contenido.editar"
    ]
  }
}
```

**Características:**
- ✅ Acceso solo a rutas con permisos asignados
- ✅ Ve solo elementos permitidos
- ❌ Redirigido si no tiene permisos

---

## API y Backend

### Estructura de Respuesta Esperada

Tu API Laravel debe retornar:

```json
{
  "success": true,
  "message": "Login exitoso",
  "user": {
    "id": 1,
    "name": "Usuario",
    "email": "user@test.com",
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
      "usuarios.editar",
      "reportes.ver"
    ],
    "descripcion": "Permisos asignados por rol: Administrador"
  },
  "token": "sanctum_token_here"
}
```

### Configuración en Laravel

```php
// En tu AuthController
public function login(Request $request)
{
    // ... validación y autenticación ...
    
    $user = auth()->user();
    $permissions = $user->getAllPermissions()->pluck('name')->toArray();
    
    return response()->json([
        'success' => true,
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'superadmin' => $user->superadmin,
            'role_id' => $user->role_id,
            'role_name' => $user->role?->name
        ],
        'permisos' => [
            'tipo' => 'rol',
            'rol' => $user->role?->name,
            'permisos' => $permissions
        ],
        'token' => $user->createToken('auth_token')->plainTextToken
    ]);
}
```

---

## Troubleshooting

### Problemas Comunes

#### 1. "Usuario siempre redirigido a /unauthorized"

**Causa:** Los nombres de permisos no coinciden

**Solución:**
```typescript
// Verificar que los permisos en protectedRoutes.ts
// coincidan exactamente con los del backend
{
  path: '/users',
  permissions: ['usuarios.ver'], // Debe coincidir con Laravel
  requireAll: false
}
```

#### 2. "Middleware no funciona"

**Causa:** Configuración incorrecta del matcher

**Solución:**
```typescript
// En middleware.ts, verificar el config
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

#### 3. "Componentes no se ocultan"

**Causa:** Hook no encuentra la sesión

**Solución:**
```typescript
// Verificar que el componente esté dentro del SessionProvider
<SessionProvider session={session}>
  <YourComponent />
</SessionProvider>
```

#### 4. "Error de tipos TypeScript"

**Causa:** Tipos no extendidos correctamente

**Solución:**
```typescript
// En types/permissions.ts, verificar que extienda NextAuth
declare module 'next-auth' {
  interface Session {
    user: User
  }
  
  interface User {
    superadmin: boolean
    role_id?: number
    permissions?: Permission[]
  }
}
```

### Debug y Logs

```typescript
// Para debuggear permisos
const { getUserPermissions } = usePermissions()
console.log('Permisos del usuario:', getUserPermissions())

// En desarrollo, mostrar información de debug
{process.env.NODE_ENV === 'development' && (
  <pre>{JSON.stringify(getUserPermissions(), null, 2)}</pre>
)}
```

---

## Mejores Prácticas

### 1. Nomenclatura de Permisos

```typescript
// ✅ Buena práctica - Descriptivo y consistente
'usuarios.ver'
'usuarios.crear'
'usuarios.editar'
'usuarios.eliminar'
'reportes.financieros'
'admin.sistema'

// ❌ Evitar - Ambiguo
'read'
'write'
'access'
```

### 2. Agrupación Lógica

```typescript
// Agrupar permisos por módulo
const USER_PERMISSIONS = [
  'usuarios.ver',
  'usuarios.crear',
  'usuarios.editar',
  'usuarios.eliminar'
]

const REPORT_PERMISSIONS = [
  'reportes.ver',
  'reportes.crear',
  'reportes.exportar'
]
```

### 3. Verificación Doble

```typescript
// Siempre verificar en frontend Y backend

// Frontend
<PermissionGuard permission="usuarios.eliminar">
  <button onClick={deleteUser}>Eliminar</button>
</PermissionGuard>

// Backend API
export async function DELETE(request: NextRequest) {
  const { hasAccess } = await checkServerPermissions(
    request, ['usuarios.eliminar']
  )
  
  if (!hasAccess) {
    return new Response('Forbidden', { status: 403 })
  }
  
  // Lógica de eliminación
}
```

### 4. Manejo de Errores

```typescript
// Siempre proporcionar feedback al usuario
<PermissionGuard 
  permission="reportes.ver"
  fallback={
    <div className="text-gray-500 p-4">
      <p>No tienes permisos para ver reportes.</p>
      <p>Contacta al administrador si necesitas acceso.</p>
    </div>
  }
>
  <ReportsComponent />
</PermissionGuard>
```

---

## Conclusión

Este sistema de permisos proporciona una solución completa y robusta para controlar el acceso en tu aplicación Next.js. Con la integración automática del middleware, componentes reactivos y verificación tanto en cliente como servidor, garantiza que los usuarios solo vean y accedan a las funcionalidades permitidas.

### Próximos Pasos

1. ✅ Configurar las rutas protegidas según tus necesidades
2. ✅ Implementar los componentes `PermissionGuard` en tu UI
3. ✅ Proteger las páginas sensibles con `withPermissions`
4. ✅ Verificar que tu API Laravel retorne la estructura correcta
5. ✅ Probar con diferentes tipos de usuarios

### Soporte

Para dudas o problemas:
1. Revisar la sección de [Troubleshooting](#troubleshooting)
2. Verificar los logs del navegador y servidor
3. Comprobar que los permisos coincidan entre frontend y backend

---

**¡El sistema está listo para usar! 🚀**