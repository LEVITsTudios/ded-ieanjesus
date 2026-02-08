import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createSafeClient, getSafeUser } from '@/lib/supabase/safe-client'

async function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }
  
  // Si no hay service key, logear warning y lanzar error
  if (!serviceKey || serviceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
    console.warn('[PIN API] SUPABASE_SERVICE_ROLE_KEY not configured correctly')
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada. Añádela a .env.local')
  }
  
  return createServerClient(url, serviceKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}

export async function POST(request: Request) {
  try {
    console.log('[PIN API] POST request started')
    
    const body = await request.json()
    const { pin, userId } = body

    if (!pin || pin.length < 4 || pin.length > 6) {
      return NextResponse.json(
        { error: 'PIN debe tener 4-6 dígitos' },
        { status: 400 }
      )
    }

    // Verificar que solo contiene dígitos
    if (!/^\d+$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN solo debe contener dígitos' },
        { status: 400 }
      )
    }

    if (!userId) {
      console.error('[PIN API] No userId provided')
      return NextResponse.json(
        { error: 'Usuario no identificado' },
        { status: 400 }
      )
    }

    // Usar bcrypt o PBKDF2 en producción - por ahora hasheamos simple
    const pin_hash = Buffer.from(pin).toString('base64')

    console.log('[PIN API] Saving PIN for user:', userId)

    // Usar admin client para bypass RLS
    let supabase
    try {
      console.log('[PIN API] Creating admin client...')
      supabase = await createAdminClient()
      console.log('[PIN API] Admin client created successfully')
    } catch (adminErr) {
      console.error('[PIN API] Admin client creation failed:', adminErr)
      throw adminErr
    }

    // Primero verificar si ya existe un PIN para este usuario
    console.log('[PIN API] Checking if PIN already exists for user:', userId)
    const { data: existingPin, error: checkError } = await supabase
      .from('security_pins')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[PIN API] Error checking existing PIN:', checkError)
      throw checkError
    }

    let result
    if (existingPin) {
      // Si existe, hacer UPDATE
      console.log('[PIN API] PIN exists, updating...')
      result = await supabase
        .from('security_pins')
        .update({
          pin_hash,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
    } else {
      // Si no existe, hacer INSERT
      console.log('[PIN API] PIN does not exist, creating new...')
      result = await supabase
        .from('security_pins')
        .insert({
          user_id: userId,
          pin_hash,
          is_active: true,
        })
        .select()
    }

    const { data, error } = result

    if (error) {
      console.error('[PIN API] Supabase operation error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status: error.status,
      })
      return NextResponse.json(
        { error: 'Error al guardar PIN', details: error.message },
        { status: 500 }
      )
    }

    console.log('[PIN API] PIN saved successfully for user:', userId, 'Data:', data)

    return NextResponse.json({
      success: true,
      message: 'PIN guardado correctamente',
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    const errorStack = err instanceof Error ? err.stack : ''
    
    console.error('[PIN API] POST error:', {
      message: errorMsg,
      stack: errorStack,
      fullError: String(err),
    })
    return NextResponse.json(
      { error: 'Error al procesar solicitud', details: errorMsg },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createSafeClient()
    const user = await getSafeUser(supabase)

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('security_pins')
      .select('id, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching PIN status:', error)
      return NextResponse.json(
        { error: 'Error al obtener estado del PIN' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      has_pin: !!data?.is_active,
      pin_enabled: data?.is_active || false,
      created_at: data?.created_at,
      updated_at: data?.updated_at,
    })
  } catch (err) {
    console.error('GET /api/security/pin error:', err)
    return NextResponse.json(
      { error: 'Error al procesar solicitud' },
      { status: 500 }
    )
  }
}
