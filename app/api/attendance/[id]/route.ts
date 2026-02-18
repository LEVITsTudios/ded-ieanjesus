import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET single attendance record
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attendances')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json({ attendance: data })
}

// UPDATE attendance record
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, notes } = body

    // Validate status if provided
    if (status) {
      const validStatuses = ['present', 'absent', 'late', 'excused']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userRole = user.user_metadata?.role

    // Only admin or teachers can update attendance
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json(
        { error: 'Only admins and teachers can update attendance' },
        { status: 403 }
      )
    }

    // Get current attendance record to verify ownership
    const { data: attendanceData } = await supabase
      .from('attendances')
      .select('course_id')
      .eq('id', id)
      .single()

    if (!attendanceData) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    // If teacher, verify they own the course
    if (userRole === 'teacher') {
      const { data: courseData } = await supabase
        .from('courses')
        .select('teacher_id')
        .eq('id', attendanceData.course_id)
        .single()

      if (!courseData || courseData.teacher_id !== user.id) {
        return NextResponse.json(
          { error: 'Teachers can only update attendance for their own courses' },
          { status: 403 }
        )
      }
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    const { data, error } = await supabase
      .from('attendances')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ attendance: data?.[0] })
  } catch (error) {
    console.error('Attendance PUT error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// DELETE attendance record
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const userRole = user.user_metadata?.role

  // Only admin or teachers can delete attendance
  if (userRole !== 'admin' && userRole !== 'teacher') {
    return NextResponse.json(
      { error: 'Only admins and teachers can delete attendance' },
      { status: 403 }
    )
  }

  // Get attendance record to verify ownership
  const { data: attendanceData } = await supabase
    .from('attendances')
    .select('course_id')
    .eq('id', id)
    .single()

  if (!attendanceData) {
    return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
  }

  // If teacher, verify they own the course
  if (userRole === 'teacher') {
    const { data: courseData } = await supabase
      .from('courses')
      .select('teacher_id')
      .eq('id', attendanceData.course_id)
      .single()

    if (!courseData || courseData.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'Teachers can only delete attendance for their own courses' },
        { status: 403 }
      )
    }
  }

  const { error } = await supabase.from('attendances').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
