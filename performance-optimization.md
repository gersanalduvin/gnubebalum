# Guía de Optimización de Rendimiento - Next.js en Producción

## 🚀 Optimizaciones Implementadas

### 1. Configuración de Next.js (`next.config.ts`)
- **Compresión habilitada**: `compress: true`
- **Optimización de imágenes**: WebP y AVIF
- **Headers de seguridad y cache**
- **Code splitting optimizado** para MUI y vendors
- **Importaciones optimizadas** para librerías grandes

### 2. Scripts de Producción
- `npm run build:prod` - Build optimizado para producción
- `npm run start:prod` - Servidor de producción
- `npm run build:analyze` - Análisis del bundle
- `npm run clean` - Limpieza de cache

### 3. Variables de Entorno
- Archivo `.env.production` para configuración específica de producción
- `NEXT_TELEMETRY_DISABLED=1` para mejor rendimiento

## 🔧 Recomendaciones para el VPS

### 1. Configuración del Servidor
```bash
# Instalar PM2 para gestión de procesos
npm install -g pm2

# Configurar PM2 para Next.js
pm2 start npm --name "nextjs-app" -- run start:prod
pm2 startup
pm2 save
```

### 2. Nginx como Proxy Reverso
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Compresión
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache para archivos estáticos
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy a Next.js
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Optimizaciones del Sistema
```bash
# Aumentar límites de archivos abiertos
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimizar TCP
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" >> /etc/sysctl.conf
sysctl -p
```

### 4. Monitoreo de Recursos
```bash
# Verificar uso de memoria
free -h

# Verificar uso de CPU
htop

# Verificar procesos de Node.js
pm2 monit
```

## 📊 Métricas de Rendimiento

### Comandos para Análisis
```bash
# Analizar bundle size
npm run build:analyze

# Verificar build de producción
npm run build:prod

# Lighthouse CI (opcional)
npm install -g @lhci/cli
lhci autorun
```

### Herramientas de Monitoreo
- **PM2 Monitoring**: `pm2 monit`
- **Next.js Analytics**: Habilitar en Vercel o similar
- **Web Vitals**: Implementar en la aplicación

## 🎯 Checklist de Optimización

### Frontend (Next.js)
- [x] Compresión habilitada
- [x] Code splitting optimizado
- [x] Importaciones optimizadas
- [x] Headers de cache configurados
- [x] Imágenes optimizadas (WebP/AVIF)
- [ ] Service Worker (PWA)
- [ ] Lazy loading de componentes
- [ ] Preload de recursos críticos

### Backend (Laravel)
- [ ] Cache de Redis/Memcached
- [ ] Optimización de consultas DB
- [ ] Compresión de respuestas API
- [ ] CDN para assets estáticos
- [ ] Queue workers optimizados

### Infraestructura
- [ ] Nginx como proxy reverso
- [ ] PM2 para gestión de procesos
- [ ] SSL/TLS configurado
- [ ] Firewall configurado
- [ ] Backup automatizado
- [ ] Monitoreo de recursos

## 🚨 Problemas Comunes y Soluciones

### 1. Memoria Insuficiente
```bash
# Aumentar memoria para Node.js
NODE_OPTIONS="--max-old-space-size=4096" npm run start:prod
```

### 2. Conexiones Lentas a la Base de Datos
- Verificar configuración de pool de conexiones
- Implementar cache de consultas
- Optimizar índices de base de datos

### 3. Assets Grandes
- Implementar CDN
- Optimizar imágenes automáticamente
- Usar lazy loading

### 4. Tiempo de Build Lento
```bash
# Limpiar cache antes del build
npm run clean
npm run build:prod
```

## 📈 Métricas Objetivo

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Tiempo de Carga
- **TTFB (Time to First Byte)**: < 600ms
- **FCP (First Contentful Paint)**: < 1.8s
- **TTI (Time to Interactive)**: < 3.8s