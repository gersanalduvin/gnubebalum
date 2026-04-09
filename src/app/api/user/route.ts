import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/libs/auth';

export async function GET(request: NextRequest) {
  try {
    // Obtener la sesión de NextAuth para extraer el Bearer token
    const session = await getServerSession(authOptions)

    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      )
    }

    // Preparar headers para petición al backend con Bearer
    const userHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.user.accessToken}`,
    }

    // Prepare API URL (remove existing prefixes to avoid double application)
    const rawApiUrl = process.env.API_URL || 'http://localhost:8081'
    let apiBase = rawApiUrl.replace(/\/+$/, '')
    if (apiBase.endsWith('/api')) apiBase = apiBase.slice(0, -4)
    if (apiBase.endsWith('/bk')) apiBase = apiBase.slice(0, -3)

    // Obtener usuario desde backend (flujo Bearer sin cookies)
    const userResponse = await fetch(`${apiBase}/bk/user`, {
      method: 'GET',
      credentials: 'omit',
      headers: userHeaders
    })
    
    const data = await userResponse.json()

    if (!userResponse.ok) {
      // If unauthorized, return 401 status
      if (userResponse.status === 401) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'No autenticado',
            error: 'Unauthorized' 
          },
          { status: 401 }
        )
      }
      
      throw new Error(JSON.stringify(data))
    }

    // Responder con los datos del backend directamente
    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error('Get user error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error al obtener usuario',
        error: error.message 
      },
      { status: 500 }
    )
  }
}
