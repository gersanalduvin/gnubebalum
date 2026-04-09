// Types for permission system

export interface Permission {
  id: number
  name: string
  description?: string
}

export interface Role {
  id: number
  name: string
  description?: string
  permissions: Permission[]
}

export interface User {
  id: string
  name: string
  email: string
  superadmin: boolean
  role_id?: number
  role?: Role
  permissions?: Permission[]
  token?: string
  accessToken?: string
  tipo_usuario?: string
}

export interface PermissionCheck {
  permission: string
  fallback?: boolean
}

export interface RoutePermission {
  path: string
  permissions: string[]
  requireAll?: boolean // Si true, requiere todos los permisos. Si false, requiere al menos uno
}

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: User
  }

  interface User {
    id: string
    name: string
    email: string
    superadmin: boolean
    role_id?: number
    role?: Role
    permissions?: Permission[]
    token?: string
    accessToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    name: string
    email: string
    superadmin: boolean
    role_id?: number
    role?: Role
    permissions?: Permission[]
    accessToken: string
  }
}
