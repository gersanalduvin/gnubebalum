// Next Imports
import { headers } from 'next/headers'

// Type Imports
import type { ChildrenType } from '@core/types'
import type { Locale } from '@configs/i18n'

// Component Imports
import TranslationWrapper from '@/hocs/TranslationWrapper'
import Providers from '@/components/Providers'

// Util Imports
import { getMode, getSystemMode, getSettingsFromCookie } from '@core/utils/serverHelpers'

type Props = ChildrenType & {
  params: Promise<{ lang: string }>
}

const Layout = async (props: Props) => {
  const { children } = props
  const params = await props.params
  const headersList = await headers()
  
  // Vars
  const direction = 'ltr'
  const mode = await getMode()
  const systemMode = await getSystemMode()
  const settingsCookie = await getSettingsFromCookie()

  return (
    <Providers direction={direction} mode={mode} settingsCookie={settingsCookie} systemMode={systemMode}>
      <TranslationWrapper headersList={headersList} lang={params.lang as Locale}>
        {children}
      </TranslationWrapper>
    </Providers>
  )
}

export default Layout