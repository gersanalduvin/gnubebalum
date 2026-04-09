import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  basePath: process.env.BASEPATH,
  
  // Optimizaciones de rendimiento para producción
  compress: true,
  poweredByHeader: false,
  
  // Optimización de imágenes
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Configuración de headers para cache
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  
  // Optimización del bundle - versión simplificada
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  
  // Desactivar logs de desarrollo
  logging: {
    fetches: {
      fullUrl: false
    }
  },
  
  // Desactivar ESLint durante el build
  eslint: {
    ignoreDuringBuilds: true
  }
}

export default nextConfig
