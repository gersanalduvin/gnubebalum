import type { Config } from 'tailwindcss'

import tailwindPlugin from './src/@core/tailwind/plugin'

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,css}',
    './src/@core/**/*.{js,ts,jsx,tsx,css}',
    './src/@layouts/**/*.{js,ts,jsx,tsx,css}',
    './src/@menu/**/*.{js,ts,jsx,tsx,css}',
    './src/views/**/*.{js,ts,jsx,tsx,css}',
    './src/hocs/**/*.{js,ts,jsx,tsx,css}',
    './src/hooks/**/*.{js,ts,jsx,tsx,css}',
    './src/libs/**/*.{js,ts,jsx,tsx,css}',
    './src/utils/**/*.{js,ts,jsx,tsx,css}',
    './src/app/layout.tsx',
    './src/app/page.tsx',
    './src/app/globals.css',
    '!./node_modules/**'
  ],
  corePlugins: {
    preflight: false
  },
  important: '#__next',
  plugins: [tailwindPlugin],
  theme: {
    extend: {}
  }
}

export default config
