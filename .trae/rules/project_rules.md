# Reglas del Proyecto - Next.js 15 + Materialize Admin Template

## Objetivo

Establecer reglas claras de arquitectura, diseño y permisos para el proyecto basado en Next.js 15 y Materialize Next.js Admin Template.
El objetivo es normalizar el diseño reutilizando los componentes que ya incluye la plantilla para garantizar consistencia, escalabilidad y mantenibilidad.

---

## 1. Arquitectura del Proyecto

### 1.1 Estructura de Directorios

```
/project-root
│── app/                    # Rutas con App Router (Next.js)
│   ├── (dashboard)/        # Layout principal del admin
│   ├── api/               # API Routes (si aplica)
│   └── auth/              # Login, registro, recovery
│
│── components/            # Reutilizables a nivel global
│   ├── layout/           # Navbar, Sidebar, Footer (de la plantilla)
│   ├── widgets/          # Cards, estadísticas, tablas (de la plantilla)
│   ├── forms/            # Inputs, selects, modales
│   └── charts/           # Gráficas (ApexCharts / Recharts)
│
│── features/             # Módulos de negocio
│   ├── users/
│   │   ├── pages/        # Páginas específicas del módulo
│   │   ├── components/   # Componentes propios (solo si no existen en plantilla)
│   │   ├── services/     # Conexión API
│   │   └── types/        # Tipos de TS
│   ├── roles/
│   └── reports/
│
│── lib/                  # Configuración global
│   ├── axios.ts          # Configuración de peticiones
│   ├── auth.ts           # Manejo de tokens y roles
│   └── permissions.ts    # Permisos centralizados
│
│── hooks/                # Custom hooks (useAuth, useFetch, etc.)
│── styles/               # Estilos globales y overrides de Materialize
│── types/                # Tipos compartidos
│── middleware.ts         # Autenticación y protección de rutas
│── next.config.js        # Configuración de Next.js
```

### 1.2 Configuración de Puertos

- **Backend**: `localhost:8081`
- **Frontend**: `localhost:3001`

---

## 2. Diseño y Componentes UI

### 2.1 Principios de Reutilización

- **SIEMPRE** reutilizar componentes de la plantilla antes de crear nuevos
- Cards, tablas y widgets → usar los ya provistos en `components/widgets/`
- Formularios → usar inputs, selects, modales y validaciones que ya vienen en `components/forms/`
- Layouts → toda página debe estar envuelta en `components/layout/Layout.tsx` (sidebar + navbar)
- Charts y gráficas → usar `components/charts/` (no instalar librerías externas sin revisión)

### 2.2 Estándares de Diseño

- Todos los componentes deben ser la **versión más compacta**
- El diseño de los inputs debe ser lo más compacto posible para formularios
- Si un diseño no existe en la plantilla, crear el componente en `/features/[modulo]/components/`, pero siguiendo el mismo estilo visual de Materialize
- Todos los elementos deben usar estilos de Materialize
- Solo usar `styles/overrides.scss` para ajustes mínimos

---

## 3. Manejo de Datos y API

### 3.1 Conexión con Backend

- Todas las peticiones se tienen que hacer a las APIs proporcionadas por el backend
- **NO** utilizar datos ficticios para autenticarse o realizar peticiones
- **NO** utilizar datos de pruebas para mostrar en la interfaz, utilizar los datos que devuelve el backend
- Toda la documentación de la API de cada CRUD o módulo está dentro de la carpeta `ApiDocumentacion/{NombreModulo}.md`

### 3.2 Autenticación

- Para realizar autenticación, utilizar el endpoint `/api/login` con los datos:
  - Email: `gersanalduvin@gmail.com`
  - Contraseña: `12345678`

### 3.3 Estructura de Respuesta del Backend

```typescript
// Respuesta exitosa
{
  success: true,
  data: T,
  message: string
}

// Respuesta con errores
{
  success: false,
  data: {},
  message: string,
  errors: {
    campo1: string[],
    campo2: string[],
    configuracion: string[] // Error específico para duplicados
  }
}
```

---

## 4. Manejo de Errores y Validaciones

### 4.1 Estructura de Errores del httpClient

- El `httpClient` lanza errores con la estructura: `{ status, statusText, data }`
- La respuesta del backend está en `error.data`, **NO** en `error.response.data`
- En los servicios, acceder a errores como: `const errorData = error.data || {}`

### 4.2 Tipos de Validación

- Usar siempre el tipo `ValidationErrors` definido en `types/index.ts`
- `ValidationErrors` espera `string[]` para cada campo, no `string`
- Al procesar errores de validación, asignar el array completo: `newFieldErrors[field] = errorMessages`

