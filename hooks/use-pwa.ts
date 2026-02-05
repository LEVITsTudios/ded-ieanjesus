// lib/hooks/use-pwa.ts - Hook para PWA features y offline-first
import { useEffect, useState, useCallback } from "react"

interface PendingRequest {
  id?: number
  url: string
  method: string
  body?: string
  headers?: string
  timestamp: number
}

interface NotificationPermission {
  status: "default" | "granted" | "denied"
  requestNeeded: boolean
}

export function usePWA() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isPWAInstallable, setIsPWAInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>({
    status: "default",
    requestNeeded: false
  })

  // Registrar Service Worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registrado:", registration)
          
          // Escuchar actualizaciones
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // Nueva versión disponible
                  const messageEvent = new CustomEvent("sw-update-available", {
                    detail: { registration }
                  })
                  window.dispatchEvent(messageEvent)
                }
              })
            }
          })
        })
        .catch((error) => console.log("Error registrando SW:", error))
    }
  }, [])

  // Detectar online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Sincronizar datos cuando vuelve la conexión
      syncPendingData()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Verificar estado inicial
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Detectar instalabilidad de PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event)
      setIsPWAInstallable(true)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsPWAInstallable(false)
      console.log("PWA instalada")
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    // Verificar si ya está instalada
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsPWAInstallable(false)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  // Verificar permiso de notificaciones
  useEffect(() => {
    if ("Notification" in window) {
      const status = Notification.permission as any
      setNotificationPermission({
        status,
        requestNeeded: status === "default"
      })
    }
  }, [])

  // Instalar PWA
  const installPWA = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`User responded: ${outcome}`)
      setDeferredPrompt(null)
      setIsPWAInstallable(false)
    }
  }, [deferredPrompt])

  // Solicitar permisos de notificación
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission({
        status: permission,
        requestNeeded: false
      })
      return permission === "granted"
    }
    return false
  }, [])

  // Enviar notificación
  const sendNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if ("serviceWorker" in navigator && "Notification" in window) {
      if (Notification.permission === "granted") {
        const registration = await navigator.serviceWorker.ready
        registration.showNotification(title, {
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          ...options
        })
        return true
      }
    }
    return false
  }, [])

  // Suscribirse a push notifications
  const subscribeToPush = useCallback(async (vapidPublicKey: string) => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return null
      }

      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey
        })
      }

      return subscription
    } catch (error) {
      console.error("Error suscribiéndose a push:", error)
      return null
    }
  }, [])

  // Sincronizar datos pendientes
  const syncPendingData = useCallback(async () => {
    if (!isOnline) return

    setIsSyncing(true)
    try {
      const pending = await getPendingRequests()
      
      for (const request of pending) {
        try {
          const options: RequestInit = {
            method: request.method,
            headers: request.headers ? JSON.parse(request.headers) : {}
          }

          if (request.body) {
            options.body = request.body
          }

          const response = await fetch(request.url, options)

          if (response.ok) {
            await removePendingRequest(request.id!)
          }
        } catch (error) {
          console.error("Error sincronizando:", error)
        }
      }
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline])

  // Hacer request con fallback offline
  const fetchWithOfflineFallback = useCallback(
    async (url: string, options?: RequestInit) => {
      try {
        const response = await fetch(url, options)
        return response
      } catch (error) {
        // Si falla y estamos offline, guardar para sync posterior
        if (!isOnline && options?.method !== "GET") {
          await addPendingRequest({
            url,
            method: options?.method || "GET",
            body: options?.body ? String(options.body) : undefined,
            headers: options?.headers ? JSON.stringify(options.headers) : undefined,
            timestamp: Date.now()
          })
          
          return new Response(JSON.stringify({ offline: true }), {
            status: 202,
            statusText: "Accepted (Offline)"
          })
        }
        throw error
      }
    },
    [isOnline]
  )

  // Actualizar SW
  const updateServiceWorker = useCallback(async () => {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready
      const newReg = await registration.update()
      if (newReg?.installing) {
        newReg.installing.postMessage({ type: "SKIP_WAITING" })
        window.location.reload()
      }
    }
  }, [])

  return {
    isOnline,
    isSyncing,
    isPWAInstallable,
    notificationPermission,
    installPWA,
    requestNotificationPermission,
    sendNotification,
    subscribeToPush,
    syncPendingData,
    fetchWithOfflineFallback,
    updateServiceWorker
  }
}

// IndexedDB helpers
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("LEVITsAcademicDB", 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains("pending")) {
        db.createObjectStore("pending", { keyPath: "id", autoIncrement: true })
      }
      if (!db.objectStoreNames.contains("sync_queue")) {
        db.createObjectStore("sync_queue", { keyPath: "id", autoIncrement: true })
      }
    }
  })
}

async function getPendingRequests(): Promise<PendingRequest[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["pending"], "readonly")
    const store = transaction.objectStore("pending")
    const request = store.getAll()
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function addPendingRequest(request: PendingRequest): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["pending"], "readwrite")
    const store = transaction.objectStore("pending")
    const dbRequest = store.add(request)
    
    dbRequest.onerror = () => reject(dbRequest.error)
    dbRequest.onsuccess = () => resolve(dbRequest.result as number)
  })
}

async function removePendingRequest(id: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["pending"], "readwrite")
    const store = transaction.objectStore("pending")
    const request = store.delete(id)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export { getPendingRequests, addPendingRequest, removePendingRequest }
