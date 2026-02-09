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

// Función para hashear PIN - DEBE coincidir con hooks/use-security.ts
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
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

    // Hash del PIN usando SHA-256 (debe coincidir con hooks/use-security.ts)
    const pin_hash = await hashPin(pin)
    
    console.log('[PIN API] PIN hashed successfully')
    console.log('[PIN API] PIN hash (first 20 chars):', pin_hash.substring(0, 20) + '...')
    console.log('[PIN API] PIN hash length:', pin_hash.length, '(should be 64)')

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

    // Usar upsert para que la operación sea idempotente y evitar condiciones de carrera.
    // Se asume que existe una constraint UNIQUE en `user_id` en la tabla `security_pins`.
    console.log('[PIN API] Upserting PIN for user:', userId)
    const { data, error } = await supabase
      .from('security_pins')
      .upsert(
        {
          user_id: userId,
          pin_hash,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id', returning: 'representation' }
      )
      .select()

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
