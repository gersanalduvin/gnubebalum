'use client'

import { useEffect, useState } from 'react'

import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

interface ClientOnlyColorSchemeProps {
  systemMode: 'light' | 'dark' | 'system'
}

const ClientOnlyColorScheme = ({ systemMode }: ClientOnlyColorSchemeProps) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
}

export default ClientOnlyColorScheme