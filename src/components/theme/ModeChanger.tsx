// React Imports
import { useEffect } from 'react'

// MUI Imports
import { useColorScheme } from '@mui/material/styles'

// Type Imports
import type { SystemMode } from '@core/types'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

const ModeChanger = ({ systemMode }: { systemMode: SystemMode }) => {
  // Hooks
  const { setMode } = useColorScheme()
  const { settings } = useSettings()

  useEffect(() => {
    if (settings?.mode === 'system') {
      setMode(systemMode)
    } else {
      setMode(settings?.mode || 'light')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.mode, systemMode])

  return null
}

export default ModeChanger
