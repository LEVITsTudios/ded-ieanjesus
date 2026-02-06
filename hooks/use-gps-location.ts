'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, MapPin, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface GeoLocation {
  province: string
  city: string
  sector: string
  latitude: number
  longitude: number
}

export function useGPSLocation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<GeoLocation | null>(null)

  const getLocation = async () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocalización no disponible en tu navegador')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          // Usar Open Street Map Nominatim para reverse geocoding (libre y sin API key)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'es',
              }
            }
          )

          if (!response.ok) throw new Error('Error en geolocalización')

          const data = await response.json()
          const address = data.address || {}

          // Mapear información al formato Ecuador
          const loc: GeoLocation = {
            province: address.state || address.province || '',
            city: address.city || address.town || address.county || '',
            sector: address.neighbourhood || address.suburb || address.road || '',
            latitude,
            longitude,
          }

          setLocation(loc)
        } catch (err) {
          setError('No pudimos obtener la dirección exacta. Por favor ingresa manualmente.')
          setLocation({
            province: '',
            city: '',
            sector: '',
            latitude,
            longitude,
          })
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        let errorMsg = 'No pudimos acceder a tu ubicación'
        
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = 'Permiso de ubicación denegado. Por favor habilita la geolocalización en tu navegador.'
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = 'Tu dispositivo no puede determinar la ubicación'
        } else if (err.code === err.TIMEOUT) {
          errorMsg = 'La solicitud de ubicación tardó demasiado'
        }

        setError(errorMsg)
        setLoading(false)
      }
    )
  }

  return { getLocation, loading, error, location }
}

export function GPSButton({ onLocationFound }: { onLocationFound: (loc: GeoLocation) => void }) {
  const { getLocation, loading, error, location } = useGPSLocation()

  const handleClick = async () => {
    await getLocation()
    
    const timer = setInterval(() => {
      // Verificar si location se ha actualizado
    }, 100)

    // Limpiar y llamar callback cuando tenga ubicación
    return () => clearInterval(timer)
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Obteniendo ubicación...
          </>
        ) : (
          <>
            <MapPin className="mr-2 h-4 w-4" />
            Usar mi ubicación actual
          </>
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {location && !error && (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            <p>✓ Ubicación encontrada</p>
            <p className="text-xs mt-1 text-muted-foreground">
              {location.province}{location.city ? `, ${location.city}` : ''} 
              {location.latitude && ` (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`}
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
