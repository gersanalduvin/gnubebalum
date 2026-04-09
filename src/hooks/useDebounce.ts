import { useEffect, useRef, useState } from 'react'

/**
 * Hook personalizado para debounce
 * @param callback - Función a ejecutar después del delay
 * @param delay - Tiempo de espera en milisegundos
 * @param deps - Dependencias que triggean el debounce
 */
export function useDebounceCallback(callback: () => void, delay: number, deps: any[]) {
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Crear nuevo timeout
    timeoutRef.current = setTimeout(callback, delay)

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, deps)

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
}

/**
 * Hook para debounce de valores
 * @param value - Valor a debounce
 * @param delay - Tiempo de espera en milisegundos
 * @returns Valor debounced
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [value, delay])

  return debouncedValue
}