'use client'


// Type Imports
import type { Settings } from '@core/contexts/settingsContext'
import type { ChildrenType, Direction, Mode, SystemMode } from '@core/types'

// Component Imports
import { NotificationsProvider } from '@/contexts/NotificationsContext'
import ReduxProvider from '@/redux-store/ReduxProvider'
import ThemeProvider from '@components/theme'
import { SettingsProvider } from '@core/contexts/settingsContext'
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'

type Props = ChildrenType & {
  direction: Direction
  mode: Mode
  settingsCookie: Settings
  systemMode: SystemMode
}

const Providers = (props: Props) => {
  // Props
  const { children, direction, mode, settingsCookie, systemMode } = props

  const content = (
      <VerticalNavProvider>
        <SettingsProvider settingsCookie={settingsCookie} mode={mode}>
          <ThemeProvider direction={direction} systemMode={systemMode}>
            <ReduxProvider>
              <NotificationsProvider>{children}</NotificationsProvider>
            </ReduxProvider>
          </ThemeProvider>
        </SettingsProvider>
      </VerticalNavProvider>
  )

  return content
}

export default Providers
