# Módulo Asistencias

## Permisos
- `asistencias.ver`: requerido para endpoints GET
- `asistencias.registrar`: requerido para POST/PUT/DELETE y exportaciones

## Endpoints

### GET `/api/v1/grupos/{grupo_id}/usuarios`
- Retorna usuarios de un grupo con relación a `users`
- Parámetros: `grupo_id`
- Respuesta:
  - `data[]`: `{ id, nombre, email }`

### GET `/api/v1/asistencias/grupo/{grupo_id}/fecha/{fecha}/corte/{corte}`
- Obtiene excepciones (ausencias/tardes) registradas para fecha y corte
- Parámetros: `grupo_id`, `fecha` (`YYYY-MM-DD`), `corte` (`corte_1|corte_2|corte_3|corte_4`)
- Respuesta:
  - `data[]`: `{ id, user_id, estado, justificacion, hora_registro }`

### POST `/api/v1/asistencias/registrar-grupo`
- Registra excepciones de asistencia para un grupo en bloque
- Body:
```
{
  "grupo_id": 123,
  "fecha": "YYYY-MM-DD",
  "corte": "corte_1",
  "excepciones": [
    { "user_id": 1, "estado": "ausencia_injustificada" },
    { "user_id": 2, "estado": "tarde_justificada", "justificacion": "Tráfico", "hora_registro": "08:15" }
  ]
}
```
- Validaciones:
  - `fecha` no futura
  - `corte` válido
  - `user_id` debe existir en `users_grupo` para el `grupo_id`
  - `justificacion` obligatoria para estados justificados
  - `hora_registro` obligatoria para llegadas tarde
  - Transacciones y unicidad (`user_id + fecha + corte`)
- Respuesta `201` con registros creados

### PUT `/api/v1/asistencias/{id}`
- Actualiza `estado`, `justificacion` o `hora_registro`
- No permite cambiar `corte`
- Body:
```
{ "estado": "tarde_injustificada", "hora_registro": "08:10" }
```

### DELETE `/api/v1/asistencias/{id}`
- Elimina la excepción registrada (se asume presente)

### GET `/api/v1/asistencias/reporte/{grupo_id}/corte/{corte}`
- Parámetros query: `fecha_inicio`, `fecha_fin`
- Respuesta:
```
{
  "usuarios": [
    {
      "user_id": 1,
      "nombre": "Nombre Apellido",
      "presentes": 18,
      "ausencias_justificadas": 1,
      "ausencias_injustificadas": 1,
      "tardes_justificadas": 0,
      "tardes_injustificadas": 2,
      "porcentaje_asistencia": 90.0
    }
  ],
  "totales": {
    "presentes": 360,
    "ausencias_justificadas": 10,
    "ausencias_injustificadas": 8,
    "tardes_justificadas": 5,
    "tardes_injustificadas": 12,
    "promedio_asistencia": 92.5
  }
}
```

### GET `/api/v1/asistencias/reporte-general/{grupo_id}`
- Parámetros query: `fecha_inicio`, `fecha_fin`
- Respuesta: estadísticas por corte y promedio general

### GET `/api/v1/asistencias/reporte/{grupo_id}/corte/{corte}/export?format=pdf|xlsx`
- Exporta reporte por corte a PDF o Excel
- Respuesta: archivo en `data.content` (Base64) y `data.filename`

### GET `/api/v1/asistencias/reporte-general/{grupo_id}/export?format=pdf|xlsx`
- Exporta reporte general a PDF o Excel

### GET `/api/v1/asistencias/periodos-lectivos`
- Lista periodos lectivos disponibles

### GET `/api/v1/asistencias/grupos-por-turno?periodo_id={id}`
- Retorna grupos del período agrupados por turno
- Respuesta:
```
{
  "Matutino": [ { "id": 1, "nombre": "1° A" } ],
  "Vespertino": [ { "id": 2, "nombre": "1° B" } ]
}
```

## Auditoría
- Modelo auditado: `asistencias` registrado en `AuditController::$models`
- Campos auditables por defecto a través del trait `Auditable`

