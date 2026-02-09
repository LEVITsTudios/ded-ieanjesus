'use client'

import React, { useEffect, useState, useMemo } from 'react'
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
  // location_url: string
interface FieldErrors {
  [key: string]: string
}

import { PinInput } from '@/components/security/PinInput';

export default function OnboardingPage() {
  // Estados para mostrar/ocultar PIN
  const [showPin, setShowPin] = useState(false);
  const [showPinConfirm, setShowPinConfirm] = useState(false);

  // Maneja la selección de ubicación desde el GeoLocationPicker
  const handleLocationSelect = (location: LocationData) => {
    setFormData((prev) => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      city: location.city,
      province: location.province,
      postal_code: location.postal_code,
      location_url: location.location_url,
    }));
    // Limpiar error de ubicación si existía
    if (fieldErrors.location) {
      setFieldErrors((prev) => ({ ...prev, location: '' }));
    }
  };

  // Guardar datos personales y avanzar al siguiente paso
  const savePersonalData = async () => {
    setError(null);
    
    // Verificar si el perfil ya está completo en la BD
    const profileComplete = profile && 
      profile.full_name?.trim() &&
      profile.dni?.trim() &&
      profile.phone?.trim() &&
      profile.date_of_birth?.trim() &&
      profile.address?.trim() &&
      profile.city?.trim() &&
      profile.province?.trim() &&
      profile.latitude &&
      profile.longitude;

    // Si el perfil está completo y no hay cambios, no es necesario re-validar
    if (profileComplete) {
      setCurrentStep(1);
      return;
    }

    // Validaciones solo para campos que falten
    const errors: FieldErrors = {};
    if (!formData.full_name.trim()) errors.full_name = 'El nombre es obligatorio';
    if (!formData.email.trim()) errors.email = 'El correo es obligatorio';
    if (!formData.dni.trim()) errors.dni = 'El DNI es obligatorio';
    if (!formData.phone.trim()) errors.phone = 'El teléfono es obligatorio';
    if (!formData.date_of_birth.trim()) errors.date_of_birth = 'La fecha de nacimiento es obligatoria';
    if (!formData.address.trim()) errors.address = 'La dirección es obligatoria';
    if (!formData.city.trim()) errors.city = 'La ciudad es obligatoria';
    if (!formData.province.trim()) errors.province = 'La provincia es obligatoria';
    if (!formData.latitude || !formData.longitude) errors.location = 'La ubicación es obligatoria';
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }
    
    setLoading(true);
    try {
      // Guardar datos en el backend (solo si hay cambios)
      const dataToUpdate = {
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        date_of_birth: formData.date_of_birth,
      };
      
      await updateProfileData(supabase, user.id, dataToUpdate);
      setCurrentStep(1);
    } catch (err: any) {
      setError('Error al guardar los datos personales.');
    } finally {
      setLoading(false);
    }
  };

  // Hooks y estados principales
  const router = useRouter();
  
  // Estado de usuario autenticado
  const [authChecked, setAuthChecked] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Crear cliente Supabase una única vez de forma segura
  const supabase = useMemo(() => {
    // Limpiar tokens inválidos del localStorage antes de crear el cliente
    // Solo ejecutar en el cliente, no en el servidor
    if (typeof window !== 'undefined') {
      try {
        const auth = localStorage.getItem('sb-liamgsolvdjxjusmtyov-auth-token');
        if (auth) {
          const parsed = JSON.parse(auth);
          // Si no hay refresh token válido, limpiar localStorage
          if (!parsed.refresh_token) {
            localStorage.removeItem('sb-liamgsolvdjxjusmtyov-auth-token');
          }
        }
      } catch (e) {
        // Si hay error parsing, limpiar
        localStorage.removeItem('sb-liamgsolvdjxjusmtyov-auth-token');
      }
    }
    return createClient();
  }, []);

  // Verificar sesión activa al cargar el componente
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!data?.session) {
          router.replace('/auth/login');
        } else {
          setSession(data.session);
          setUser({ id: data.session.user.id, email: data.session.user.email });
          
          // Verificar si el perfil ya está completo
          const completion = await checkProfileCompletion(supabase, data.session.user.id);
          if (completion.isComplete) {
            // Si está completo, redirigir directamente al dashboard
            console.log('✓ Perfil completo - Redirigiendo al dashboard');
            router.replace('/dashboard');
            return;
          }
        }
      } catch (err) {
        console.error('Error checking session:', err);
        router.replace('/auth/login');
      }
      setAuthChecked(true);
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Cargar datos del perfil cuando la sesión está lista
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!session?.user?.id || !authChecked) return;

      try {
        setLoading(true);

        // Obtener datos del usuario de la tabla profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData && !profileError) {
          setProfile(profileData);
          // Pre-llenar el formulario con datos existentes desde la BD
          setFormData((prev) => ({
            ...prev,
            full_name: profileData.full_name || '',
            email: session.user.email || '',
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
          }));
          console.log('✓ Datos del perfil cargados desde Supabase:', {
            full_name: profileData.full_name,
            dni: profileData.dni,
            phone: profileData.phone,
            address: profileData.address,
          });
        } else if (profileError && profileError.code !== 'PGRST116') {
          console.warn('Error loading profile:', profileError);
        }

        // Cargar preguntas de seguridad
        const { data: questionsData, error: questionsError } = await supabase
          .from('security_questions')
          .select('*')
          .eq('is_active', true)
          .limit(5);

        if (questionsData && !questionsError) {
          setSecurityQuestions(questionsData);

          // Cargar respuestas existentes desde user_security_answers (incluir el valor de la respuesta)
          const { data: answersData, error: answersError } = await supabase
            .from('user_security_answers')
            .select('question_id, answer_hash')
            .eq('user_id', session.user.id);

          if (answersData && !answersError && answersData.length > 0) {
            const answersMap: Record<string, string> = {};
            // Cargar respuestas anteriores con prefijo especial para identificarlas
            answersData.forEach((ans: any) => {
              if (ans.answer_hash) {
                // Guardar con prefijo [ANTERIOR]: para mantener el valor pero identificar que es cargada
                answersMap[ans.question_id] = `[ANTERIOR]:${ans.answer_hash}`;
              }
            });
            setAnswersData(answersMap);
            console.log('✓ Respuestas de seguridad cargadas:', answersData.length + ' total');
          }
        }

        // Cargar PIN existente desde security_pins
        const { data: pinData, error: pinError } = await supabase
          .from('security_pins')
          .select('pin_hash, is_active')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .single();

        if (pinData && !pinError) {
          // PIN ya existe
          console.log('✓ PIN de seguridad encontrado');
          setHasExistingPin(true);
        } else if (pinError && pinError.code !== 'PGRST116') {
          console.warn('Error loading PIN:', pinError);
        }
      } catch (err: any) {
        console.error('Error loading user profile:', err);
        setError('Error al cargar el perfil. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, authChecked]);

  // Paso actual del formulario
  const [currentStep, setCurrentStep] = useState(0);
  // Datos del formulario principal
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: session?.user?.email || '', // Pre-llenar desde sesión
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
  });
  // Errores de campos
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // Estado de carga general
  const [loading, setLoading] = useState(false);
  // Error general
  const [error, setError] = useState<string | null>(null);
  // Validación de DNI
  const [dniValidation, setDniValidation] = useState({ valid: false, message: '', isDuplicate: false });
  // Validación de teléfono
  const [phoneValidation, setPhoneValidation] = useState({ valid: false, message: '', isDuplicate: false, formatted: '' });
  // Estado de comprobación de duplicados
  const [checkingDuplicate, setCheckingDuplicate] = useState<string | null>(null);
  // Preguntas de seguridad
  const [securityQuestions, setSecurityQuestions] = useState<any[]>([]);
  // Respuestas a preguntas de seguridad
  const [answersData, setAnswersData] = useState<Record<string, string>>({});
  // Estado de seguridad (PIN)
  const [securityData, setSecurityData] = useState({ pin: '', pin_confirm: '' });
  const [hasExistingPin, setHasExistingPin] = useState(false);
  // Estado de perfil simulado (puedes ajustar según tu lógica real)
  const [profile, setProfile] = useState<any>(null);
  // Estado de usuario simulado (puedes ajustar según tu lógica real)
  const [user, setUser] = useState<any>(() => {
    // Intentar obtener user ID desde session si existe
    return { id: session?.user?.id || '', email: session?.user?.email || '' };
  });
  // Estado de geolocalización
  const [geoLoading, setGeoLoading] = useState(false);
  // Estado de índice de pregunta de seguridad actual
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Pasos del formulario (puedes ajustar según tu lógica real)
  const steps = [
    { id: 1, title: 'Datos Personales', description: 'Completa tus datos personales para continuar.' },
    { id: 2, title: 'Preguntas de Seguridad', description: 'Responde al menos 3 preguntas de seguridad.' },
    { id: 3, title: 'PIN de Seguridad', description: 'Configura un PIN de seguridad para tu cuenta.' },
  ];

  const saveSecurityQuestions = async () => {
    // Validar que haya al menos 3 preguntas respondidas
    const answeredCount = Object.values(answersData).filter(a => 
      a && a.trim()
    ).length

    // Si hay preguntas, validar que responda al menos 3
    if (securityQuestions.length > 0 && answeredCount < 3) {
      setError(`Debes responder al menos 3 preguntas de seguridad (${answeredCount}/3)`)
      return
    }

    // Si no hay preguntas cargadas, permite avanzar
    if (securityQuestions.length === 0) {
      setCurrentStep(2)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Convertir answersData de Record a Array, filtrando respuestas válidas
      // Quitar el prefijo [ANTERIOR]: si lo tiene
      const answersArray = Object.entries(answersData)
        .filter(([_, answer]) => answer && answer.trim())
        .map(([question_id, answer]) => ({
          question_id,
          answer: answer.startsWith('[ANTERIOR]:') ? answer.replace('[ANTERIOR]:', '') : answer,
        }))

      if (answersArray.length === 0) {
        setError('Debes responder al menos 3 preguntas de seguridad')
        return
      }

      await saveSecurityAnswers(supabase, user.id, answersArray)

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
        body: JSON.stringify({ 
          pin: securityData.pin,
          userId: user.id, // Enviar el user ID desde el cliente
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Error del servidor (${response.status})`
        console.error('API Error:', { status: response.status, errorData })
        throw new Error(errorMessage)
      }

      const responseData = await response.json()
      console.log('PIN guardado exitosamente:', responseData)

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

    // Validación en tiempo real para DNI
    if (field === 'dni') {
      validateDniRealtime(value)
    }
  }

  const validateDniRealtime = async (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    
    // Si está vacío, limpiar validación
    if (!cleaned) {
      setDniValidation({ valid: false, message: '', isDuplicate: false })
      return
    }

    // Validar formato
    const validation = validateEcuadorianDNI(cleaned)
    if (!validation.valid) {
      setDniValidation({ valid: false, message: validation.message, isDuplicate: false })
      return
    }

    // Verificar duplicado
    try {
      setCheckingDuplicate('dni')
      const response = await fetch(`/api/check-duplicates?dni=${cleaned}&currentUserId=${user?.id || ''}`)
      const result = await response.json()
      
      if (result.exists) {
        setDniValidation({ valid: false, message: result.message, isDuplicate: true })
      } else {
        setDniValidation({ valid: true, message: '✓ DNI válido y disponible', isDuplicate: false })
      }
    } catch (error) {
      console.error('Error checking DNI duplicate:', error)
      setDniValidation({ valid: true, message: '✓ DNI válido', isDuplicate: false })
    } finally {
      setCheckingDuplicate(null)
    }
  }

  const validatePhoneRealtime = async (value: string) => {
    if (!value) {
      setPhoneValidation({ valid: false, message: '', isDuplicate: false, formatted: '' })
      return
    }

    const validation = validateEcuadorianPhone(value)
    if (!validation.valid) {
      setPhoneValidation({ valid: false, message: validation.message, isDuplicate: false, formatted: '' })
      return
    }

    // Verificar duplicado
    try {
      setCheckingDuplicate('phone')
      const formattedPhone = validation.formatted ? validation.formatted.replace(/\s/g, '') : value;
      const response = await fetch(`/api/check-duplicates?phone=${encodeURIComponent(formattedPhone)}&currentUserId=${user?.id || ''}`)
      const result = await response.json();
      if (result.exists) {
        setPhoneValidation({ 
          valid: false, 
          message: result.message, 
          isDuplicate: true,
          formatted: validation.formatted || ''
        });
      } else {
        setPhoneValidation({ 
          valid: true, 
          message: `✓ Teléfono válido (${validation.message.includes('celular') ? 'celular' : 'fijo'})`,
          isDuplicate: false,
          formatted: validation.formatted || ''
        });
      }
    } catch (error) {
      console.error('Error checking phone duplicate:', error);
      setPhoneValidation({ 
        valid: true, 
        message: validation.message, 
        isDuplicate: false,
        formatted: validation.formatted || ''
      });
    } finally {
      setCheckingDuplicate(null)
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

    // Validación en tiempo real para teléfono
    validatePhoneRealtime(cleaned)
  }

  if (!authChecked || (loading && currentStep === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando formulario...</p>
          </CardContent>
        </Card>
      </div>
    );
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

                {/* Resumen de campos completados */}
                {profile && (
                  <Alert className={profile.full_name && profile.dni && profile.phone && profile.date_of_birth && profile.address && profile.city && profile.province && profile.latitude && profile.longitude 
                    ? "bg-green-50 border-green-200" 
                    : "bg-blue-50 border-blue-200"}>
                    <AlertCircle className={profile.full_name && profile.dni && profile.phone && profile.date_of_birth && profile.address && profile.city && profile.province && profile.latitude && profile.longitude 
                      ? "h-4 w-4 text-green-600" 
                      : "h-4 w-4 text-blue-600"} />
                    <AlertDescription className={profile.full_name && profile.dni && profile.phone && profile.date_of_birth && profile.address && profile.city && profile.province && profile.latitude && profile.longitude 
                      ? "text-green-800" 
                      : "text-blue-800"}>
                      {profile.full_name && profile.dni && profile.phone && profile.date_of_birth && profile.address && profile.city && profile.province && profile.latitude && profile.longitude ? (
                        <><strong>✓ Perfil Completo:</strong> Todos tus datos están guardados. Puedes continuar al siguiente paso.</>
                      ) : (
                        <>
                          <strong>ℹ Información guardada en tu perfil:</strong>
                          <div className="mt-1 text-xs space-y-1">
                            <div className="flex flex-wrap gap-2">
                              {profile.full_name && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">✓ Nombre</span>}
                              {profile.dni && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">✓ DNI</span>}
                              {profile.phone && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">✓ Teléfono</span>}
                              {profile.date_of_birth && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">✓ Fecha de Nac.</span>}
                              {profile.address && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">✓ Dirección</span>}
                              {profile.city && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">✓ Ciudad</span>}
                              {profile.province && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">✓ Provincia</span>}
                              {profile.latitude && profile.longitude && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">✓ GPS</span>}
                            </div>
                          </div>
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

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
                    Cédula de Identidad (DNI) {dniValidation.valid && '✓'} *
                  </Label>
                  <div className="relative">
                    <Input
                      id="dni"
                      placeholder="1234567890"
                      maxLength={10}
                      value={formData.dni}
                      onChange={(e) => handleInputChange('dni', e.target.value.replace(/\D/g, ''))}
                      className={
                        fieldErrors.dni 
                          ? 'border-destructive' 
                          : dniValidation.valid 
                            ? 'border-green-500' 
                            : formData.dni && !dniValidation.valid
                              ? 'border-destructive'
                              : ''
                      }
                      disabled={checkingDuplicate === 'dni'}
                    />
                    {checkingDuplicate === 'dni' && (
                      <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Mostrar validación en tiempo real */}
                  {formData.dni && (
                    <>
                      {dniValidation.valid ? (
                        <p className="text-xs text-green-600 font-semibold">{dniValidation.message}</p>
                      ) : (
                        <p className="text-xs text-destructive font-semibold">
                          {dniValidation.message}
                        </p>
                      )}
                    </>
                  )}
                  
                  {/* Mostrar error del formulario si existe */}
                  {fieldErrors.dni && !formData.dni && (
                    <p className="text-xs text-destructive">{fieldErrors.dni}</p>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    10 dígitos. Ej: 1708123456 (Importante para identificarte en Ecuador)
                  </p>
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Teléfono {phoneValidation.valid && '✓'} *
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      placeholder="0963881234 o +593963881234"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className={
                        fieldErrors.phone 
                          ? 'border-destructive' 
                          : phoneValidation.valid 
                            ? 'border-green-500' 
                            : formData.phone && !phoneValidation.valid
                              ? 'border-destructive'
                              : ''
                      }
                      disabled={checkingDuplicate === 'phone'}
                    />
                    {checkingDuplicate === 'phone' && (
                      <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* Mostrar validación en tiempo real */}
                  {formData.phone && (
                    <>
                      {phoneValidation.valid ? (
                        <>
                          <p className="text-xs text-green-600 font-semibold">{phoneValidation.message}</p>
                          {phoneValidation.formatted && (
                            <p className="text-xs text-green-600">
                              Formato: {phoneValidation.formatted}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-destructive font-semibold">{phoneValidation.message}</p>
                      )}
                    </>
                  )}
                  
                  {/* Mostrar error del formulario si existe */}
                  {fieldErrors.phone && !formData.phone && (
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
                  ) : profile && 
                      profile.full_name?.trim() &&
                      profile.dni?.trim() &&
                      profile.phone?.trim() &&
                      profile.date_of_birth?.trim() &&
                      profile.address?.trim() &&
                      profile.city?.trim() &&
                      profile.province?.trim() &&
                      profile.latitude &&
                      profile.longitude ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Datos Completos - Continuar →
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
                {securityQuestions.length === 0 ? (
                  // Si no hay preguntas
                  <Alert variant="default" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No hay preguntas de seguridad disponibles. Puedes continuar al siguiente paso.</AlertDescription>
                  </Alert>
                ) : (
                  // Si hay preguntas, mostrar una a la vez
                  <>
                    {/* Alertas informativas */}
                {profile && Object.values(answersData).filter(a => a && a.trim()).length >= 3 && (
                  <Alert className="bg-green-50 border-green-200 mb-4">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>✓ Completado:</strong> Ya tienes {Object.values(answersData).filter(a => a && a.trim()).length} respuestas guardadas. Puedes continuar cuando estés listo.
                    </AlertDescription>
                  </Alert>
                )}

                    {/* Contador y progreso */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">
                          Pregunta {currentQuestionIndex + 1} de {securityQuestions.length}
                        </p>
                        <p className="text-sm font-bold text-primary">
                          Respondidas: {
                            Object.values(answersData).filter(a => 
                              a && a.trim()
                            ).length
                          }/{Math.min(securityQuestions.length, 3)}
                        </p>
                      </div>
                      
                      {/* Barra de progreso visual */}
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, ((currentQuestionIndex + 1) / securityQuestions.length) * 100)}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Pregunta actual */}
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-lg font-semibold text-foreground flex-1">
                          {securityQuestions[currentQuestionIndex].question_text}
                        </p>
                        {(() => {
                          const ansValue = answersData[securityQuestions[currentQuestionIndex].id] || '';
                          const isAnterior = ansValue.startsWith('[ANTERIOR]:');
                          const hasNewResponse = ansValue && !isAnterior;
                          
                          return (
                            <>
                              {hasNewResponse && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded whitespace-nowrap">
                                  ✓ Respondida (nuevo)
                                </span>
                              )}
                              {isAnterior && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded whitespace-nowrap">
                                  ✓ Respondida (anterior)
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Input para respuesta */}
                    <div className="space-y-2">
                      <Label htmlFor="current_answer">
                        Tu respuesta *
                      </Label>
                      {(() => {
                        const ansValue = answersData[securityQuestions[currentQuestionIndex].id] || '';
                        const isAnterior = ansValue.startsWith('[ANTERIOR]:');
                        const displayValue = isAnterior ? ansValue.replace('[ANTERIOR]:', '') : ansValue;
                        
                        return (
                          <>
                            <Input
                              id="current_answer"
                              placeholder={
                                isAnterior
                                  ? 'Edita tu respuesta anterior o escribe una nueva...'
                                  : 'Escribe tu respuesta...'
                              }
                              value={displayValue}
                              onChange={(e) =>
                                setAnswersData({
                                  ...answersData,
                                  [securityQuestions[currentQuestionIndex].id]: e.target.value,
                                })
                              }
                              className="text-base"
                            />
                            <p className="text-xs text-muted-foreground">
                              {displayValue?.trim()
                                ? `✓ ${displayValue.length} caracteres ${isAnterior ? '(anterior cargado)' : '(nuevo)'}` 
                                : 'Sin respuesta'}
                            </p>
                          </>
                        );
                      })()}
                    </div>

                    {/* Navegación entre preguntas */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="flex-1"
                      >
                        ← Anterior
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex(Math.min(securityQuestions.length - 1, currentQuestionIndex + 1))}
                        disabled={currentQuestionIndex === securityQuestions.length - 1}
                        className="flex-1"
                      >
                        Siguiente →
                      </Button>
                    </div>

                    {/* Selector rápido de preguntas con indicadores */}
                    {securityQuestions.length > 3 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Navegar rápido:</p>
                        <div className="flex flex-wrap gap-2">
                          {securityQuestions.map((q, idx) => {
                            const answerValue = answersData[q.id] || '';
                            const isAnterior = answerValue.startsWith('[ANTERIOR]:');
                            const hasNewAnswer = answerValue && answerValue.trim() && !isAnterior;
                            const hasOldAnswer = isAnterior;
                            return (
                              <Button
                                key={q.id}
                                size="sm"
                                variant={
                                  currentQuestionIndex === idx 
                                    ? 'default' 
                                    : hasNewAnswer 
                                      ? 'secondary' 
                                      : 'outline'
                                }
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className="w-10 h-10 p-0 relative"
                                title={
                                  hasNewAnswer 
                                    ? 'Nueva respuesta' 
                                    : hasOldAnswer 
                                      ? 'Respondida anteriormente'
                                      : 'No respondida'
                                }
                              >
                                {idx + 1}
                                {hasNewAnswer && <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></span>}
                                {hasOldAnswer && <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></span>}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Resumen de respuestas */}
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Resumen:</p>
                      <ul className="text-xs space-y-1">
                        {securityQuestions.map((q, idx) => {
                          const answerValue = answersData[q.id] || '';
                          const isAnterior = answerValue.startsWith('[ANTERIOR]:');
                          const hasNewAnswer = answerValue && answerValue.trim() && !isAnterior;
                          const hasOldAnswer = isAnterior;
                          return (
                            <li key={q.id} className="flex items-center gap-2">
                              {hasNewAnswer ? (
                                <span className="text-green-600">✓</span>
                              ) : hasOldAnswer ? (
                                <span className="text-blue-600">✓</span>
                              ) : (
                                <span className="text-muted-foreground">○</span>
                              )}
                              <span className="text-muted-foreground">
                                P{idx + 1}: {
                                  hasNewAnswer 
                                    ? 'Nueva respuesta' 
                                    : hasOldAnswer 
                                      ? 'Respondida (anterior)' 
                                      : 'Sin responder'
                                }
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </>
                )}

                {/* Botones principales */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(0)}
                    disabled={loading}
                    className="flex-1"
                  >
                    ← Atrás
                  </Button>
                  <Button
                    onClick={saveSecurityQuestions}
                    disabled={
                      loading || (
                        securityQuestions.length > 0 && 
                        Object.values(answersData).filter(a => 
                          a && a.trim()
                        ).length < 3
                      )
                    }
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
                        Continuar a PIN →
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* PASO 3: PIN DE SEGURIDAD */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <p className="text-base text-muted-foreground font-medium">
                  {steps[2].description}
                </p>

                {/* Alerta si PIN ya existe */}
                {hasExistingPin && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>ℹ PIN existente:</strong> Ya tienes un PIN de seguridad registrado. Puedes establecer uno nuevo para reemplazarlo.
                    </AlertDescription>
                  </Alert>
                )}

                {/* PIN avanzado: casillas separadas */}
                <div className="space-y-2">
                  <Label htmlFor="pin" className="font-semibold text-lg">
                    PIN de Seguridad (4-6 dígitos) *
                  </Label>
                  <PinInput
                    length={6}
                    value={securityData.pin}
                    onChange={(val: string) => setSecurityData({ ...securityData, pin: val.replace(/\D/g, '') })}
                    isPassword={!showPin}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      {showPin ? <EyeOff className="w-4 h-4 inline" /> : <Eye className="w-4 h-4 inline" />} {showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                    </button>
                    <span className="text-xs text-muted-foreground">Solo dígitos numéricos</span>
                  </div>
                </div>

                {/* Confirmar PIN avanzado */}
                <div className="space-y-2">
                  <Label htmlFor="pin_confirm" className="font-semibold text-lg">
                    Confirmar PIN *
                  </Label>
                  <PinInput
                    length={6}
                    value={securityData.pin_confirm}
                    onChange={(val: string) => setSecurityData({ ...securityData, pin_confirm: val.replace(/\D/g, '') })}
                    isPassword={!showPinConfirm}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowPinConfirm(!showPinConfirm)}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      {showPinConfirm ? <EyeOff className="w-4 h-4 inline" /> : <Eye className="w-4 h-4 inline" />} {showPinConfirm ? 'Ocultar PIN' : 'Mostrar PIN'}
                    </button>
                  </div>
                </div>

                {/* Feedback visual de coincidencia */}
                <div className="flex items-center gap-2">
                  {securityData.pin && securityData.pin_confirm && (
                    securityData.pin === securityData.pin_confirm ? (
                      <span className="text-green-600 text-sm font-semibold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> PINs coinciden</span>
                    ) : (
                      <span className="text-destructive text-sm font-semibold flex items-center gap-1"><AlertCircle className="w-4 h-4" /> PINs no coinciden</span>
                    )
                  )}
                </div>

                <div className="flex gap-2 pt-2">
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
