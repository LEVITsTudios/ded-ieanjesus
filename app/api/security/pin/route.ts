import { NextResponse } from 'next/server'
import { createSafeClient, getSafeUser } from '@/lib/supabase/safe-client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pin } = body

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

    const supabase = await createSafeClient()
    const user = await getSafeUser(supabase)

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Usar bcrypt o PBKDF2 en producción - por ahora hasheamos simple
    const pin_hash = Buffer.from(pin).toString('base64')

    // Upsert el PIN del usuario
    const { error } = await supabase
      .from('user_security_pins')
      .upsert(
        {
          user_id: user.id,
          pin_hash,
          is_enabled: true,
          failed_attempts: 0,
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('Error saving PIN:', error)
      return NextResponse.json(
        { error: 'Error al guardar PIN' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'PIN guardado correctamente',
    })
  } catch (err) {
    console.error('POST /api/security/pin error:', err)
    return NextResponse.json(
      { error: 'Error al procesar solicitud' },
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
      .from('user_security_pins')
      .select('id, is_enabled, created_at, updated_at')
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
      has_pin: !!data?.is_enabled,
      pin_enabled: data?.is_enabled || false,
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
