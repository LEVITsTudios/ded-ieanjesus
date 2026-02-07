import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Only admin or teacher can list users
  const role = user.user_metadata?.role
  if (role !== 'admin' && role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || undefined

  let query = supabase.from('profiles').select('*')
  if (q) {
    query = query.ilike('full_name', `%${q}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ users: data })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, full_name, role, phone } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (user.user_metadata?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (!email || !full_name) {
      return NextResponse.json({ error: 'Email and full_name are required' }, { status: 400 })
    }

    // Only insert into profiles table (DNI is stored in student_profiles, not profiles)
    const { data, error } = await supabase.from('profiles').insert([
      {
        email,
        full_name,
        role: role || 'student',
        phone: phone || null,
      }
    ]).select()

    if (error) {
      console.error('Error creating user profile:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: data?.[0] }, { status: 201 })
  } catch (e: any) {
    console.error('Error in POST /api/users:', e)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
