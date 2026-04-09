// MUI Imports
import Button from '@mui/material/Button'

// Type Imports
import type { ChildrenType } from '@core/types'

// Layout Imports
import HorizontalLayout from '@layouts/HorizontalLayout'
import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'

// Component Imports
import AuthGuard from '@components/auth/AuthGuard'
import HorizontalFooter from '@components/layout/horizontal/Footer'
import Header from '@components/layout/horizontal/Header'
import VerticalFooter from '@components/layout/vertical/Footer'
import Navbar from '@components/layout/vertical/Navbar'
import Navigation from '@components/layout/vertical/Navigation'
import ScrollToTop from '@core/components/scroll-to-top'

// Util Imports
import { getMode, getSettingsFromCookie, getSystemMode } from '@core/utils/serverHelpers'

const Layout = async (props: ChildrenType) => {
  const { children } = props

  // Vars
  const direction = 'ltr'
  const mode = await getMode()
  const systemMode = await getSystemMode()
  const settingsCookie = await getSettingsFromCookie()

  return (
    <AuthGuard>
      <LayoutWrapper
        systemMode={systemMode}
        verticalLayout={
          <VerticalLayout navigation={<Navigation mode={mode} />} navbar={<Navbar />} footer={<VerticalFooter />}>
            {children}
          </VerticalLayout>
        }
        horizontalLayout={
          <HorizontalLayout header={<Header />} footer={<HorizontalFooter />}>
            {children}
          </HorizontalLayout>
        }
      />
      <ScrollToTop className='mui-fixed'>
        <Button variant='contained' className='is-10 bs-10 rounded-full p-0 min-is-0 flex items-center justify-center'>
          <i className='ri-arrow-up-line' />
        </Button>
      </ScrollToTop>
    </AuthGuard>
  )
}

export default Layout
