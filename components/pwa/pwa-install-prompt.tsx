// components/pwa/pwa-install-prompt.tsx - Prompt para instalar PWA
'use client'

import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`User response: ${outcome}`)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 md:bottom-4 md:right-4 md:max-w-sm z-50">
      <div className="bg-white border border-blue-200 rounded-lg shadow-lg p-4 m-4 md:m-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900">Instalar Aplicación</h3>
              <p className="text-sm text-gray-600 mt-1">
                Instala LVTsAcademic en tu dispositivo para acceso rápido y funcionamiento offline.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowPrompt(false)}
            variant="outline"
            className="flex-1 text-sm"
          >
            Ahora no
          </Button>
          <Button
            onClick={handleInstall}
            className="flex-1 text-sm bg-blue-600 hover:bg-blue-700"
          >
            Instalar
          </Button>
        </div>
      </div>
    </div>
  )
}