### 4.3 Estados de Formularios

- Verificar que los setters de estado estén correctamente definidos
- Usar `setErrors` para errores de validación, no `setFieldErrors`
- Mantener consistencia entre la definición del estado y su uso

### 4.4 Función processBackendErrors

- Priorizar errores específicos (ej: `configuracion`) antes que errores generales
- Mostrar errores específicos en toast con `toast.error()`
- Procesar errores de validación de campos y asignarlos al estado correspondiente
- Siempre incluir un fallback para errores no específicos

### 4.5 Manejo de Errores en UI

- Cuando el backend devuelva error de validación, mostrar los errores en el formulario
- Si es de validación, mostrarlo en el textbox correspondiente
- De lo contrario, mostrarlo en un toast
- Capturar siempre los errores de validación y mostrarlos en su respectivo input

### 4.6 Reglas de Validación Visual (Campos requeridos y resaltado en rojo)

- Asterisco de requeridos: usar `TextField`/`Select` con la prop `required` para marcar `*` automáticamente en la etiqueta.
- Resaltado rojo: enlazar el estado `errors: ValidationErrors` del formulario y aplicar:
  - `error={Boolean(errors.campo && errors.campo.length > 0)}`
  - `helperText={errors.campo?.[0] || ''}`
- Pre-validación antes de enviar: construir `const fieldErrors: ValidationErrors = {}` y asignar mensajes como arrays por cada campo vacío/incorrecto; si existen errores, `setErrors(fieldErrors)` y cancelar el submit.
- Limpieza por campo: al cambiar el valor de un input, si tiene error, limpiar con `setErrors(prev => ({ ...prev, campo: [] }))`.
- Mantener `ValidationErrors` siempre como `string[]` por campo; no usar `string` plano.
- Feedback: añadir `toast.error('Complete todos los campos requeridos')` sólo como mensaje general, dejando los mensajes específicos dentro de cada `helperText`.

---

## 5. Feedback al Usuario

### 5.1 Notificaciones Toast

- Cuando se guarde un registro, mostrar un toast de éxito
- Cuando se actualice un registro, mostrar un toast de éxito
- Cuando se elimine un registro, mostrar un toast de éxito

### 5.2 Estados de Carga

- Cuando se haga una petición al backend, mostrar un loading

---

## 6. Permisos y Seguridad

### 6.1 Sistema de Permisos

- El endpoint de login devuelve `role` y `permissions[]`
- Revisar el archivo `Documentacion/Sistema-de-Permisos-Guia-Completa.md`
- Middleware `middleware.ts` protege rutas según el rol
- UI dinámica: Botones, menús y acciones se renderizan solo si el permiso está incluido

### 6.2 Rutas Protegidas

- Definidas en `middleware.ts`
- No deben existir accesos directos a rutas sensibles sin control de permisos

---

## 7. Convenciones de Desarrollo

### 7.1 Nomenclatura

- **Componentes**: `PascalCase.tsx`
- **Hooks**: `useXxx.ts`
- **Servicios**: `service.ts`

### 7.2 API Calls

- Siempre a través de `service.ts` en cada feature, nunca directo desde un componente

### 7.3 Calidad de Código

- **Linting + Prettier**: Obligatorio en cada PR. Configurado en `.eslintrc` y `.prettierrc`
- Cuando se resuelva cualquier problema y se utilizaron logs, **eliminarlos**

### 7.4 Verificación de Build

- Ejecutar `npm run build` antes de considerar completada cualquier funcionalidad
- Corregir todos los errores de TypeScript antes de finalizar
- Eliminar logs de debug después de resolver problemas
- Mantener el código limpio y listo para producción

---

## 8. Manejo de Generación de PDFs

### 8.1 Estándares de Implementación

- **Visualización por defecto**: Los PDFs deben abrirse en nueva pestaña del navegador usando `window.open(url, '_blank')` para permitir visualización inmediata
- **Descarga opcional**: El usuario decide si descargar desde el visor del navegador
- **Nombres de archivo**: Usar nombres descriptivos y fijos (ej: "Ficha de Inscripción.pdf") en lugar de nombres dinámicos que puedan causar errores
- **Estados de carga**: Siempre implementar loading state en botones de generación de PDF con `CircularProgress` y deshabilitar el botón durante el proceso

### 8.2 Manejo de Errores

- **Sin logs en producción**: Nunca usar `console.log`, `console.error` o similares en el manejo de PDFs
- **Manejo de errores específicos**: Capturar errores de autenticación (401) y redirigir al login
- **Feedback al usuario**: Usar toast notifications para errores, no logs de consola
- **Limpieza de memoria**: Usar `setTimeout` con `window.URL.revokeObjectURL(url)` para liberar memoria después de abrir el PDF

