import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('grades').select('*').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ grade: data })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userRole = user.user_metadata?.role

    // Get the grade to find which course it belongs to
    const { data: gradeData } = await supabase
      .from('grades')
      .select('course_id')
      .eq('id', params.id)
      .single()

    if (!gradeData) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 })
    }

    // Check permissions
    if (userRole === 'admin') {
      // Admins can update any grade
    } else if (userRole === 'teacher') {
      // Teachers can only update grades in their own courses
      const { data: courseData } = await supabase
        .from('courses')
        .select('teacher_id')
        .eq('id', gradeData.course_id)
        .single()

      if (!courseData || courseData.teacher_id !== user.id) {
        return NextResponse.json({ error: 'Teachers can only update grades in their own courses' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase.from('grades').update(body).eq('id', params.id).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ grade: data?.[0] })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const userRole = user.user_metadata?.role

  // Get the grade to find which course it belongs to
  const { data: gradeData } = await supabase
    .from('grades')
    .select('course_id')
    .eq('id', params.id)
    .single()

  if (!gradeData) {
    return NextResponse.json({ error: 'Grade not found' }, { status: 404 })
  }

  // Check permissions
  if (userRole === 'admin') {
    // Admins can delete any grade
  } else if (userRole === 'teacher') {
    // Teachers can only delete grades in their own courses
    const { data: courseData } = await supabase
      .from('courses')
      .select('teacher_id')
      .eq('id', gradeData.course_id)
      .single()

    if (!courseData || courseData.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Teachers can only delete grades in their own courses' }, { status: 403 })
    }
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('grades').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
