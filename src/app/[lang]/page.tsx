'use client'

import { use, useEffect } from 'react'

import { useRouter } from 'next/navigation'


interface PageProps {
  params: Promise<{
    lang: string
  }>
}

const LangPage = ({ params }: PageProps) => {
  const router = useRouter()
  const { lang } = use(params)

  useEffect(() => {
    // Función para manejar la redirección
    const handleRedirect = () => {
      // Verificar localStorage directamente
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null
      const user = typeof window !== 'undefined' ? window.localStorage.getItem('user') : null

      if (token && user) {
        // Usuario autenticado (por localStorage), redirigir al home
        router.replace('/home')
      } else {
        // Usuario no autenticado, redirigir al login
        router.replace('/login')
      }
    }

    // Solo ejecutar si el idioma es válido
    if (lang && ['en', 'es', 'fr', 'de'].includes(lang)) {
        handleRedirect()
    }
  }, [router, lang])

  // Si no es un idioma válido, no hacer nada
  if (!lang || !['en', 'es', 'fr', 'de'].includes(lang)) {
    return null
  }

  // Mostrar loading mientras se determina la redirección
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Cargando...</p>
      </div>
    </div>
  )
}

export default LangPage
