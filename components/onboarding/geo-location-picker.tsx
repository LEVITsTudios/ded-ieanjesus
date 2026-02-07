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

export function GeoLocationPicker({ onLocationSelect, initialLocation, loading = false }: GeoLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const marker = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useAutoDetect, setUseAutoDetect] = useState(true)

  // Cargar librería Leaflet dinámicamente
  useEffect(() => {
    if (!window.L) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
      document.head.appendChild(link)

      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
      script.onload = () => {
        setMapReady(true)
      }
      document.body.appendChild(script)
    } else {
      setMapReady(true)
    }
  }, [])

  // Inicializar mapa
  useEffect(() => {
    if (!mapReady || !mapContainer.current) return

    const L = window.L
    if (!map.current) {
      // Centro de Ecuador (Quito)
      const defaultCenter = [initialLocation?.latitude || -0.2299, initialLocation?.longitude || -78.5094]
      
      map.current = L.map(mapContainer.current).setView(defaultCenter, 13)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map.current)

      // Click handler para seleccionar ubicación
      map.current.on('click', async (e: any) => {
        await updateLocation(e.latlng.lat, e.latlng.lng)
      })

      // Auto-detect ubicación inicial
      if (useAutoDetect && !initialLocation) {
        detectCurrentLocation()
      } else if (initialLocation) {
        updateMarker(initialLocation.latitude, initialLocation.longitude)
      }
    }

    return () => {
      // Limpiar mapa cuando se desmonte
    }
  }, [mapReady, useAutoDetect, initialLocation])

  const detectCurrentLocation = async () => {
    setIsLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocalización no disponible en tu navegador')
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await updateLocation(position.coords.latitude, position.coords.longitude)
        setIsLoading(false)
      },
      (err) => {
        console.error('Geolocation error:', err)
        setError('Acceso a ubicación denegado. Por favor habilítalo en los permisos del navegador.')
        setIsLoading(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const updateMarker = (lat: number, lng: number) => {
    if (!map.current) return

    const L = window.L
    if (marker.current) {
      marker.current.remove()
    }

    marker.current = L.marker([lat, lng], {
      title: 'Tu ubicación',
      draggable: true,
    }).addTo(map.current)

    marker.current.on('dragend', () => {
      const newLat = marker.current.getLatLng().lat
      const newLng = marker.current.getLatLng().lng
      updateLocation(newLat, newLng)
    })

    map.current.setView([lat, lng], 14)
  }

  const updateLocation = async (lat: number, lng: number) => {
    setIsLoading(true)
    setError(null)

    try {
      updateMarker(lat, lng)

      // Usar Nominatim (OpenStreetMap) para reverse geocoding
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: { 'Accept': 'application/json', 'User-Agent': 'EcuadorAcademicSystem' },
        }
      )

      if (!res.ok) throw new Error('Error al obtener dirección')

      const data = await res.json()

      if (!data.address) {
        setError('No se pudo obtener detalles de la dirección')
        setIsLoading(false)
        return
      }

      const locationData: LocationData = {
        latitude: lat,
        longitude: lng,
        address: data.display_name || 'Ubicación seleccionada',
        city: data.address.city || data.address.town || data.address.village || '',
        province: data.address.state || data.address.province || '',
        postal_code: data.address.postcode || '',
        location_url: `https://www.google.com/maps?q=${lat},${lng}`,
      }

      onLocationSelect(locationData)
    } catch (err) {
      console.error('Error updating location:', err)
      setError('Error al obtener la dirección. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

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
              Detectar MI ubicación
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground self-center">
          O haz clic en el mapa para seleccionar tu ubicación
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
        className="w-full h-[300px] rounded-lg border border-border shadow-sm"
        style={{ zIndex: 1 }}
      />

      <p className="text-xs text-muted-foreground">
        💡 Tip: Puedes arrastrar el marcador en el mapa para ajustar tu ubicación con precisión
      </p>
    </div>
  )
}
