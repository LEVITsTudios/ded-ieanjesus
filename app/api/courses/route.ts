import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET all courses
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  let query = supabase.from('courses').select('*')
  if (q) query = query.ilike('name', `%${q}%`)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ courses: data })
}

// CREATE course
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, code, teacher_id } = body

    // Validate required fields
    if (!name || !code || !teacher_id) {
      return NextResponse.json({ error: 'Missing required fields: name, code, teacher_id' }, { status: 400 })
    }

    // Validate teacher_id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(teacher_id)) {
      return NextResponse.json({ error: 'Invalid teacher_id format' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase.from('courses').insert([
      { name, description, code, teacher_id }
    ]).select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ course: data?.[0] }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
