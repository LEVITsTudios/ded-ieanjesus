/**
 * Verificador de completado de perfil de usuario
 * Valida que un usuario tenga todos los datos obligatorios antes de acceder al dashboard
 */

import { validateEcuadorianDNI } from './validators'

interface ProfileCompletionStatus {
  isComplete: boolean
  missingFields: string[]
  personalDataComplete: boolean
  securityPinComplete: boolean
  securityQuestionsComplete: boolean
  profile?: any
}

/**
 * Verifica si el perfil de un usuario está completo
 */
export async function checkProfileCompletion(
  supabase: any,
  userId: string
): Promise<ProfileCompletionStatus> {
  try {
    const missingFields: string[] = []

    // 1. Verificar datos personales en profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, address, date_of_birth, dni, latitude, longitude, role')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return {
        isComplete: false,
        missingFields: ['Perfil no encontrado'],
        personalDataComplete: false,
        securityPinComplete: false,
        securityQuestionsComplete: false,
      }
    }

    // Validar datos personales obligatorios (ADAPTADOS A ECUADOR)
    const personalDataComplete =
      profile.full_name &&
      profile.email &&
      profile.phone &&
      profile.address &&
      profile.date_of_birth &&
      profile.dni &&
      profile.latitude &&
      profile.longitude

    if (!profile.full_name) missingFields.push('Nombre completo')
    if (!profile.phone) missingFields.push('Teléfono')
    if (!profile.address) missingFields.push('Dirección')
    if (!profile.date_of_birth) missingFields.push('Fecha de nacimiento')
    if (!profile.dni) missingFields.push('Cédula de Identidad')
    if (!profile.latitude || !profile.longitude) missingFields.push('Ubicación GPS')

    // Validar DNI si está presente
    if (profile.dni) {
      const dniValidation = validateEcuadorianDNI(profile.dni)
      if (!dniValidation.valid) {
        missingFields.push(`DNI inválido: ${dniValidation.message}`)
      }
    }

    // 2. Verificar PIN de seguridad
    const { data: securityPin, error: pinError } = await supabase
      .from('user_security_pins')
      .select('id, is_enabled')
      .eq('user_id', userId)
      .single()

    const securityPinComplete = securityPin?.is_enabled === true

    if (!securityPinComplete) {
      missingFields.push('PIN de seguridad')
    }

    // 3. Verificar preguntas de seguridad (mínimo 3)
    const { data: securityAnswers, error: answersError } = await supabase
      .from('user_security_answers')
      .select('id')
      .eq('user_id', userId)

    const securityQuestionsComplete = (securityAnswers?.length || 0) >= 3

    if (!securityQuestionsComplete) {
      const answered = securityAnswers?.length || 0
      missingFields.push(`Preguntas de seguridad (${answered}/3 respondidas)`)
    }

    const isComplete =
      personalDataComplete && securityPinComplete && securityQuestionsComplete

    return {
      isComplete,
      missingFields,
      personalDataComplete,
      securityPinComplete,
      securityQuestionsComplete,
      profile,
    }
  } catch (err) {
    console.error('Error checking profile completion:', err)
    return {
      isComplete: false,
      missingFields: ['Error al verificar perfil'],
      personalDataComplete: false,
      securityPinComplete: false,
      securityQuestionsComplete: false,
    }
  }
}

/**
 * Actualiza datos personales del perfil
 */
export async function updateProfileData(
  supabase: any,
  userId: string,
  data: {
    full_name?: string
    phone?: string
    address?: string
    date_of_birth?: string
    avatar_url?: string
    grade_level?: string
    department?: string
  }
) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw error

    return { success: true, error: null }
  } catch (err: any) {
    console.error('Error updating profile data:', err)
    return { success: false, error: err?.message || 'Error al actualizar perfil' }
  }
}

/**
 * Obtiene las preguntas de seguridad disponibles
 */
export async function getSecurityQuestions(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('security_questions')
      .select('id, question_text')
      .eq('is_active', true)

    if (error) throw error

    return { success: true, data: data || [], error: null }
  } catch (err: any) {
    console.error('Error fetching security questions:', err)
    return {
      success: false,
      data: [],
      error: err?.message || 'Error al obtener preguntas',
    }
  }
}

/**
 * Guarda las respuestas de seguridad del usuario
 */
export async function saveSecurityAnswers(
  supabase: any,
  userId: string,
  answers: Array<{ question_id: string; answer: string }>
) {
  try {
    // Eliminar respuestas anteriores
    await supabase
      .from('user_security_answers')
      .delete()
      .eq('user_id', userId)

    // Insertar nuevas respuestas
    const { error } = await supabase
      .from('user_security_answers')
      .insert(
        answers.map((a) => ({
          user_id: userId,
          question_id: a.question_id,
          answer_hash: a.answer, // En producción, hashear esto
        }))
      )

    if (error) throw error

    return { success: true, error: null }
  } catch (err: any) {
    console.error('Error saving security answers:', err)
    return { success: false, error: err?.message || 'Error al guardar respuestas' }
  }
}
