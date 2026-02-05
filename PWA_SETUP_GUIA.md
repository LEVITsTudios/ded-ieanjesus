# 🛠️ PWA - Guía de Setup e Implementación

## 📋 Checklist de Configuración

### ✅ Paso 1: Verificar Archivos Creados

```
Archivos necesarios:
✓ /public/manifest.json
✓ /public/sw.js
✓ /hooks/use-pwa.ts
✓ /components/pwa/offline-indicator.tsx
✓ /components/pwa/pwa-install-prompt.tsx
✓ /components/pwa/notification-setup.tsx
✓ /components/pwa/sync-status.tsx
✓ /components/mobile/mobile-stats.tsx
✓ /components/mobile/mobile-bottom-nav.tsx
✓ /components/mobile/mobile-card.tsx
✓ /app/layout.tsx (actualizado)
✓ /app/dashboard/layout.tsx (actualizado)
✓ /components/dashboard/sidebar.tsx (actualizado)
```

### ✅ Paso 2: Instalar Dependencias

```bash
# No requiere dependencias nuevas
# Todo usa Web APIs nativas
npm install
```

### ✅ Paso 3: Actualizar next.config

```javascript
// next.config.mjs
import withPWA from 'next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...existing config
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
})(nextConfig)
```

> **Nota:** Si no tienes next-pwa instalado:
> ```bash
> npm install next-pwa
> ```

### ✅ Paso 4: Crear Iconos PWA

Necesitas estos iconos en `/public/`:

```
/public/
├─ icon-192x192.png (192x192px)
├─ icon-192x192-maskable.png (192x192px, con espacio)
├─ icon-512x512.png (512x512px)
├─ icon-512x512-maskable.png (512x512px, con espacio)
├─ apple-touch-icon.png (180x180px)
└─ screenshot-*.png (opcionales)
```

**Cómo generar iconos rápido:**

Opción 1: Usar favicon generator online
```
https://www.favicon-generator.org/
Upload imagen → Descarga todos los iconos
```

Opción 2: Usar ImageMagick
```bash
convert logo.png -resize 192x192 icon-192x192.png
convert logo.png -resize 512x512 icon-512x512.png
convert logo.png -resize 180x180 apple-touch-icon.png
```

Opción 3: Usar Online (rápido)
```
https://png2jpg.com/ → Resize tool
Sube imagen → Redimensiona → Descarga
```

### ✅ Paso 5: Verificar Service Worker en Production

En **`next.config.mjs`**:

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // En development
  disable: process.env.NODE_ENV === 'development'
})

module.exports = withPWA({
  // Tu config...
})
```

### ✅ Paso 6: Build y Test

```bash
# Production build
npm run build

# Start servidor
npm run start

# Verificar en navegador
# http://localhost:3000
# Abre DevTools (F12) → Application → Service Workers
```

## 🔑 Variables de Entorno Opcionales

```env
# .env.local (opcional, para push notifications)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_clave_vapid
```

**Generar VAPID keys para push notifications:**

```bash
# Instalar web-push globalmente
npm install -g web-push

# Generar claves
web-push generate-vapid-keys
```

## 🚀 Uso en la Aplicación

### 1. En el Layout (ya está hecho)

```tsx
// app/dashboard/layout.tsx
import { OfflineIndicator } from "@/components/pwa/offline-indicator"
import { PWAInstallPrompt } from "@/components/pwa/pwa-install-prompt"
import { NotificationSetup } from "@/components/pwa/notification-setup"

export default function DashboardLayout({ children }) {
  return (
    <div>
      {/* Indicadores */}
      <OfflineIndicator />
      <NotificationSetup />
      
      {/* Contenido */}
      {children}
      
      {/* Prompt flotante */}
      <PWAInstallPrompt />
    </div>
  )
}
```

### 2. Usar Hook usePWA en Componentes

```tsx
'use client'

import { usePWA } from '@/hooks/use-pwa'

export function MiComponente() {
  const {
    isOnline,
    isSyncing,
    sendNotification,
    installPWA,
    // ... más métodos
  } = usePWA()

  return (
    <div>
      {isOnline ? '✅ Online' : '⚠️ Offline'}
      {isSyncing && '🔄 Sincronizando...'}
      
      <button onClick={() => sendNotification('Hola', {
        body: 'Mensaje de prueba'
      })}>
        Enviar Notificación
      </button>
    </div>
  )
}
```

### 3. Fetch con Soporte Offline

```tsx
'use client'

import { usePWA } from '@/hooks/use-pwa'

