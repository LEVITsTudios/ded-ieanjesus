import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET all schedules with course details
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('course_id')
  const dayOfWeek = searchParams.get('day_of_week')

  let query = supabase
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
        teacher_id,
        profiles:teacher_id (
          id,
          full_name
        )
      )
    `)

  if (courseId) {
    query = query.eq('course_id', courseId)
  }
  if (dayOfWeek) {
    query = query.eq('day_of_week', dayOfWeek)
  }

  const { data, error } = await query.order('day_of_week').order('start_time')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ schedules: data })
}

// CREATE a new schedule
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { course_id, day_of_week, start_time, end_time, classroom } = body

    // Validate required fields
    if (!course_id || day_of_week === undefined || day_of_week === null || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: course_id, day_of_week, start_time, end_time' },
        { status: 400 }
      )
    }

    // Validate day_of_week (0-6)
    if (day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json(
        { error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM or HH:MM:SS)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM or HH:MM:SS' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userRole = user.user_metadata?.role

    // Check authorization: only admin or teacher of the course
    if (userRole !== 'admin') {
      if (userRole === 'teacher') {
        // Verify teacher owns the course
        const { data: courseData } = await supabase
          .from('courses')
          .select('teacher_id')
          .eq('id', course_id)
          .single()

        if (!courseData || courseData.teacher_id !== user.id) {
          return NextResponse.json(
            { error: 'Teachers can only create schedules for their own courses' },
            { status: 403 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Only admins and teachers can create schedules' },
          { status: 403 }
        )
      }
    }

    const { data, error } = await supabase
      .from('schedules')
      .insert([
        {
          course_id,
          day_of_week,
          start_time,
          end_time,
          classroom: classroom || null,
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ schedule: data?.[0] }, { status: 201 })
  } catch (error) {
    console.error('Schedule POST error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
