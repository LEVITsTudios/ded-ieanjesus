import { createSafeClient } from '@/lib/supabase/safe-client'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Verifica si un DNI, teléfono o email ya existe en la base de datos
 * GET /api/check-duplicates?dni=1234567890
 * GET /api/check-duplicates?phone=0963881234
 * GET /api/check-duplicates?email=user@email.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dni = searchParams.get('dni')
    const phone = searchParams.get('phone')
    const email = searchParams.get('email')
    const currentUserId = searchParams.get('currentUserId')

    if (!dni && !phone && !email) {
      return NextResponse.json(
        { error: 'Debes proporcionar dni, phone o email' },
        { status: 400 }
      )
    }

    const supabase = await createSafeClient()

    // Verificar DNI
    if (dni) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, dni')
        .eq('dni', dni)
        .maybeSingle()

      if (error) {
        console.error('Error checking DNI:', error)
        return NextResponse.json({ error: 'Error al verificar DNI' }, { status: 500 })
      }

      if (data) {
        if (currentUserId && data.id === currentUserId) {
          return NextResponse.json({ exists: false, message: 'Tu DNI actual' })
        }
        return NextResponse.json({
          exists: true,
          message: 'Este DNI ya está registrado',
          duplicateOf: data.full_name,
        })
      }

      return NextResponse.json({ exists: false, message: 'DNI disponible' })
    }

    // Verificar Teléfono
    if (phone) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('phone', phone)
        .maybeSingle()

      if (error) {
        console.error('Error checking phone:', error)
        return NextResponse.json({ error: 'Error al verificar teléfono' }, { status: 500 })
      }

      if (data) {
        if (currentUserId && data.id === currentUserId) {
          return NextResponse.json({ exists: false, message: 'Tu teléfono actual' })
        }
        return NextResponse.json({
          exists: true,
          message: 'Este teléfono ya está registrado',
          duplicateOf: data.full_name,
        })
      }

      return NextResponse.json({ exists: false, message: 'Teléfono disponible' })
    }

    // Verificar Email
    if (email) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', email.toLowerCase())
        .maybeSingle()

      if (error) {
        console.error('Error checking email:', error)
        return NextResponse.json({ error: 'Error al verificar email' }, { status: 500 })
      }

      if (data) {
        if (currentUserId && data.id === currentUserId) {
          return NextResponse.json({ exists: false, message: 'Tu email actual' })
        }
        return NextResponse.json({
          exists: true,
          message: 'Este email ya está registrado',
          duplicateOf: data.full_name,
        })
      }

      return NextResponse.json({ exists: false, message: 'Email disponible' })
    }

    return NextResponse.json(
      { error: 'No se procesó la solicitud' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in check-duplicates:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
