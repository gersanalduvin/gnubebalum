// Component Imports
import ClientOnlyColorScheme from '@/components/ClientOnlyColorScheme'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import Providers from '@/components/Providers'

// Util Imports
import { getMode, getSettingsFromCookie, getSystemMode } from '@core/utils/serverHelpers'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: 'GNube - Plataforma académica',
  description: 'Sistema de administración Gnube',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

const RootLayout = async (props: ChildrenType) => {
  const { children } = props

  // Vars
  const mode = await getMode()
  const settingsCookie = await getSettingsFromCookie()
  const systemMode = await getSystemMode()
  const direction = 'ltr'

  return (
    <html id='__next' lang='es' dir={direction} translate='no' className='notranslate' suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // 1. Remove bis_skin_checked attributes immediately
                  function cleanBisSkinChecked() {
                    const elements = document.querySelectorAll('[bis_skin_checked]');
                    elements.forEach(el => el.removeAttribute('bis_skin_checked'));
                  }
                  
                  // Run cleanup immediately
                  cleanBisSkinChecked();
                  
                  // 2. Set up MutationObserver to catch future injections
                  if (typeof MutationObserver !== 'undefined') {
                    const observer = new MutationObserver((mutations) => {
                      mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
                          mutation.target.removeAttribute('bis_skin_checked');
                        }
                      });
                    });
                    
                    observer.observe(document.documentElement, {
                      attributes: true,
                      attributeFilter: ['bis_skin_checked'],
                      subtree: true,
                      childList: true
                    });
                  }
                  
                  // 3. Run cleanup on DOMContentLoaded
                  document.addEventListener('DOMContentLoaded', cleanBisSkinChecked);
                  
                  // 4. Suppress console errors
                  const originalError = console.error;
                  const originalWarn = console.warn;
                  
                  const processLog = (args) => args.map(arg => {
                      try { return String(arg); } catch(e) { return ''; }
                  }).join(' ');

                  const shouldSuppress = (msg) => 
                     msg.includes('bis_skin_checked') || 
                     msg.includes('A tree hydrated') ||
                     msg.includes('Hydration') ||
                     msg.includes('hydration') ||
                     msg.includes('server rendered HTML') ||
                     msg.includes('did not match');

                  console.error = function(...args) {
                     if (shouldSuppress(processLog(args))) return;
                     originalError.apply(console, args);
                  };
                  
                  console.warn = function(...args) {
                     if (shouldSuppress(processLog(args))) return;
                     originalWarn.apply(console, args);
                  };
                } catch(e) { /* ignore */ }
              })();
            `
          }}
        />
        <script src="/sw-cleanup.js" async></script>
        <meta name='google' content='notranslate' />
      </head>
      <body className='flex is-full min-bs-full flex-auto flex-col' suppressHydrationWarning>
        <Providers 
          direction={direction}
          mode={mode}
          settingsCookie={settingsCookie}
          systemMode={systemMode}
        >
          <ClientOnlyColorScheme systemMode={systemMode} />
          {children}
        </Providers>
      </body>
    </html>
  )
}

export default RootLayout
