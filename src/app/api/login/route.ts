// Next Imports
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    // Parse request body safely to avoid JSON parse errors from various clients
    const rawBody = await req.text()
    let parsedBody: any

    try {
      parsedBody = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Cuerpo de solicitud inválido. Debe ser JSON.',
          error: 'Invalid JSON body',
        },
        { status: 400 }
      )
    }

    const { email, password } = parsedBody || {}
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email y password son requeridos',
          error: 'Missing credentials',
        },
        { status: 400 }
      )
    }
    // Prepare headers for token-based login (Bearer)
    const loginHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    // Construir base de API robusta: soporta API_URL con o sin "/bk"
    const rawApiUrl = process.env.API_URL || 'http://localhost:8081'
    const trimmedApiUrl = rawApiUrl.replace(/\/+$/, '')
    
    // Logic to handle both /api (legacy) and /bk (new) prefixes if present in env variables
    let apiBase = trimmedApiUrl
    if (apiBase.endsWith('/api')) apiBase = apiBase
    else if (apiBase.endsWith('/bk')) apiBase = apiBase
    else apiBase = `${trimmedApiUrl}/bk`

    // Token-based login (no cookies, no CSRF)
    const loginResponse = await fetch(`${apiBase}/login`, {
      method: 'POST',
      credentials: 'omit',
      headers: loginHeaders,
      body: JSON.stringify({ email, password })
    })

    const raw = await loginResponse.text()
    let data: any
    try {
      data = JSON.parse(raw)
    } catch {
      // Backend returned non-JSON content
      return NextResponse.json(
        {
          success: false,
          message: 'Respuesta no válida del backend. Verifica que devuelva JSON.',
          error: raw?.slice(0, 200) || 'Invalid backend response'
        },
        { status: 502 }
      )
    }

    if (!loginResponse.ok) {
      const errorData = data

      // Handle specific Laravel errors
      if (loginResponse.status === 404) {
        return NextResponse.json(
          {
            success: false,
            message: 'Backend no configurado correctamente. La ruta de login no existe en Laravel.',
            error: 'Laravel login route not configured',
            instructions: {
              message: 'Para configurar Laravel Sanctum correctamente:',
              steps: [
                '1. Instalar Laravel Sanctum: composer require laravel/sanctum',
                '2. Publicar configuración: php artisan vendor:publish --provider="Laravel\\Sanctum\\SanctumServiceProvider"',
                '3. Ejecutar migraciones: php artisan migrate',
                '4. Configurar rutas de autenticación en routes/api.php',
                '5. Configurar middleware de Sanctum',
                '6. Configurar CORS correctamente'
              ]
            }
          },
          { status: 502 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          message: errorData?.message || 'Error de autenticación',
          errors: errorData?.errors || {},
          error: errorData?.error || 'Authentication failed'
        },
        { status: loginResponse.status }
      )
    }

    // Forward Laravel's response without cookies (Bearer token expected)
    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Login API error:', error)

    // Handle network errors specifically
    if (error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
      return NextResponse.json(
        {
          success: false,
          message: 'No se puede conectar con el servidor backend. Verifica que Laravel esté ejecutándose en la URL configurada en API_URL (por ejemplo, http://localhost:8081) y que el endpoint exista en /bk/login',
          error: 'Backend connection failed',
          details: {
            message: 'El servidor Laravel no está disponible o API_URL está mal configurada',
            solution: 'Ejecuta "php artisan serve --port=8081" en tu proyecto Laravel para iniciar el servidor y asegúrate de que API_URL no incluya /bk (el código añade /bk automáticamente)'
          }
        },
        { status: 503 }
      )
    }

    // Parse error message if it's a JSON string
    let errorData

    try {
      errorData = JSON.parse(error.message)
    } catch {
      errorData = {
        success: false,
        message: error.message || 'Error interno del servidor',
        errors: { general: ['Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.'] }
      }
    }

    return NextResponse.json(
      errorData,
      { status: errorData.status || 500 }
    )
  }
}
