// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'

// Util Imports
import { getMode, getSystemMode, getSettingsFromCookie } from '@core/utils/serverHelpers'

type Props = ChildrenType

const Layout = async (props: Props) => {
  const { children } = props

  // Vars
  const direction = 'ltr'
  const mode = await getMode()
  const systemMode = await getSystemMode()
  const settingsCookie = await getSettingsFromCookie()

  return (
    <Providers direction={direction} mode={mode} settingsCookie={settingsCookie} systemMode={systemMode}>
      <BlankLayout systemMode={systemMode}>{children}</BlankLayout>
    </Providers>
  )
}

export default Layout