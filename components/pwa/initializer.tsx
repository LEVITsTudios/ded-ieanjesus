'use client'

import { useEffect } from 'react'
import { usePWA } from '@/hooks/use-pwa'

export default function PWAInitializer() {
  const { requestNotificationPermission, subscribeToPush } = usePWA()

  useEffect(() => {
    // Hook `usePWA` se monta y registra el Service Worker automáticamente
    // No solicitamos permisos automáticamente para respetar UX,
    // pero dejamos esta función lista para ser llamada desde un botón.

    // Si existe VAPID key en env, intentamos suscribir (silencioso)
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC
    if (vapid) {
      // subscribeToPush aceptará la clave pública en base64
      // No forzamos petición de permisos aquí.
      subscribeToPush(vapid).catch((e) => {
        // No bloquear la app por errores en la suscripción
        console.debug('Push subscription failed (non-fatal)', e)
      })
    }
  }, [requestNotificationPermission, subscribeToPush])

  return null
}
