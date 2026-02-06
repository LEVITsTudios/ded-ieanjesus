'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { validateEcuadorianDNI } from '@/lib/validators'
import { Mail, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function RecoverAccountForm() {
  const [searchType, setSearchType] = useState<'email' | 'dni'>('email')
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (searchType === 'email') {
        if (!searchValue.trim()) {
          setError('Por favor ingresa tu correo electrónico')
          setLoading(false)
          return
        }

        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('email', searchValue.toLowerCase())
          .single()

        if (queryError || !data) {
          setError('No encontramos una cuenta con ese correo electrónico')
          setLoading(false)
          return
        }

        // Enviar email con información de recuperación (segura)
        await supabase.functions.invoke('send-account-recovery-email', {
          body: { email: searchValue.toLowerCase() }
        }).catch(() => {
          // Si falla la función, mostrar mensaje genérico
          setSuccess(true)
        })

        setSuccess(true)
      } else {
        // Búsqueda por DNI
        const validation = validateEcuadorianDNI(searchValue)
        if (!validation.valid) {
          setError(validation.message)
          setLoading(false)
          return
        }

        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('dni', searchValue)
          .single()

        if (queryError || !data) {
          setError('No encontramos una cuenta con ese DNI')
          setLoading(false)
          return
        }

        // Enviar email con información de recuperación
        await supabase.functions.invoke('send-account-recovery-email', {
          body: { email: data.email }
        }).catch(() => {
          setSuccess(true)
        })

        setSuccess(true)
      }
    } catch (err) {
      setError('Ocurrió un error. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-2">
          <div className="flex justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-center">Correo de recuperación enviado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Hemos enviado un correo electrónico con tu información de cuenta.
          </p>
          <p className="text-xs text-muted-foreground">
            Por favor revisa tu bandeja de entrada (y carpeta de spam).
          </p>
          <Link href="/auth/login" className="block w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al login
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Recuperar cuenta</CardTitle>
        <CardDescription>
          Recupera tu información de cuenta de forma segura
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Opción de búsqueda */}
          <div className="space-y-3">
            <Label>Buscar por:</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={searchType === 'email' ? 'default' : 'outline'}
                onClick={() => {
                  setSearchType('email')
                  setSearchValue('')
                  setError(null)
                }}
              >
                Correo
              </Button>
              <Button
                type="button"
                variant={searchType === 'dni' ? 'default' : 'outline'}
                onClick={() => {
                  setSearchType('dni')
                  setSearchValue('')
                  setError(null)
                }}
              >
                Cédula
              </Button>
            </div>
          </div>

          {/* Campo de entrada */}
          <div className="space-y-2">
            <Label htmlFor="search">
              {searchType === 'email' ? 'Correo electrónico' : 'Número de cédula'}
            </Label>
            <Input
              id="search"
              type={searchType === 'email' ? 'email' : 'text'}
              placeholder={
                searchType === 'email'
                  ? 'tu@email.com'
                  : '1234567890'
              }
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !searchValue}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar información de cuenta
              </>
            )}
          </Button>

          <div className="text-center text-sm">
            <Link href="/auth/login" className="text-primary hover:underline">
              Volver al login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
