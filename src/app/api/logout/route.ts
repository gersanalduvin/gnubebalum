import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/libs/auth';

export async function POST(request: NextRequest) {
  try {
    // Obtener la sesión de NextAuth para extraer el Bearer token
    const session = await getServerSession(authOptions)

    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      )
    }

    // Preparar headers para la petición de logout con Bearer
    const logoutHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.user.accessToken}`,
    }

    // Prepare API URL (remove existing prefixes to avoid double application)
    const rawApiUrl = process.env.API_URL || 'http://localhost:8081'
    let apiBase = rawApiUrl.replace(/\/+$/, '')
    if (apiBase.endsWith('/api')) apiBase = apiBase.slice(0, -4)
    if (apiBase.endsWith('/bk')) apiBase = apiBase.slice(0, -3)

    // Hacer logout en backend con Bearer token
    const backendResponse = await fetch(`${apiBase}/bk/logout`, {
      method: 'POST',
      credentials: 'omit',
      headers: logoutHeaders
    })

    const data = await backendResponse.json().catch(() => ({ success: false }))

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Error al cerrar sesión',
          error: data
        },
        { status: backendResponse.status }
      )
    }

    // Devolver respuesta del backend directamente
    return NextResponse.json(data, { status: backendResponse.status })

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Error al cerrar sesión',
        error: error.message
      },
      { status: 500 }
    )
  }
}
