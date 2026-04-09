import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/libs/auth';

export async function GET(request: NextRequest) {
  try {
    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Construir URL del backend
    const backendUrl = queryString 
      ? `${process.env.API_URL}/bk/v1/roles?${queryString}`
      : `${process.env.API_URL}/bk/v1/roles`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.user.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || 'Error al obtener roles',
          error: data
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error interno del servidor',
        error: error.message 
      },
      { status: 500 }
    );
  }
}
