# Laravel Sanctum Integration Setup

## Configuración Completada

### 1. Variables de Entorno
Se han configurado las siguientes variables en `.env`:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-key-here
NEXTAUTH_URL=http://localhost:3001

# Laravel Backend API Configuration
API_URL=http://localhost:8000/api
NEXT_PUBLIC_API_URL=http://localhost:8000/api
LARAVEL_APP_URL=http://localhost:8000
NEXT_PUBLIC_LARAVEL_APP_URL=http://localhost:8000

# Laravel Sanctum Configuration
SANCTUM_STATEFUL_DOMAINS=localhost:3001,127.0.0.1:3001
SESSION_DOMAIN=localhost
```

### 2. Archivos Modificados/Creados

#### Archivos Modificados:
- `src/libs/auth.ts` - Configuración de NextAuth para Laravel Sanctum
- `src/app/api/login/route.ts` - API route actualizada para Laravel backend
- `src/views/Login.tsx` - Componente de login con manejo de errores mejorado
- `.env` - Variables de entorno actualizadas

#### Archivos Creados:
- `src/utils/httpClient.ts` - Cliente HTTP con manejo de CSRF y cookies
- `src/middleware.ts` - Middleware de Next.js para CORS
- `src/hooks/useAuth.ts` - Hook personalizado para autenticación
- `src/components/auth/AuthGuard.tsx` - Componente para proteger rutas

### 3. Configuración de Laravel Backend Requerida

Para que la integración funcione correctamente, asegúrate de que tu backend Laravel tenga:

#### En `config/sanctum.php`:
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:3001,127.0.0.1,127.0.0.1:8000,::1')),
```

#### En `config/cors.php`:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],
'allowed_methods' => ['*'],
'allowed_origins' => ['http://localhost:3001'],
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true,
```

#### En `config/session.php`:
```php
'domain' => env('SESSION_DOMAIN', 'localhost'),
'same_site' => 'lax',
```

#### Rutas de API requeridas en Laravel:
```php
// routes/api.php
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/user', [AuthController::class, 'user'])->middleware('auth:sanctum');
```

### 4. Cómo Usar los Nuevos Componentes

#### Usar el hook useAuth:
```tsx
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, isAuthenticated, logout, makeAuthenticatedRequest } = useAuth()
  
  const handleApiCall = async () => {
    try {
      const data = await makeAuthenticatedRequest('/protected-endpoint')
      console.log(data)
    } catch (error) {
      console.error('API call failed:', error)
    }
  }
  
  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.name}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <p>Please login</p>
      )}
    </div>
  )
}
```

#### Proteger rutas con AuthGuard:
```tsx
import AuthGuard from '@/components/auth/AuthGuard'

function ProtectedPage() {
  return (
    <AuthGuard>
      <div>This content is only visible to authenticated users</div>
    </AuthGuard>
  )
}
```

#### Usar el cliente HTTP:
```tsx
import { httpClient, authApi } from '@/utils/httpClient'

// Para llamadas de autenticación
const loginUser = async (email: string, password: string) => {
  try {
    const response = await authApi.login(email, password)
    return response.data
  } catch (error) {
    console.error('Login failed:', error)
  }
}

// Para otras llamadas API
const fetchData = async () => {
  try {
    const response = await httpClient.get('/some-endpoint')
    return response.data
  } catch (error) {
    console.error('API call failed:', error)
  }
}
```

### 5. Pasos para Probar la Integración

1. **Iniciar el servidor Laravel:**
   ```bash
   php artisan serve
   ```

2. **Iniciar el servidor Next.js:**
   ```bash
   npm run dev
   ```

3. **Probar el login:**
   - Navegar a `http://localhost:3001/login`
   - Intentar hacer login con credenciales válidas
   - Verificar que se redirija correctamente después del login
   - Verificar que las cookies de sesión se establezcan correctamente

4. **Probar rutas protegidas:**
   - Intentar acceder a rutas protegidas sin autenticación
   - Verificar que se redirija al login
   - Después del login, verificar que se pueda acceder a las rutas protegidas

5. **Probar el logout:**
   - Hacer logout y verificar que se limpie la sesión
   - Verificar que se redirija al login después del logout

### 6. Troubleshooting

#### Problemas Comunes:

1. **Error de CORS:**
   - Verificar configuración de CORS en Laravel
   - Asegurar que `supports_credentials` esté en `true`

2. **CSRF Token Issues:**
   - Verificar que las cookies se estén enviando correctamente
   - Comprobar la configuración de dominio en Laravel

3. **Session Issues:**
   - Verificar configuración de sesión en Laravel
   - Asegurar que el dominio de sesión sea correcto

4. **Authentication Errors:**
   - Verificar que las rutas de API estén correctamente configuradas
   - Comprobar que Sanctum esté instalado y configurado en Laravel

### 7. Próximos Pasos

- Implementar refresh token automático
- Agregar manejo de roles y permisos
- Implementar remember me functionality
- Agregar tests unitarios para la autenticación