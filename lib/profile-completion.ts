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
    const { data: profileArray, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .limit(1)

    const profile = profileArray?.[0] || null;

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
      .from('security_pins')
      .select('id, is_active')
      .eq('user_id', userId)
      .maybeSingle()

    const securityPinComplete = securityPin?.is_active === true

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
    email?: string
    phone?: string
    address?: string
    date_of_birth?: string
    avatar_url?: string
    grade_level?: string
    department?: string
    dni?: string
    city?: string
    province?: string
    postal_code?: string
    latitude?: number | null
    longitude?: number | null
    location_url?: string
  }
) {
  try {
    console.log('[updateProfileData] Intentando guardar datos:', data);
    
    // PASO 1: Intentar UPDATE
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[updateProfileData] ❌ Error del UPDATE:', {
        message: updateError.message,
        code: updateError.code,
        hint: updateError.hint,
      });
      throw updateError;
    }

    console.log('[updateProfileData] UPDATE result:', {
      rowsAffected: updateResult?.length || 0,
      data: updateResult
    });

    // Si UPDATE no afectó ninguna fila, significa que el registro no existe
    // Intentar INSERT en su lugar
    if (!updateResult || updateResult.length === 0) {
      console.log('[updateProfileData] ⚠️ UPDATE no afectó filas. Intentando INSERT...');
      
      const { data: insertResult, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...data,
          // Valores por defecto para campos NOT NULL si no están en data
          role: data.role || 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        // Si el error es por constraint violations (ej: phone duplicado)
        // intentar buscar y actualizar el registro existente
        if (insertError.code === '23505') {
          console.log('[updateProfileData] ⚠️ INSERT falló por constraint. Buscando registro por phone/dni...');
          
          // Intentar encontrar el perfil por phone o dni (claves únicas)
          let findQuery = supabase
            .from('profiles')
            .select('id')
            .limit(1);
          
          if (data.phone) {
            findQuery = findQuery.eq('phone', data.phone);
          } else if (data.dni) {
            findQuery = findQuery.eq('dni', data.dni);
          }
          
          const { data: existingProfile, error: findError } = await findQuery;
          
          if (!findError && existingProfile && existingProfile.length > 0) {
            const existingId = existingProfile[0].id;
            console.log('[updateProfileData] ✓ Perfil existente encontrado con ID:', existingId);
            
            // Ahora actualizar ese perfil existente
            const { error: updateExistingError } = await supabase
              .from('profiles')
              .update({
                ...data,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingId);
            
            if (updateExistingError) {
              throw updateExistingError;
            }
            
            console.log('[updateProfileData] ✓ Perfil existente actualizado exitosamente');
            return { success: true, error: null };
          }
        }
        
        console.error('[updateProfileData] ❌ Error del INSERT irrecuperable:', {
          message: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
        });
        throw insertError;
      }

      console.log('[updateProfileData] ✓ INSERT exitoso:', insertResult);
      return { success: true, error: null };
    }

    console.log('[updateProfileData] ✓ UPDATE exitoso');
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[updateProfileData] ❌ Excepción capturada:', err);
    return { success: false, error: err?.message || 'Error al actualizar perfil' };
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
    // Sin filtro por is_active para asegurar que siempre se muestren

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

    // Insertar nuevas respuestas (solo las que tienen contenido)
    const { error } = await supabase
      .from('user_security_answers')
      .insert(
        answers
          .filter(a => a.answer && a.answer.trim())
          .map((a) => ({
            user_id: userId,
            question_id: a.question_id,
            answer_hash: a.answer.trim().toLowerCase(), // Almacenar normalizado (lowercase) para comparación
          }))
      )

    if (error) throw error

    return { success: true, error: null }
  } catch (err: any) {
    console.error('Error saving security answers:', err)
    return { success: false, error: err?.message || 'Error al guardar respuestas' }
  }
}
