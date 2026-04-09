// MUI Imports
import Button from '@mui/material/Button'

// Type Imports
import type { ChildrenType } from '@core/types'

// Layout Imports

// Component Imports
import AuthGuard from '@components/auth/AuthGuard'
import ScrollToTop from '@core/components/scroll-to-top'

// Util Imports
import { getMode, getSettingsFromCookie, getSystemMode } from '@core/utils/serverHelpers'

type Props = ChildrenType & {
  params: Promise<{ lang: string }>
}

const Layout = async (props: Props) => {
  const { children } = props

  // Vars
  const direction = 'ltr'
  const mode = await getMode()
  const systemMode = await getSystemMode()
  const settingsCookie = await getSettingsFromCookie()

  return (
    <AuthGuard>
      {children}
      <ScrollToTop className='mui-fixed'>
        <Button variant='contained' className='is-10 bs-10 rounded-full p-0 min-is-0 flex items-center justify-center'>
          <i className='tabler-chevron-up' />
        </Button>
      </ScrollToTop>
    </AuthGuard>
  )
}

export default Layout
