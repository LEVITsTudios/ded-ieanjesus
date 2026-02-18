import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  let query = supabase.from('announcements').select('*')
  if (q) query = query.ilike('title', `%${q}%`)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ announcements: data })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, content, course_id } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json({ error: 'Missing required fields: title, content' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userRole = user.user_metadata?.role

    // Only admin or teachers can create announcements
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Only admins and teachers can create announcements' }, { status: 403 })
    }

    // If teacher, verify they own the course (if course_id is provided)
    if (userRole === 'teacher' && course_id) {
      const { data: courseData } = await supabase
        .from('courses')
        .select('teacher_id')
        .eq('id', course_id)
        .single()

      if (!courseData || courseData.teacher_id !== user.id) {
        return NextResponse.json({ error: 'Teachers can only create announcements for their own courses' }, { status: 403 })
      }
    }

    const { data, error } = await supabase.from('announcements').insert([
      { title, content, course_id, author_id: user.id }
    ]).select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ announcement: data?.[0] }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