export function FormularioConOffline() {
  const { fetchWithOfflineFallback, isOnline } = usePWA()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetchWithOfflineFallback('/api/datos', {
        method: 'POST',
        body: JSON.stringify({ /* datos */ })
      })
      
      if (response.status === 202) {
        // Offline - se sincronizará después
        alert('Guardado localmente, sincronizará pronto')
      } else if (response.ok) {
        // Online - enviado al instante
        alert('Guardado exitosamente')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {!isOnline && <p>⚠️ Sin conexión - cambios se sincronizarán</p>}
      {/* formulario */}
    </form>
  )
}
```

## 🧪 Testing en Desarrollo

### 1. Simular Offline en Chrome DevTools

```
1. F12 → DevTools
2. Pestaña "Network"
3. Busca dropdown "Throttling" (arriba a la derecha)
4. Selecciona "Offline"
5. Ahora estás offline para testing
```

### 2. Ver Service Workers

```
1. F12 → Application
2. Sección "Service Workers"
3. Verifica que esté "active and running"
```

### 3. Ver Caché

```
1. F12 → Application
2. Sección "Cache Storage"
3. Abre "static-v1", "dynamic-v1", "api-v1"
4. Mira qué está cacheado
```

### 4. Ver IndexedDB

```
1. F12 → Application
2. Sección "IndexedDB" → "AcadRegDB"
3. Tabla "pending" = requests pendientes
4. Tabla "sync_queue" = datos para sincronizar
```

### 5. Probar Notificaciones

```javascript
// En consola (F12)
if ('Notification' in window) {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      new Notification('Test', { body: 'Esto es una prueba' })
    }
  })
}
```

## 📦 Tamaño y Performance

### Tamaño de caché esperado

```
assets estáticos (CSS, JS):  5-10 MB
Datos cacheados:              2-5 MB
IndexedDB (pending):          1-2 MB
────────────────────────────
Total:                        8-17 MB (normal)
```

### Optimizaciones implementadas

✅ **Compresión**: Gzip en assets  
✅ **Versionado**: Cache con versión  
✅ **Expiración**: Limpieza automática  
✅ **Lazy loading**: Carga bajo demanda  
✅ **Code splitting**: Chunks pequeños  

## 🔐 HTTPS en Producción

### Importante para PWA

```
Localhost: ✅ HTTP funciona
Producción: ❌ REQUIERE HTTPS

Sin HTTPS:
- No se registra Service Worker
- No funciona PWA
- No hay notificaciones
- No sincroniza
```

### Obtener HTTPS gratis

**Opción 1: Let's Encrypt (Recomendado)**
```bash
# En servidor Linux
sudo apt install certbot
sudo certbot certonly --standalone -d tudominio.com
```

**Opción 2: Cloudflare (Fácil)**
```
1. Registra dominio en Cloudflare
2. Cambia nameservers
3. Cloudflare da SSL gratis
```

**Opción 3: AWS/Google Cloud**
```
Ambos incluyen SSL certificates gratis
```

## 🚨 Troubleshooting Deploy

### Service Worker no se registra

```
Causa común: No hay HTTPS en producción

Solución:
1. Verifica que tienes HTTPS
2. Revisa console para errores
3. Comprueba que manifest.json existe
4. Limpia navegador cache
```

### Notificaciones no funcionan

```
Causa: Servidor no está suscrito a push

Solución:
1. Usuario debe dar permiso
2. Guardar subscription en DB
3. Crear endpoint para enviar notificaciones
```

### Iconos no aparecen

```
Causa: Rutas incorrectas en manifest.json

Solución:
1. Verifica que iconos estén en /public/
2. Paths en manifest.json son relativos a /public/
3. Tamaños correctos (192x192, 512x512)
```

## 📊 Monitoreo en Producción

### Google Analytics PWA

```javascript
// Eventos a rastrear
gtag('event', 'pwa_install')
gtag('event', 'pwa_offline_access')
gtag('event', 'sync_completed')
gtag('event', 'notification_clicked')
```

### Errores a monitorear

```javascript
// En service worker
self.addEventListener('error', (event) => {
  console.error('SW Error:', event.error)
  // Enviar a servicio de logging
})
```

## 📚 Referencia Rápida

### Hooks disponibles

```typescript
const {
  isOnline,                    // boolean
  isSyncing,                   // boolean
  isPWAInstallable,            // boolean
  notificationPermission,      // { status, requestNeeded }
  installPWA,                  // () => Promise<void>
  requestNotificationPermission, // () => Promise<boolean>
  sendNotification,            // (title, options) => Promise<boolean>
  subscribeToPush,             // (vapidKey) => Promise<Subscription>
  syncPendingData,             // () => Promise<void>
  fetchWithOfflineFallback,    // (url, options) => Promise<Response>
  updateServiceWorker          // () => Promise<void>
} = usePWA()
```

### Componentes PWA

```tsx
<OfflineIndicator />        // Muestra estado online/offline
<PWAInstallPrompt />        // Prompt flotante para instalar
<NotificationSetup />       // Solicita permisos
<SyncStatus />              // Muestra estado de sincronización
```

### Componentes Mobile

```tsx
<MobileStats stats={[...]} />    // Grid responsivo
<MobileBottomNav />              // Nav inferior móvil
<MobileCard>...</MobileCard>     // Card responsiva
```

## ✨ Mejoras Futuras

```
Posibles mejoras:
□ Encrypted sync
□ Peer-to-peer sync
□ Background periodic sync
□ File sharing API
□ Camera/GPS integration
□ Bluetooth connectivity
□ Offline conflict resolution
□ Advanced analytics
```

---

**PWA está completamente configurada y lista para usar** 🎉
