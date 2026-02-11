// components/pwa/notification-setup.tsx - Componente para configurar notificaciones
'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePWA } from '@/hooks/use-pwa'

export function NotificationSetup() {
  const { notificationPermission, requestNotificationPermission } = usePWA()
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    setShowAlert(notificationPermission.requestNeeded)
  }, [notificationPermission.requestNeeded])

  if (!showAlert) return null

  return (
    <Alert className="mb-4 border-blue-200 dark:text-white">
      <Bell className="w-4 h-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <span>Habilita notificaciones para recibir alertas importantes</span>
        <Button
          onClick={requestNotificationPermission}
          size="sm"
          className="ml-4 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-cyan-500/50"
        >
          Habilitar
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export function NotificationStatus() {
  const { notificationPermission } = usePWA()

  const getStatus = () => {
    switch (notificationPermission.status) {
      case 'granted':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
          text: 'Notificaciones habilitadas',
          color: 'text-green-700'
        }
      case 'denied':
        return {
          icon: <BellOff className="w-5 h-5 text-red-600" />,
          text: 'Notificaciones deshabilitadas',
          color: 'text-red-700'
        }
      default:
        return {
          icon: <Bell className="w-5 h-5 text-gray-600" />,
          text: 'Notificaciones no configuradas',
          color: 'text-gray-700'
        }
    }
  }

  const status = getStatus()

  return (
    <div className={`flex items-center gap-2 ${status.color}`}>
      {status.icon}
      <span className="text-sm">{status.text}</span>
    </div>
  )
}