### 8.3 Estructura del Código

```typescript
// Ejemplo de implementación correcta
const handlePrintPDF = async () => {
  setPrintLoading(true)
  try {
    const response = await service.generatePDF(id)
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)

    // Abrir en nueva pestaña para visualización
    window.open(url, '_blank')

    // Limpiar memoria después de 1 segundo
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 1000)
  } catch (error: any) {
    // Manejo de errores sin logs
    if (error.status === 401) {
      toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
      window.location.href = '/auth/login'
      return
    }

    toast.error('Error al generar el PDF. Intente nuevamente.')
  } finally {
    setPrintLoading(false)
  }
}
```

### 8.4 Componentes UI

- **Botón con loading**: Mostrar `CircularProgress` durante la generación
- **Deshabilitación**: El botón debe estar deshabilitado mientras se procesa
- **Iconografía**: Usar iconos apropiados (PrintIcon, PictureAsPdfIcon, etc.)
- **Responsive**: Asegurar que funcione correctamente en dispositivos móviles

---

## 9. Exportación a Excel (XLSX)

### 9.1 Estándar de Implementación

- Petición directa al backend con `fetch` usando Bearer token desde `localStorage`.
- Header `Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'`.
- Tratar la respuesta como `Blob` y descargar con `createObjectURL` + `<a download>`.
- Nombre de archivo fijo y descriptivo; ejemplo: `Escalas.xlsx`, `lista_alumnos_grupo.xlsx`.
- Revocar el `ObjectURL` con `setTimeout(() => URL.revokeObjectURL(url), 1000)`.
- Estado de loading en el botón (`CircularProgress`) y deshabilitar mientras procesa.

### 9.2 Manejo de Errores

- Si `resp.status === 401`: mostrar toast y redirigir a `/auth/login`.
- Si `!resp.ok`: intentar parsear JSON de error y mostrar `toast.error(message)`.
- No usar logs en producción.

### 9.3 Ejemplo de Código (Service + UI)

```typescript
// service.ts
export const exportExcel = async (query: URLSearchParams): Promise<Blob> => {
  const url = `/api/v1/modulo/excel?${query.toString()}`
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const resp = await fetch(`${process.env.NEXT_PUBLIC_LARAVEL_APP_URL}${url}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  })
  if (!resp.ok) {
    const text = await resp.text()
    let data: any = {}
    try {
      data = JSON.parse(text)
    } catch {}
    throw { status: resp.status, statusText: resp.statusText, data }
  }
  return await resp.blob()
}

// componente.tsx
const handleExportExcel = async () => {
  setExcelLoading(true)
  try {
    const blob = await service.exportExcel(new URLSearchParams({ search }))
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Escalas.xlsx'
    a.click()
    setTimeout(() => window.URL.revokeObjectURL(url), 1000)
  } catch (error: any) {
    if (error?.status === 401) {
      toast.error('Sesión expirada. Por favor, inicie sesión nuevamente.')
      window.location.href = '/auth/login'
      return
    }
    const message = error?.data?.message || 'Error al exportar Excel'
    toast.error(message)
  } finally {
    setExcelLoading(false)
  }
}
```

### 9.4 Observaciones

- No usar `application/octet-stream` salvo que el backend no soporte el MIME de Excel.
- Evitar envolver la respuesta Excel en objetos `{ success, data }`; retornar Blob directo para evitar corrupción.

---

## 10. Auditoría de Cambios

### 10.1 Inclusión obligatoria del botón de Auditoría

- En cada módulo con CRUD, incluir SIEMPRE el botón de auditoría tanto en:
  - La tabla/listado (columna de acciones por registro)
  - El modal de edición (cabecera o actions del formulario)
- Permiso: envolver el botón con `PermissionGuard permission="auditoria.ver"`.
- Componente: usar `AuditoriaModal` y abrirlo con `{ model, id }` del recurso.
- Servicio: `auditoriaService.getSummary(model, id)` consulta `GET /api/v1/audits/{model}/{id}/summary`.
- Modelos estándar por módulo:
  - Asignaturas: `not_materias`
  - Áreas de asignaturas: `not_materias_areas`
- Iconografía: preferir `ManageHistoryIcon` en modales y `HistoryIcon` en tablas, color `info` y con `Tooltip`.
- UX: el botón de auditoría no debe bloquear acciones CRUD; abrir en `Dialog` y cerrar con acción explícita.
