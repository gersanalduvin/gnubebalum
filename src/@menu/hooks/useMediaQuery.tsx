'use client'

// React Imports
import { useSafeMediaQuery, useSafeClient } from '@/hooks/useSafeClient'

const useMediaQuery = (breakpoint?: string): boolean => {
  const isClient = useSafeClient()
  const matches = useSafeMediaQuery(breakpoint ? `(max-width: ${breakpoint})` : '')

  // Handle special cases
  if (breakpoint === 'always') {
    return true
  }

  if (!breakpoint || !isClient) {
    return false
  }

  return matches
}

export default useMediaQuery
