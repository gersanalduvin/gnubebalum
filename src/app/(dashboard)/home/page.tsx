'use client'

import { useAuth } from '@/hooks/useAuth'

// Dashboard Components
import AdminDashboard from '@/app/(dashboard)/home/components/AdminDashboard'
import FamilyDashboard from '@/app/(dashboard)/home/components/FamilyDashboard'
import StudentDashboard from '@/app/(dashboard)/home/components/StudentDashboard'
import TeacherDashboard from '@/app/(dashboard)/home/components/TeacherDashboard'

export default function Page() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="p-6">Cargando...</div>
  }

  if (!user) {
    return <div className="p-6">Usuario no autenticado</div>
  }

  // Render dashboard based on user type
  // Handle both singular and plural forms
  switch (user.tipo_usuario) {
    case 'administrativo':
    case 'administrativos':
    case 'superuser':
      return <AdminDashboard />
    
    case 'docente':
    case 'docentes':
      return <TeacherDashboard />
    
    case 'familia':
      return <FamilyDashboard />
    
    case 'alumno':
    case 'alumnos':
      return <StudentDashboard />

    default:
      // Fallback for unknown roles
      return (
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">
            ¡Hola, {user.name}! 👋
          </h1>
          <p className="text-gray-600">
            Bienvenido a GNube - Plataforma académica
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Rol detectado: {user.tipo_usuario}
          </p>
        </div>
      )
  }
}
