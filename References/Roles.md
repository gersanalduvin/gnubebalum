# API de Roles - Documentación

## Descripción General
La API de Roles permite gestionar los roles del sistema, incluyendo la creación, consulta, actualización y eliminación de roles. Cada rol puede tener múltiples permisos asociados que determinan las acciones que pueden realizar los usuarios con ese rol.

## Estructura de Archivos

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       └── V1/
│   │           └── RoleController.php
│   ├── Requests/
│   │   └── Api/
│   │       └── V1/
│   │           └── RoleRequest.php
│   └── Middleware/
│       └── CheckPermission.php
├── Services/
│   ├── RoleService.php
│   └── PermissionService.php
├── Repositories/
│   └── RoleRepository.php
└── Models/
    └── Role.php

routes/
└── api/
    └── v1/
        └── roles.php
```

## Endpoints de la API

### Base URL
```
http://localhost:8000/api/v1/roles
```

### Autenticación
Todos los endpoints requieren autenticación mediante Bearer Token:
```
Authorization: Bearer {token}
```

### 1. Listar Roles (Paginado)

**GET** `/api/v1/roles`

**Permisos requeridos:** `roles.ver`

**Descripción:** Obtiene una lista paginada de todos los roles del sistema.

**Parámetros de consulta:**
- `page` (opcional): Número de página (por defecto: 1)
- `per_page` (opcional): Elementos por página (por defecto: 15)

**Respuesta exitosa (200):**
```json
{
    "success": true,
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "nombre": "Administrador",
                "descripcion": "Rol con acceso completo al sistema",
                "permisos": ["roles.ver", "roles.crear", "roles.editar", "roles.eliminar"],
                "activo": true,
                "created_by": 1,
                "updated_by": null,
                "created_at": "2024-01-15T10:30:00.000000Z",
                "updated_at": "2024-01-15T10:30:00.000000Z"
            }
        ],
        "first_page_url": "http://localhost:8000/api/v1/roles?page=1",
        "from": 1,
        "last_page": 1,
        "last_page_url": "http://localhost:8000/api/v1/roles?page=1",
        "links": [...],
        "next_page_url": null,
        "path": "http://localhost:8000/api/v1/roles",
        "per_page": 15,
        "prev_page_url": null,
        "to": 1,
        "total": 1
    },
    "message": "Roles obtenidos exitosamente"
}
```

### 2. Listar Todos los Roles

**GET** `/api/v1/roles/all`

**Permisos requeridos:** `roles.ver`

**Descripción:** Obtiene todos los roles del sistema sin paginación.

**Respuesta exitosa (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "nombre": "Administrador",
            "descripcion": "Rol con acceso completo al sistema",
            "permisos": ["roles.ver", "roles.crear", "roles.editar", "roles.eliminar"],
            "activo": true,
            "created_by": 1,
            "updated_by": null,
            "created_at": "2024-01-15T10:30:00.000000Z",
            "updated_at": "2024-01-15T10:30:00.000000Z"
        }
    ],
    "message": "Roles obtenidos exitosamente"
}
```

### 3. Obtener Rol Específico

**GET** `/api/v1/roles/{id}`

**Permisos requeridos:** `roles.ver`

**Descripción:** Obtiene los detalles de un rol específico.

**Parámetros de ruta:**
- `id` (requerido): ID del rol

