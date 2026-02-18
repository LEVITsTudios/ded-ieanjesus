import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET all attendances - accessible to authenticated users
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('course_id')
  const studentId = searchParams.get('student_id')
  const date = searchParams.get('date')

  let query = supabase.from('attendances').select('*')
  
  if (courseId) query = query.eq('course_id', courseId)
  if (studentId) query = query.eq('student_id', studentId)
  if (date) query = query.eq('date', date)

  const { data, error } = await query.order('date', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ attendances: data })
}

// CREATE attendance record
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { student_id, course_id, date, status, notes } = body

    // Validate required fields
    if (!student_id || !course_id || !date || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, course_id, date, status' },
        { status: 400 }
      )
    }

    // Validate status enum
    const validStatuses = ['present', 'absent', 'late', 'excused']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userRole = user.user_metadata?.role
    
    // Only admin or teachers can create attendance records
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json(
        { error: 'Only admins and teachers can record attendance' },
        { status: 403 }
      )
    }

    // If teacher, verify they own the course
    if (userRole === 'teacher') {
      const { data: courseData } = await supabase
        .from('courses')
        .select('teacher_id')
        .eq('id', course_id)
        .single()

      if (!courseData || courseData.teacher_id !== user.id) {
        return NextResponse.json(
          { error: 'Teachers can only create attendance for their own courses' },
          { status: 403 }
        )
      }
    }

    const { data, error } = await supabase
      .from('attendances')
      .insert([
        {
          student_id,
          course_id,
          date,
          status,
          notes,
          recorded_by: user.id,
        },
      ])
      .select()

    if (error) {
      // Check if it's a unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Attendance record already exists for this student, course, and date' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ attendance: data?.[0] }, { status: 201 })
  } catch (error) {
    console.error('Attendance POST error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
