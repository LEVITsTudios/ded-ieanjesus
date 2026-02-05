// components/pwa/sync-status.tsx - Indicador de sincronización de datos
'use client'

import { useEffect, useState } from 'react'
import { Cloud, CloudOff, Loader2, CheckCircle2 } from 'lucide-react'
import { usePWA, getPendingRequests } from '@/hooks/use-pwa'

export function SyncStatus() {
  const { isSyncing, isOnline } = usePWA()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const checkPending = async () => {
      const pending = await getPendingRequests()
      setPendingCount(pending.length)
    }

    checkPending()

    // Revisar cada 5 segundos
    const interval = setInterval(checkPending, 5000)

    return () => clearInterval(interval)
  }, [isOnline, isSyncing])

  if (!isOnline && pendingCount === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <CloudOff className="w-4 h-4" />
        <span>Offline</span>
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 text-xs text-blue-600 animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Sincronizando...</span>
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-600">
        <Cloud className="w-4 h-4" />
        <span>{pendingCount} cambios pendientes</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs text-green-600">
      <CheckCircle2 className="w-4 h-4" />
      <span>Sincronizado</span>
    </div>
  )
}
