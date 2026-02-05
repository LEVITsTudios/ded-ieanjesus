// components/pwa/offline-indicator.tsx - Indicador de estado online/offline
'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Wifi, WifiOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-50 text-green-700 text-xs">
        <Wifi className="w-3 h-3" />
        <span>Online</span>
      </div>
    )
  }

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <WifiOff className="w-4 h-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        Sin conexión. Los cambios se sincronizarán automáticamente cuando regreses online.
      </AlertDescription>
    </Alert>
  )
}
