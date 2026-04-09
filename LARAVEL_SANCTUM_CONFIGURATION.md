# Configuración de Laravel Sanctum - Guía Completa

Esta guía te ayudará a configurar Laravel Sanctum correctamente para que funcione con el frontend de Next.js.

## 📋 Requisitos Previos

- Laravel 8.0 o superior
- PHP 7.4 o superior
- Composer instalado
- Base de datos configurada

## 🚀 Instalación y Configuración

### 1. Instalar Laravel Sanctum

```bash
composer require laravel/sanctum
```

### 2. Publicar la configuración de Sanctum

```bash
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

### 3. Ejecutar las migraciones

```bash
php artisan migrate
```

### 4. Configurar el middleware de Sanctum

En `app/Http/Kernel.php`, agrega el middleware de Sanctum:

```php
'api' => [
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    'throttle:api',
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
],
```

### 5. Configurar CORS

En `config/cors.php`:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],

'allowed_methods' => ['*'],

'allowed_origins' => ['http://localhost:3001'], // Tu frontend URL

'allowed_origins_patterns' => [],

'allowed_headers' => ['*'],

'exposed_headers' => [],

'max_age' => 0,

'supports_credentials' => true,
```

### 6. Configurar variables de entorno

En tu archivo `.env` de Laravel:

```env
SESSION_DRIVER=cookie
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:3001
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
```

### 7. Configurar las rutas de autenticación

En `routes/api.php`:

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Rutas de autenticación
Route::post('/login', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $user = User::where('email', $request->email)->first();

    if (! $user || ! Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['Las credenciales proporcionadas no coinciden con nuestros registros.'],
        ]);
    }

    // Para SPA authentication, no necesitamos crear tokens
    // Sanctum manejará la autenticación via cookies de sesión
    Auth::login($user);

    return response()->json([
        'success' => true,
        'message' => 'Login exitoso',
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'superadmin' => $user->hasRole('superadmin'), // Ajusta según tu sistema de roles
            'role_id' => $user->role_id ?? 1,
            'role_name' => $user->role->name ?? 'Usuario'
        ],
        'permisos' => [
            'tipo' => $user->hasRole('superadmin') ? 'superadmin' : 'user',
            'rol' => $user->role->name ?? 'Usuario',
            'permisos' => $user->hasRole('superadmin') ? 'todos' : 'limitados',
            'descripcion' => $user->hasRole('superadmin') ? 'Acceso completo como superadministrador' : 'Acceso limitado de usuario'
        ]
    ]);
});

Route::post('/logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return response()->json([
        'success' => true,
        'message' => 'Logout exitoso'
    ]);
})->middleware('auth:sanctum');

Route::get('/user', function (Request $request) {
    $user = $request->user();
    
    return response()->json([
        'success' => true,
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'superadmin' => $user->hasRole('superadmin'),
            'role_id' => $user->role_id ?? 1,
            'role_name' => $user->role->name ?? 'Usuario'
        ],
        'permisos' => [
            'tipo' => $user->hasRole('superadmin') ? 'superadmin' : 'user',
            'rol' => $user->role->name ?? 'Usuario',
            'permisos' => $user->hasRole('superadmin') ? 'todos' : 'limitados',
            'descripcion' => $user->hasRole('superadmin') ? 'Acceso completo como superadministrador' : 'Acceso limitado de usuario'
        ]
    ]);
})->middleware('auth:sanctum');
```

### 8. Configurar el modelo User (opcional)

Si usas un sistema de roles, asegúrate de que tu modelo `User` tenga las relaciones necesarias:

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function hasRole($roleName)
    {
        return $this->role && $this->role->name === $roleName;
    }
}
```

## 🧪 Pruebas

### 1. Probar CSRF Cookie

```bash
curl -X GET http://localhost:8000/sanctum/csrf-cookie \
  -H "Accept: application/json" \
  -H "Referer: http://localhost:3001" \
  -c cookies.txt
```

### 2. Probar Login

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "Referer: http://localhost:3001" \
  -b cookies.txt \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"password"}'
```

### 3. Probar obtener usuario autenticado

```bash
curl -X GET http://localhost:8000/api/user \
  -H "Accept: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "Referer: http://localhost:3001" \
  -b cookies.txt
```

## 🔧 Solución de Problemas Comunes

### Error: "CSRF token mismatch"

1. Verifica que `SANCTUM_STATEFUL_DOMAINS` incluya tu dominio frontend
2. Asegúrate de que las cookies se estén enviando correctamente
3. Verifica la configuración de CORS

### Error: "Route not found"

1. Verifica que las rutas estén definidas en `routes/api.php`
2. Limpia la caché de rutas: `php artisan route:clear`
3. Verifica que el servidor Laravel esté ejecutándose

### Error: "Unauthenticated"

1. Verifica que el middleware `auth:sanctum` esté aplicado
2. Asegúrate de que las cookies de sesión se estén enviando
3. Verifica la configuración de sesiones en Laravel

## 📝 Notas Importantes

- **SPA Authentication**: Este setup usa autenticación basada en cookies de sesión, no tokens API
- **CORS**: Es crucial configurar CORS correctamente para que las cookies funcionen
- **HTTPS**: En producción, asegúrate de usar HTTPS y configurar las cookies como seguras
- **Dominios**: Los dominios en `SANCTUM_STATEFUL_DOMAINS` deben coincidir exactamente con tu frontend

## 🚀 Comandos Útiles

```bash
# Limpiar caché
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# Ver rutas
php artisan route:list

# Ejecutar servidor de desarrollo
php artisan serve
```

---

**¡Importante!** Una vez que hayas configurado Laravel Sanctum correctamente, el frontend de Next.js se conectará automáticamente y la autenticación funcionará sin problemas.