**Respuesta exitosa (200):**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "nombre": "Administrador",
        "descripcion": "Rol con acceso completo al sistema",
        "permisos": ["roles.ver", "roles.crear", "roles.editar", "roles.eliminar"],
        "activo": true,
        "created_by": 1,
        "updated_by": null,
        "created_at": "2024-01-15T10:30:00.000000Z",
        "updated_at": "2024-01-15T10:30:00.000000Z",
        "cambios": []
    },
    "message": "Rol obtenido exitosamente"
}
```

### 4. Crear Nuevo Rol

**POST** `/api/v1/roles`

**Permisos requeridos:** `roles.crear`

**Descripción:** Crea un nuevo rol en el sistema.

**Cuerpo de la solicitud:**
```json
{
    "nombre": "Editor",
    "descripcion": "Rol para editores de contenido",
    "permisos": ["contenido.ver", "contenido.editar"],
    "activo": true
}
```

**Validaciones:**
- `nombre`: requerido, string, máximo 255 caracteres, único
- `descripcion`: opcional, string, máximo 500 caracteres
- `permisos`: requerido, array de strings válidos
- `activo`: opcional, boolean (por defecto: true)

**Respuesta exitosa (201):**
```json
{
    "success": true,
    "data": {
        "id": 2,
        "nombre": "Editor",
        "descripcion": "Rol para editores de contenido",
        "permisos": ["contenido.ver", "contenido.editar"],
        "activo": true,
        "created_by": 1,
        "updated_by": null,
        "created_at": "2024-01-15T11:00:00.000000Z",
        "updated_at": "2024-01-15T11:00:00.000000Z"
    },
    "message": "Rol creado exitosamente"
}
```

### 5. Actualizar Rol

**PUT** `/api/v1/roles/{id}`

**Permisos requeridos:** `roles.editar`

**Descripción:** Actualiza un rol existente.

**Parámetros de ruta:**
- `id` (requerido): ID del rol

**Cuerpo de la solicitud:**
```json
{
    "nombre": "Editor Avanzado",
    "descripcion": "Rol para editores con permisos avanzados",
    "permisos": ["contenido.ver", "contenido.editar", "contenido.publicar"],
    "activo": true
}
```

**Respuesta exitosa (200):**
```json
{
    "success": true,
    "data": {
        "id": 2,
        "nombre": "Editor Avanzado",
        "descripcion": "Rol para editores con permisos avanzados",
        "permisos": ["contenido.ver", "contenido.editar", "contenido.publicar"],
        "activo": true,
        "created_by": 1,
        "updated_by": 1,
        "created_at": "2024-01-15T11:00:00.000000Z",
        "updated_at": "2024-01-15T11:30:00.000000Z"
    },
    "message": "Rol actualizado exitosamente"
}
```

### 6. Eliminar Rol

**DELETE** `/api/v1/roles/{id}`

**Permisos requeridos:** `roles.eliminar`

**Descripción:** Elimina un rol del sistema (soft delete).

**Parámetros de ruta:**
- `id` (requerido): ID del rol

**Respuesta exitosa (200):**
```json
{
    "success": true,
    "data": null,
    "message": "Rol eliminado exitosamente"
}
```

## Respuestas de Error

### Error de Validación (422)
```json
{
    "success": false,
    "message": "Errores de validación",
    "errors": {
        "nombre": ["El campo nombre es obligatorio"],
        "permisos": ["El campo permisos debe ser un array"]
    }
}
```

### Error de Autorización (403)
```json
{
    "success": false,
    "message": "No tienes permisos para realizar esta acción"
}
```

### Rol No Encontrado (404)
```json
{
    "success": false,
    "message": "Rol no encontrado"
}
```

### Error de Autenticación (401)
```json
{
    "success": false,
    "message": "Token de autenticación inválido"
}
```

## Permisos Disponibles

Los siguientes permisos están disponibles para roles:

### Roles
- `roles.ver`: Ver roles
- `roles.crear`: Crear roles
- `roles.editar`: Editar roles
- `roles.eliminar`: Eliminar roles
- `roles.asignar`: Asignar roles a usuarios

### Usuarios
- `usuarios.ver`: Ver usuarios
- `usuarios.crear`: Crear usuarios
- `usuarios.editar`: Editar usuarios
- `usuarios.eliminar`: Eliminar usuarios

### Contenido
- `contenido.ver`: Ver contenido
- `contenido.crear`: Crear contenido
- `contenido.editar`: Editar contenido
- `contenido.eliminar`: Eliminar contenido
- `contenido.publicar`: Publicar contenido

## Ejemplos de Uso con cURL

### 1. Obtener todos los roles
```bash
curl -X GET "http://localhost:8000/api/v1/roles" \
  -H "Authorization: Bearer {tu_token}" \
  -H "Accept: application/json"
```

### 2. Crear un nuevo rol
```bash
curl -X POST "http://localhost:8000/api/v1/roles" \
  -H "Authorization: Bearer {tu_token}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "nombre": "Moderador",
    "descripcion": "Rol para moderadores del sistema",
    "permisos": ["contenido.ver", "contenido.editar"],
    "activo": true
  }'
```

### 3. Actualizar un rol
```bash
curl -X PUT "http://localhost:8000/api/v1/roles/2" \
  -H "Authorization: Bearer {tu_token}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "nombre": "Moderador Senior",
    "descripcion": "Rol para moderadores senior",
    "permisos": ["contenido.ver", "contenido.editar", "contenido.eliminar"]
  }'
```

### 4. Eliminar un rol
```bash
curl -X DELETE "http://localhost:8000/api/v1/roles/2" \
  -H "Authorization: Bearer {tu_token}" \
  -H "Accept: application/json"
```

## Middleware de Permisos

Todas las rutas de roles están protegidas por el middleware `CheckPermission` que:

1. Verifica que el usuario esté autenticado
2. Comprueba que el usuario tenga el permiso requerido para la acción
3. Valida que el rol del usuario contenga el permiso específico

## Historial de Cambios

Cada rol mantiene un historial de cambios en el campo `cambios` que registra:
- Valor anterior
- Nuevo valor
- Usuario que realizó el cambio
- Fecha y hora del cambio

## Notas Importantes

1. **Soft Delete**: Los roles eliminados no se borran físicamente, se marcan como eliminados
2. **Auditoría**: Todos los cambios quedan registrados con el usuario que los realizó
3. **Permisos**: Los permisos se validan contra la lista definida en `PermissionService`
4. **Unicidad**: El nombre del rol debe ser único en el sistema
5. **Dependencias**: No se puede eliminar un rol que esté asignado a usuarios activos

## Códigos de Estado HTTP

- `200 OK`: Operación exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Solicitud malformada
- `401 Unauthorized`: No autenticado
- `403 Forbidden`: Sin permisos
- `404 Not Found`: Recurso no encontrado
- `422 Unprocessable Entity`: Errores de validación
- `500 Internal Server Error`: Error del servidor