// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'
import NotFound from '@views/NotFound'

// Util Imports
import { getServerMode, getSystemMode, getSettingsFromCookie } from '@core/utils/serverHelpers'

const NotFoundPage = async () => {
  // Vars
  const direction = 'ltr'
  const mode = await getServerMode()
  const systemMode = await getSystemMode()
  const settingsCookie = await getSettingsFromCookie()

  return (
    <Providers direction={direction} mode={mode} settingsCookie={settingsCookie} systemMode={systemMode}>
      <BlankLayout systemMode={systemMode}>
        <NotFound mode={mode} />
      </BlankLayout>
    </Providers>
  )
}

export default NotFoundPage
