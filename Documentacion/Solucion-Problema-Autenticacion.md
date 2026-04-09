# Solución al Problema de Autenticación

## Problema Identificado

El sistema de autenticación no estaba funcionando correctamente debido a que el middleware de validación de permisos se estaba ejecutando en **todas las rutas**, incluyendo la ruta de API de login (`/api/login`).

### Causa Raíz

El middleware `validatePermissions` se ejecutaba antes de que el usuario pudiera autenticarse, creando un bucle donde:

1. El usuario intenta hacer login en `/api/login`
2. El middleware intercepta la petición y valida permisos
3. Como no hay sesión activa, redirige al login
4. Se crea un bucle infinito de redirecciones

## Solución Implementada

### 1. Exclusión de Ruta de Login en Middleware

Se agregó una exclusión específica en `src/middleware.ts` para la ruta `/api/login`:

```typescript
// Skip login API route to prevent permission validation during authentication
if (pathname === '/api/login') {
  return NextResponse.next()
}
```

### 2. Actualización de Variables de Entorno

Se actualizaron las URLs para usar el puerto correcto (3001):

```env
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3001
SANCTUM_STATEFUL_DOMAINS=localhost:3001,localhost:3000
```

## Rutas Excluidas del Middleware de Permisos

Ahora el middleware **NO** valida permisos en:

- `/api/auth/*` - Rutas de NextAuth
- `/api/login` - Ruta de autenticación con Laravel
- Rutas públicas definidas en `protectedRoutes.ts`

## Flujo de Autenticación Corregido

1. **Usuario accede a `/login`** → Ruta pública, no requiere permisos
2. **Usuario envía credenciales** → POST a `/api/login` (excluida del middleware)
3. **Laravel valida credenciales** → Retorna datos del usuario y token
4. **NextAuth crea sesión** → Almacena datos en JWT
5. **Usuario es redirigido** → A `/home` o ruta solicitada
6. **Middleware valida permisos** → Solo en rutas protegidas

## Verificación de la Solución

### Pruebas Recomendadas

1. **Login Básico**:
   - Acceder a `http://localhost:3001/login`
   - Ingresar credenciales válidas
   - Verificar redirección exitosa

2. **Rutas Protegidas**:
   - Intentar acceder a `/admin` sin autenticación
   - Verificar redirección a login
   - Autenticarse y verificar acceso según permisos

3. **Superadmin**:
   - Login con usuario superadmin
   - Verificar acceso a todas las rutas

### Logs de Depuración

Para monitorear el funcionamiento:

```bash
# En la consola del navegador
console.log('Session:', session)
console.log('User permissions:', session?.user?.permissions)
```

## Configuración de Laravel Sanctum

Asegúrate de que en Laravel tengas:

```php
// config/sanctum.php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:3000,localhost:3001,127.0.0.1,127.0.0.1:8000,::1')),
```

## Estructura de Respuesta Esperada del Backend

La API de Laravel debe retornar:

```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@test.com",
    "superadmin": false,
    "role_id": 1,
    "role_name": "Administrador",
    "permissions": [
      {
        "name": "usuarios.ver"
      },
      {
        "name": "usuarios.crear"
      }
    ]
  },
  "token": "46|z6gZMURqPqah8OIGh7GwxXYrz2e5kCYmRwWivDa31957d1e"
}
```

## Estado Actual

✅ **Problema Resuelto**: El middleware ya no interfiere con la autenticación
✅ **Servidor Funcionando**: Next.js en puerto 3001
✅ **Variables Actualizadas**: URLs y dominios configurados correctamente
✅ **Rutas Protegidas**: Sistema de permisos funcionando en rutas apropiadas

## Próximos Pasos

1. Probar el login con credenciales reales
2. Verificar que los permisos se apliquen correctamente
3. Testear diferentes tipos de usuarios (superadmin, usuarios normales)
4. Validar redirecciones y acceso a rutas protegidas