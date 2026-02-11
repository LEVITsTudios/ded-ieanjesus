'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, MapPin, AlertCircle } from 'lucide-react'

interface LocationData {
  latitude: number
  longitude: number
  address: string
  city: string
  province: string
  postal_code: string
  location_url: string
}

interface GeoLocationPickerProps {
  onLocationSelect: (location: LocationData) => void
  initialLocation?: LocationData
  loading?: boolean
}

declare global {
  interface Window {
    L: any
  }
}

export function GeoLocationPicker({
  onLocationSelect,
  initialLocation,
  loading = false,
}: GeoLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ---------------------------
     Load Leaflet safely
  ---------------------------- */
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (window.L) {
      setMapReady(true)
      return
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
    script.async = true

    script.onload = () => setMapReady(true)
    script.onerror = () =>
      setError('Error cargando el mapa. Intenta recargar la página.')

    document.body.appendChild(script)
  }, [])

  /* ---------------------------
     Initialize map
  ---------------------------- */
  useEffect(() => {
    if (!mapReady || !mapContainer.current || mapRef.current) return

    const L = window.L

    const defaultCenter = [
      initialLocation?.latitude ?? -0.2299,
      initialLocation?.longitude ?? -78.5094,
    ]

    const map = L.map(mapContainer.current).setView(defaultCenter, 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    map.on('click', async (e: any) => {
      await updateLocation(e.latlng.lat, e.latlng.lng)
    })

    mapRef.current = map

    if (initialLocation) {
      updateMarker(initialLocation.latitude, initialLocation.longitude)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [mapReady])

  /* ---------------------------
     Geolocation (hardened)
  ---------------------------- */
  const detectCurrentLocation = () => {
    if (typeof window === 'undefined') return

    setIsLoading(true)
    setError(null)

    if (!('geolocation' in navigator)) {
      setError(
        '❌ Geolocalización no disponible. Selecciona manualmente en el mapa.'
      )
      setIsLoading(false)
      return
    }

    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await updateLocation(
            position.coords.latitude,
            position.coords.longitude
          )
          setIsLoading(false)
        },
        (err: any) => {
          const code =
            typeof err?.code === 'number' ? err.code : null
          const message =
            typeof err?.message === 'string' ? err.message : ''

          let errorMessage = 'Error desconocido en geolocalización'

          if (code === 1) {
            errorMessage =
              '❌ Permiso denegado. Habilita la ubicación en tu navegador.'
          } else if (code === 2) {
            errorMessage =
              '⚠️ Ubicación no disponible. Intenta en un lugar abierto.'
          } else if (code === 3) {
            errorMessage =
              '⏱️ Tiempo agotado al obtener la ubicación.'
          } else if (message) {
            errorMessage = `❌ ${message}`
          }

          console.error('[Geolocation Error]', { code, message })

          setError(errorMessage)
          setIsLoading(false)
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 0,
        }
      )
    } catch (e) {
      console.error('Geolocation crash:', e)
      setError('Error inesperado accediendo a la ubicación.')
      setIsLoading(false)
    }
  }

  /* ---------------------------
     Marker handling
  ---------------------------- */
  const updateMarker = (lat: number, lng: number) => {
    if (!mapRef.current) return
    const L = window.L

    if (markerRef.current) {
      markerRef.current.remove()
    }

    const marker = L.marker([lat, lng], {
      draggable: true,
    }).addTo(mapRef.current)

    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      updateLocation(pos.lat, pos.lng)
    })

    mapRef.current.setView([lat, lng], 14)
    markerRef.current = marker
  }

  /* ---------------------------
     Reverse geocoding
  ---------------------------- */
  const updateLocation = async (lat: number, lng: number) => {
    setIsLoading(true)
    setError(null)

    updateMarker(lat, lng)

    try {
      if (abortRef.current) abortRef.current.abort()
      abortRef.current = new AbortController()

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          signal: abortRef.current.signal,
          headers: {
            Accept: 'application/json',
          },
        }
      )

      if (!res.ok) throw new Error('Error obteniendo dirección')

      const data = await res.json()

      const locationData: LocationData = {
        latitude: lat,
        longitude: lng,
        address: data.display_name ?? 'Ubicación seleccionada',
        city:
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          '',
        province:
          data.address?.state ||
          data.address?.province ||
          '',
        postal_code: data.address?.postcode || '',
        location_url: `https://www.google.com/maps?q=${lat},${lng}`,
      }

      onLocationSelect(locationData)
    } catch (err) {
      console.error('Reverse geocoding error:', err)
      setError('Error obteniendo dirección. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  /* ---------------------------
     UI
  ---------------------------- */
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={detectCurrentLocation}
          disabled={isLoading}
          variant="outline"
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Detectando...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4" />
              Detectar mi ubicación
            </>
          )}
        </Button>

        <p className="text-sm text-muted-foreground self-center">
          O haz clic en el mapa para seleccionar manualmente
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div
        ref={mapContainer}
        className="w-full h-[300px] rounded-lg border shadow-sm"
      />

      <p className="text-xs text-muted-foreground">
        Puedes arrastrar el marcador para mayor precisión.
      </p>
    </div>
  )
}
