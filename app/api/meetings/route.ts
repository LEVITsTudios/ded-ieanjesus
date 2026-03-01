import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// helper copied from other routes
function decodeJwt(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1]
    const json = Buffer.from(payload, 'base64').toString()
    const obj = JSON.parse(json)
    // verify expiration if present
    if (obj.exp && Date.now() / 1000 > obj.exp) return null
    return obj
  } catch (e) {
    return null
  }
}

export async function GET(request: Request) {
  const supabase = await createClient()

  // authenticate via bearer token or cookie
  let user: any = null
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const decoded = decodeJwt(authHeader.substring(7))
    if (decoded && decoded.sub) {
      const role = decoded.user_metadata?.role || decoded.role
      user = { id: decoded.sub, user_metadata: { role } }
    }
  }
  if (!user) {
    const { data: { user: u } } = await supabase.auth.getUser()
    user = u
  }
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data, error } = await supabase
    .from('meetings')
    .select(`*, organizer:organizer_id (id, full_name)`)
    .order('meeting_date', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ meetings: data })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      meeting_date,
      duration_minutes,
      location,
      meeting_url,
      participants,
      meeting_type,
      course_id,
      topic,
      materials_url,
      teacher_attended,
      feedback,
    } = body

    const supabase = await createClient()

    // authentication fallback
    let user: any = null
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = decodeJwt(authHeader.substring(7))
      if (decoded && decoded.sub) {
        const role = decoded.user_metadata?.role || decoded.role
        user = { id: decoded.sub, user_metadata: { role } }
      }
    }
    if (!user) {
      const { data: { user: u } } = await supabase.auth.getUser()
      user = u
    }

    if (!user || !['admin', 'teacher'].includes(user.user_metadata?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // if it's a class session the creator must be the teacher or admin
    if (meeting_type === 'class' && user.user_metadata?.role === 'teacher') {
      // ensure teacher is creating for one of their own courses?
      if (course_id) {
        const { data: course } = await supabase
          .from('courses')
          .select('teacher_id')
          .eq('id', course_id)
          .single()
        if (!course || course.teacher_id !== user.id) {
          return NextResponse.json({ error: 'Teachers can only schedule classes for their own courses' }, { status: 403 })
        }
      }
    }

    const insertPayload: any = {
      title,
      description,
      meeting_date,
      duration_minutes,
      location,
      meeting_url,
      meeting_type,
      course_id,
      topic,
      materials_url,
      teacher_attended,
      feedback,
      organizer_id: user.id,
    }
    // only include participants if defined to avoid schema errors
    if (participants !== undefined && participants !== null) {
      insertPayload.participants = participants
    }

    const { data, error } = await supabase.from('meetings').insert([insertPayload]).select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ meeting: data?.[0] })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
