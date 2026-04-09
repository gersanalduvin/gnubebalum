'use client'

import { useRef, useCallback } from 'react'

/**
 * Hook personalizado para garantizar que una función se ejecute solo una vez
 * durante el ciclo de vida del componente, evitando peticiones duplicadas
 */
export const useInitialLoad = () => {
  const hasLoadedRef = useRef(false)
  const isLoadingRef = useRef(false)

  const executeOnce = useCallback(async (loadFunction: () => Promise<void>) => {
    // Si ya se cargó o está cargando, no hacer nada
    if (hasLoadedRef.current || isLoadingRef.current) {
      return
    }

    // Marcar como cargando
    isLoadingRef.current = true

    try {
      await loadFunction()
      // Marcar como cargado exitosamente
      hasLoadedRef.current = true
    } catch (error) {
      // En caso de error, permitir reintentos
      console.error('Error en carga inicial:', error)
      throw error
    } finally {
      // Limpiar el flag de carga
      isLoadingRef.current = false
    }
  }, [])

  const reset = useCallback(() => {
    hasLoadedRef.current = false
    isLoadingRef.current = false
  }, [])

  return {
    executeOnce,
    reset,
    hasLoaded: hasLoadedRef.current,
    isLoading: isLoadingRef.current
  }
}