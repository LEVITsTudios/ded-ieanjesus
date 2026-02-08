'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  updateProfileData,
  getSecurityQuestions,
  saveSecurityAnswers,
  checkProfileCompletion,
} from '@/lib/profile-completion'
import {
  validateEcuadorianDNI,
  validateEcuadorianPhone,
  validateDateOfBirth,
  validateAddress,
  validateFullName,
  validateEmail,
  formatEcuadorianPhoneForStorage,
  ECUADOR_PROVINCES,
} from '@/lib/validators'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { GeoLocationPicker } from '@/components/onboarding/geo-location-picker'

interface FormData {
  full_name: string
  email: string
  dni: string
  phone: string
  date_of_birth: string
  address: string
  city: string
  province: string
  postal_code: string
  latitude: number | null
  longitude: number | null
 location_url: string
}

interface LocationData {
  latitude: number
  longitude: number
  address: string
  city: string
  province: string
  postal_code: string
  location_url: string
}

interface FieldErrors {
  [key: string]: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [securityQuestions, setSecurityQuestions] = useState<any[]>([])
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [showPin, setShowPin] = useState(false)
  const [showPinConfirm, setShowPinConfirm] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    dni: '',
    phone: '',
    date_of_birth: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    latitude: null,
    longitude: null,
    location_url: '',
  })

  const [securityData, setSecurityData] = useState({
    pin: '',
    pin_confirm: '',
  })

  const [answersData, setAnswersData] = useState<Record<string, string>>({})

  const steps = [
    {
      id: 'personal',
      title: 'Información Personal',
      description: 'Datos básicos y ubicación (requerido)',
    },
    {
      id: 'security-questions',
      title: 'Preguntas de Seguridad',
      description: 'Configura tus respuestas de seguridad',
    },
    {
      id: 'security-pin',
      title: 'PIN de Seguridad',
      description: 'Crea un código de acceso (4-6 dígitos)',
    },
  ]

  useEffect(() => {
    initializeOnboarding()
  }, [])

  const initializeOnboarding = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Cargar perfil actual
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFormData({
          full_name: profileData.full_name || user.user_metadata?.full_name || '',
          email: profileData.email || user.email || '',
          dni: profileData.dni || '',
          phone: profileData.phone || '',
          date_of_birth: profileData.date_of_birth || '',
          address: profileData.address || '',
          city: profileData.city || '',
          province: profileData.province || '',
          postal_code: profileData.postal_code || '',
          latitude: profileData.latitude || null,
          longitude: profileData.longitude || null,
          location_url: profileData.location_url || '',
        })
      }

      // Cargar preguntas de seguridad
      try {
        const result = await getSecurityQuestions(supabase)
        if (result && result.data && Array.isArray(result.data)) {
          setSecurityQuestions(result.data)
        } else {
          console.warn('Security questions format unexpected:', result)
          setSecurityQuestions([])
        }
      } catch (qErr) {
        console.error('Error loading security questions:', qErr)
        setSecurityQuestions([])
      }

      setLoading(false)
    } catch (err) {
      console.error('Error initializing onboarding:', err)
      setError('Error al cargar el formulario. Por favor recarga la página.')
      setLoading(false)
    }
  }

  const validatePersonalData = (): boolean => {
    const errors: FieldErrors = {}

    // Validar nombre (si no viene de OAuth)
    if (!formData.full_name || !formData.full_name.trim()) {
      errors.full_name = 'El nombre completo es requerido'
    } else {
      const nameValidation = validateFullName(formData.full_name)
      if (!nameValidation.valid) {
        errors.full_name = nameValidation.message
      }
    }

    // Validar email (si no viene de OAuth)
    if (!formData.email || !formData.email.trim()) {
      errors.email = 'El email es requerido'
    } else {
      const emailValidation = validateEmail(formData.email)
      if (!emailValidation.valid) {
        errors.email = emailValidation.message
      }
    }

    // Validar DNI/Cédula (MUY IMPORTANTE para Ecuador)
    if (!formData.dni || !formData.dni.trim()) {
      errors.dni = 'La cédula es requerida'
    } else {
      const dniValidation = validateEcuadorianDNI(formData.dni)
      if (!dniValidation.valid) {
        errors.dni = dniValidation.message
      }
    }

    // Validar teléfono
    if (!formData.phone || !formData.phone.trim()) {
      errors.phone = 'El teléfono es requerido'
    } else {
      const phoneValidation = validateEcuadorianPhone(formData.phone)
      if (!phoneValidation.valid) {
        errors.phone = phoneValidation.message
      }
    }

    // Validar fecha de nacimiento
    if (!formData.date_of_birth) {
      errors.date_of_birth = 'La fecha de nacimiento es requerida'
    } else {
      const ageValidation = validateDateOfBirth(formData.date_of_birth, 5)
      if (!ageValidation.valid) {
        errors.date_of_birth = ageValidation.message
      }
    }

    // Validar dirección
    if (!formData.address || !formData.address.trim()) {
      errors.address = 'La dirección es requerida'
    } else {
      const addressValidation = validateAddress(formData.address)
      if (!addressValidation.valid) {
        errors.address = addressValidation.message
      }
    }

    // Validar ubicación GPS (obligatoria)
    if (!formData.latitude || !formData.longitude) {
      errors.location = 'Debes seleccionar tu ubicación en el mapa'
    }

    // Validar provincia
    if (!formData.province || formData.province.trim() === '') {
      errors.province = 'La provincia es requerida'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLocationSelect = (location: LocationData) => {
    setFormData({
      ...formData,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      city: location.city,
      province: location.province,
      postal_code: location.postal_code,
      location_url: location.location_url,
    })
    setFieldErrors({ ...fieldErrors, location: '' })
  }

  const savePersonalData = async () => {
    if (!validatePersonalData()) {
      setError('Por favor completa todos los campos correctamente')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Verificar duplicados: DNI
      if (formData.dni.trim()) {
        const { data: existingDni } = await supabase
          .from('profiles')
          .select('id')
          .eq('dni', formData.dni.trim())
          .neq('id', user.id)
          .limit(1)

        if (existingDni && existingDni.length > 0) {
          setError('Esta cédula ya está registrada en el sistema')
          setLoading(false)
          return
        }
      }

      // Verificar duplicados: Teléfono
      if (formData.phone.trim()) {
        const { data: existingPhone } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', formData.phone.trim())
          .neq('id', user.id)
          .limit(1)

        if (existingPhone && existingPhone.length > 0) {
          setError('Este teléfono ya está registrado en el sistema')
          setLoading(false)
          return
        }
      }

      // Guardar datos personales
      // Validar y formatear teléfono
      const phoneValidation = validateEcuadorianPhone(formData.phone)
      const formattedPhone = phoneValidation.formatted || formData.phone.trim()
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          dni: formData.dni.trim(),
          phone: formattedPhone.replace(/\s/g, ''), // Guardar sin espacios: +5939XXXXXXXX
          date_of_birth: formData.date_of_birth,
          address: formData.address.trim(),
          city: formData.city,
          province: formData.province,
          postal_code: formData.postal_code,
          latitude: formData.latitude,
          longitude: formData.longitude,
          location_url: formData.location_url,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setCurrentStep(1)
      setLoading(false)
    } catch (err: any) {
      console.error('Error saving personal data:', err)
      setError(err.message || 'Error al guardar datos personales')
      setLoading(false)
    }
  }

  const saveSecurityQuestions = async () => {
    // Validar que haya al menos 3 preguntas respondidas
    const answeredCount = Object.values(answersData).filter(a => a && a.trim()).length

    if (answeredCount < 3) {
      setError(`Debes responder al menos 3 preguntas de seguridad (${answeredCount}/3)`)
      return
    }

    try {
      setLoading(true)
      setError(null)

      await saveSecurityAnswers(supabase, user.id, answersData)

      setCurrentStep(2)
      setLoading(false)
    } catch (err: any) {
      console.error('Error saving security questions:', err)
      setError(err.message || 'Error al guardar preguntas de seguridad')
      setLoading(false)
    }
  }

  const saveSecurityPin = async () => {
    if (!securityData.pin.trim()) {
      setError('El PIN es requerido')
      return
    }

    if (securityData.pin !== securityData.pin_confirm) {
      setError('Los PINs no coinciden')
      return
    }

    if (!/^\d{4,6}$/.test(securityData.pin)) {
      setError('El PIN debe contener 4-6 dígitos numéricos')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Guardar PIN
      const response = await fetch('/api/security/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: securityData.pin }),
      })

      if (!response.ok) {
        throw new Error('Error al guardar PIN')
      }

      // Verificar completitud del perfil
      const completion = await checkProfileCompletion(supabase, user.id)

      if (completion.isComplete) {
        // Redirigir al dashboard
        router.push('/dashboard')
      } else {
        setError(`Perfil incompleto. Campos faltantes: ${completion.missingFields.join(', ')}`)
      }

      setLoading(false)
    } catch (err: any) {
      console.error('Error saving PIN:', err)
      setError(err.message || 'Error al guardar PIN')
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: '' })
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // Solo permitir dígitos, espacios, guiones, paréntesis y +
    const cleaned = value.replace(/[^\d\s\-()+ ]/g, '')
    
    // Almacenar el valor ingresado (el usuario verá el formato que ingresa)
    setFormData({ ...formData, phone: cleaned })
    if (fieldErrors.phone) {
      setFieldErrors({ ...fieldErrors, phone: '' })
    }
  }

  if (loading && currentStep === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando formulario...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">
              Completar Perfil
            </CardTitle>
            <CardDescription>
              Paso {currentStep + 1} de {steps.length}: {steps[currentStep].title}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* PASO 1: DATOS PERSONALES */}
            {currentStep === 0 && (
              <div className="space-y-6">
               <p className="text-sm text-muted-foreground">
                  {steps[0].description}
                </p>

                {/* Nombre Completo */}
                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    Nombre Completo {profile?.full_name && ' ✓'}
                  </Label>
                  <Input
                    id="full_name"
                    placeholder="Juan García Pérez"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className={fieldErrors.full_name ? 'border-destructive' : ''}
                  />
                  {fieldErrors.full_name && (
                    <p className="text-xs text-destructive">{fieldErrors.full_name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Mínimo nombre y apellido. Ej: Juan García
                  </p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Correo Electrónico {profile?.email && ' ✓'}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    disabled={user?.email ? true : false}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={fieldErrors.email ? 'border-destructive' : ''}
                  />
                  {user?.email && (
                    <p className="text-xs text-muted-foreground">
                      Conectado como: {user.email}
                    </p>
                  )}
                  {fieldErrors.email && (
                    <p className="text-xs text-destructive">{fieldErrors.email}</p>
                  )}
                </div>

                {/* DNI/Cedula (CRÍTICO PARA ECUADOR) */}
                <div className="space-y-2">
                  <Label htmlFor="dni">
                    Cédula de Identidad (DNI) *
                  </Label>
                  <Input
                    id="dni"
                    placeholder="1234567890"
                    maxLength={10}
                    value={formData.dni}
                    onChange={(e) => handleInputChange('dni', e.target.value.replace(/\D/g, ''))}
                    className={fieldErrors.dni ? 'border-destructive' : ''}
                  />
                  {fieldErrors.dni && (
                    <p className="text-xs text-destructive">{fieldErrors.dni}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    10 dígitos. Ej: 1708123456 (Importante para identificarte en Ecuador)
                  </p>
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Teléfono *
                  </Label>
                  <Input
                    id="phone"
                    placeholder="0963881234 o +593963881234"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className={fieldErrors.phone ? 'border-destructive' : ''}
                  />
                  {formData.phone && !fieldErrors.phone && (
                    <p className="text-xs text-green-600">
                      ✓ Formateado como: {validateEcuadorianPhone(formData.phone).formatted || formData.phone}
                    </p>
                  )}
                  {fieldErrors.phone && (
                    <p className="text-xs text-destructive">{fieldErrors.phone}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Celular: 0963881234 (10 dígitos) | Fijo: 022123456 (9 dígitos con código de área)
                    <br />✓ Se formatará automáticamente como +593...
                  </p>
                </div>

                {/* Fecha de Nacimiento */}
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">
                    Fecha de Nacimiento *
                  </Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className={fieldErrors.date_of_birth ? 'border-destructive' : ''}
                  />
                  {fieldErrors.date_of_birth && (
                    <p className="text-xs text-destructive">{fieldErrors.date_of_birth}</p>
                  )}
                </div>

                {/* Provincia */}
                <div className="space-y-2">
                  <Label htmlFor="province">
                    Provincia *
                  </Label>
                  <Select value={formData.province} onValueChange={(value) => {
                    setFormData({ ...formData, province: value })
                    if (fieldErrors.province) setFieldErrors({ ...fieldErrors, province: '' })
                  }}>
                    <SelectTrigger className={fieldErrors.province ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Selecciona tu provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      {ECUADOR_PROVINCES.map(prov => (
                        <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.province && (
                    <p className="text-xs text-destructive">{fieldErrors.province}</p>
                  )}
                </div>

                {/* Geolocalización GPS (OBLIGATORIA) */}
                <div className="space-y-2">
                  <Label>
                    Ubicación GPS (Información de Dirección) *
                  </Label>
                  <GeoLocationPicker
                    onLocationSelect={handleLocationSelect}
                    initialLocation={
                      formData.latitude && formData.longitude
                        ? {
                            latitude: formData.latitude,
                            longitude: formData.longitude,
                            address: formData.address,
                            city: formData.city,
                            province: formData.province,
                            postal_code: formData.postal_code,
                            location_url: formData.location_url,
                          }
                        : undefined
                    }
                    loading={geoLoading}
                  />
                  {fieldErrors.location && (
                    <p className="text-xs text-destructive">{fieldErrors.location}</p>
                  )}
                </div>

                {/* Dirección Completa */}
                <div className="space-y-2">
                  <Label htmlFor="address">
                    Dirección Completa *
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Calle, número, edificio, piso, etc."
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={fieldErrors.address ? 'border-destructive' : ''}
                    rows={3}
                  />
                  {fieldErrors.address && (
                    <p className="text-xs text-destructive">{fieldErrors.address}</p>
                  )}
                </div>

                {/* Ciudad */}
                <div className="space-y-2">
                  <Label htmlFor="city">
                    Ciudad
                  </Label>
                  <Input
                    id="city"
                    placeholder="Quito, Calderón, Los Chillos, etc."
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Se completa automáticamente desde la geolocalización
                  </p>
                </div>

                <Button
                  onClick={savePersonalData}
                  disabled={loading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Continuar a Preguntas de Seguridad
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* PASO 2: PREGUNTAS DE SEGURIDAD */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  {steps[1].description} (Responde al menos 3)
                </p>

                <div className="space-y-4">
                  {(securityQuestions && Array.isArray(securityQuestions) ? securityQuestions : []).map((question, idx) => (
                    <div key={question.id} className="space-y-2">
                      <Label htmlFor={`question_${question.id}`}>
                        {idx + 1}. {question.question_text}
                      </Label>
                      <Input
                        id={`question_${question.id}`}
                        placeholder="Tu respuesta..."
                        value={answersData[question.id] || ''}
                        onChange={(e) =>
                          setAnswersData({
                            ...answersData,
                            [question.id]: e.target.value,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(0)}
                    disabled={loading}
                    className="flex-1"
                  >
                    Atrás
                  </Button>
                  <Button
                    onClick={saveSecurityQuestions}
                    disabled={loading}
                    className="flex-1 gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Continuar a PIN
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* PASO 3: PIN DE SEGURIDAD */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  {steps[2].description}
                </p>

                <div className="space-y-2">
                  <Label htmlFor="pin">
                    PIN (4-6 dígitos) *
                  </Label>
                  <div className="relative">
                    <Input
                      id="pin"
                      type={showPin ? 'text' : 'password'}
                      placeholder="••••"
                      maxLength={6}
                      value={securityData.pin}
                      onChange={(e) =>
                        setSecurityData({
                          ...securityData,
                          pin: e.target.value.replace(/\D/g, ''),
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Solo dígitos numéricos. Ejemplo: 123456
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin_confirm">
                    Confirmar PIN *
                  </Label>
                  <div className="relative">
                    <Input
                      id="pin_confirm"
                      type={showPinConfirm ? 'text': ' password'}
                      placeholder="••••"
                      maxLength={6}
                      value={securityData.pin_confirm}
                      onChange={(e) =>
                        setSecurityData({
                          ...securityData,
                          pin_confirm: e.target.value.replace(/\D/g, ''),
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPinConfirm(!showPinConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPinConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    disabled={loading}
                    className="flex-1"
                  >
                    Atrás
                  </Button>
                  <Button
                    onClick={saveSecurityPin}
                    disabled={loading}
                    className="flex-1 gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Finalizando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Completar y Acceder
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Indicador de Progreso */}
            <div className="mt-8 space-y-2">
              <div className="flex gap-2">
                {steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`flex-1 h-2 rounded-full transition-colors ${
                      idx < currentStep
                        ? 'bg-green-500'
                        : idx === currentStep
                          ? 'bg-primary'
                          : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Paso {currentStep + 1} de {steps.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
