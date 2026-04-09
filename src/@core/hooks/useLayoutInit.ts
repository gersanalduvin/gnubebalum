'use client'

// Hook Imports
import { useCookie } from 'react-use'
import { useColorScheme } from '@mui/material'

import { useSafeMediaQuery, useClientOnly } from '@/hooks/useSafeClient'

// Core Imports
import { useSettings } from '@core/hooks/useSettings'

const useLayoutInit = () => {
  // Hooks
  const { settings } = useSettings()
  const { setMode } = useColorScheme()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, updateCookieColorPref] = useCookie('colorPref')
  const isDark = useSafeMediaQuery('(prefers-color-scheme: dark)')

  useClientOnly(() => {
    const appMode = isDark ? 'dark' : 'light'

    updateCookieColorPref(appMode)

    if (settings?.mode === 'system') {
      // We need to change the mode in settings context to apply the mode change to MUI components
      setMode(appMode)
    }
  }, [isDark, settings?.mode, setMode, updateCookieColorPref])

  // This hook does not return anything as it is only used to initialize color preference cookie and settings context on first load
}

export default useLayoutInit
