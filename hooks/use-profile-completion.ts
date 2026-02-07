'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { checkProfileCompletion } from '@/lib/profile-completion'

interface UseProfileCompletionReturn {
  isLoading: boolean
  isComplete: boolean
  missingFields: string[]
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook para verificar si el perfil del usuario está completo
 * Redirecciona a onboarding si no está completo
 */
export function useProfileCompletion(
  options?: { redirectIfIncomplete?: boolean; skipRedirect?: boolean }
): UseProfileCompletionReturn {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const checkCompletion = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('No autenticado')
        setIsLoading(false)
        return
      }

      const result = await checkProfileCompletion(supabase, user.id)
      setIsComplete(result.isComplete)
      setMissingFields(result.missingFields)

      // Redirigir a onboarding si está incompleto
      if (
        !result.isComplete &&
        options?.redirectIfIncomplete &&
        !options?.skipRedirect
      ) {
        router.push('/onboarding')
      }
    } catch (err: any) {
      console.error('Error checking profile completion:', err)
      setError(err?.message || 'Error al verificar perfil')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkCompletion()
  }, [])

  const refetch = async () => {
    await checkCompletion()
  }

  return {
    isLoading,
    isComplete,
    missingFields,
    error,
    refetch,
  }
}

/**
 * Hook para proteger rutas que requieren perfil completo
 */
export function useProtectedRoute() {
  const { isLoading, isComplete } = useProfileCompletion({
    redirectIfIncomplete: true,
  })

  return { isLoading, isComplete }
}
