import type { NextRequest } from 'next/server';
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

    // Hacer la petición al backend de Laravel
    const backendUrl = `${process.env.API_URL}/bk/v1/permissions/grouped`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.user.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));


      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Error al obtener permisos',
          error: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();

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
