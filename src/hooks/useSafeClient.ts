'use client'

import { useEffect, useState } from 'react'

/**
 * Hook personalizado para manejar de forma segura objetos del navegador
 * y evitar warnings de hidratación entre servidor y cliente
 */
export const useSafeClient = () => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

/**
 * Hook para acceso seguro a localStorage
 */
export const useSafeLocalStorage = <T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] => {
  const isClient = useSafeClient()
  const [value, setValue] = useState<T>(defaultValue)

  useEffect(() => {
    if (isClient) {
      try {

        const item = localStorage.getItem(key)

        if (item) {
          setValue(JSON.parse(item))
        }
      } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error)
      }
    }
  }, [key, isClient])

  const setStoredValue = (newValue: T) => {
    try {

      setValue(newValue)

      if (isClient) {
        localStorage.setItem(key, JSON.stringify(newValue))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [value, setStoredValue]
}

/**
 * Hook para media queries seguras
 */
export const useSafeMediaQuery = (query: string): boolean => {
  const isClient = useSafeClient()
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (!isClient) return

    const mediaQuery = window.matchMedia(query)

    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handler)

    return () => mediaQuery.removeEventListener('change', handler)
  }, [query, isClient])

  return matches
}

/**
 * Hook para detectar preferencias del sistema de forma segura
 */
export const useSafeSystemPreference = (): 'light' | 'dark' | null => {
  const isClient = useSafeClient()
  const isDark = useSafeMediaQuery('(prefers-color-scheme: dark)')

  if (!isClient) return null

  return isDark ? 'dark' : 'light'
}

/**
 * Hook para ejecutar código solo en el cliente
 */
export const useClientOnly = (callback: () => void, deps: any[] = []) => {
  const isClient = useSafeClient()

  useEffect(() => {
    if (isClient) {
      callback()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, ...deps])
}

export default useSafeClient