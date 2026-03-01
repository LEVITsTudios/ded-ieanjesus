import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// simple JWT decoder used in several routes
function decodeJwt(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    let decodedPayload: string
    const payload = parts[1]
    // support Buffer in Node/edge and atob in browser
    if (typeof Buffer !== 'undefined') {
      decodedPayload = Buffer.from(payload, 'base64').toString('utf-8')
    } else {
      decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    }

    const parsed = JSON.parse(decodedPayload)
    // check expiration
    if (parsed.exp && Date.now() / 1000 > parsed.exp) {
      console.error('[decodeJwt] token expired')
      return null
    }
    return parsed
  } catch (e) {
    console.error('[decodeJwt] error', e)
    return null
  }
}

// GET enrollments, optional filters
export async function GET(request: Request) {
  const supabase = await createClient()

  // token header fallback - decode JWT to set currentUser
  let currentUser: any = null
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const decoded = decodeJwt(authHeader.substring(7))
    if (decoded && decoded.sub) {
      // Extract role from JWT (prioritize user_metadata over root-level role)
      const role = decoded.user_metadata?.role || 
                   decoded.custom_claims?.role || 
                   decoded.role
      currentUser = {
        id: decoded.sub,
        user_metadata: {
          role: role,
        },
      }
    }
  }

  if (!currentUser) {
    const { data: { user } } = await supabase.auth.getUser()
    currentUser = user
  }

  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('course_id')
  const studentId = searchParams.get('student_id')

  let query = supabase.from('enrollments').select(`
      id,
      status,
      enrollment_date,
      student:profiles(id, full_name, email),
      course:courses(id, name, code)
    `)

  if (courseId) query = query.eq('course_id', courseId)
  if (studentId) query = query.eq('student_id', studentId)

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ enrollments: data })
}

// CREATE enrollment
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { student_id, course_id, status } = body

    if (!student_id || !course_id) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, course_id' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // authenticate via token header (preferred) or cookie
    let user: any = null
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = decodeJwt(authHeader.substring(7))
      if (decoded && decoded.sub) {
        // Extract role from JWT (prioritize user_metadata over root-level role)
        const role = decoded.user_metadata?.role || 
                     decoded.custom_claims?.role || 
                     decoded.role
        user = {
          id: decoded.sub,
          user_metadata: {
            role: role,
          },
        }
      }
    }
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser()
      user = u
    }
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userRole = user.user_metadata?.role

    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json(
        { error: 'Only admins and teachers can create enrollments' },
        { status: 403 }
      )
    }

    // if teacher, ensure they own the course
    if (userRole === 'teacher') {
      const { data: courseData } = await supabase
        .from('courses')
        .select('teacher_id')
        .eq('id', course_id)
        .single()
      if (!courseData || courseData.teacher_id !== user.id) {
        return NextResponse.json(
          { error: 'Teachers can only enroll students in their own courses' },
          { status: 403 }
        )
      }
    }

    const insertPayload: any = { student_id, course_id }
    if (status) insertPayload.status = status

    const { data, error } = await supabase
      .from('enrollments')
      .insert([insertPayload])
      .select()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Student already enrolled in this course' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ enrollment: data?.[0] }, { status: 201 })
  } catch (error: any) {
    console.error('[Enrollments POST] unhandled error:', error)
    const msg = error?.message || 'Invalid request'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
