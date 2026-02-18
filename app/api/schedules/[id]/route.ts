import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET a specific schedule
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('schedules')
    .select(`
      id,
      course_id,
      day_of_week,
      start_time,
      end_time,
      classroom,
      created_at,
      courses:course_id (
        id,
        name,
        teacher_id
      )
    `)
    .eq('id', params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json({ schedule: data })
}

// UPDATE a schedule
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { course_id, day_of_week, start_time, end_time, classroom } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get current schedule to check permissions
    const { data: currentSchedule, error: fetchError } = await supabase
      .from('schedules')
      .select('course_id, courses:course_id(teacher_id)')
      .eq('id', params.id)
      .single()

    if (fetchError || !currentSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    const userRole = user.user_metadata?.role

    // Check authorization: only admin or teacher of the course
    if (userRole !== 'admin') {
      if (userRole === 'teacher') {
        const courseTeacherId = currentSchedule.courses?.teacher_id
        if (courseTeacherId !== user.id) {
          return NextResponse.json(
            { error: 'Teachers can only edit schedules for their own courses' },
            { status: 403 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Only admins and teachers can update schedules' },
          { status: 403 }
        )
      }
    }

    // Build update object with only provided fields
    const updateData: any = {}
    if (course_id !== undefined) updateData.course_id = course_id
    if (day_of_week !== undefined) updateData.day_of_week = day_of_week
    if (start_time !== undefined) updateData.start_time = start_time
    if (end_time !== undefined) updateData.end_time = end_time
    if (classroom !== undefined) updateData.classroom = classroom

    const { data, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', params.id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ schedule: data?.[0] })
  } catch (error) {
    console.error('Schedule PUT error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// DELETE a schedule
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Get schedule to check permissions
  const { data: schedule, error: fetchError } = await supabase
    .from('schedules')
    .select('course_id, courses:course_id(teacher_id)')
    .eq('id', params.id)
    .single()

  if (fetchError || !schedule) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
  }

  const userRole = user.user_metadata?.role

  // Check authorization: only admin or teacher of the course
  if (userRole !== 'admin') {
    if (userRole === 'teacher') {
      const courseTeacherId = schedule.courses?.teacher_id
      if (courseTeacherId !== user.id) {
        return NextResponse.json(
          { error: 'Teachers can only delete schedules for their own courses' },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Only admins and teachers can delete schedules' },
        { status: 403 }
      )
    }
  }

  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Schedule deleted successfully' }, { status: 200 })
}
