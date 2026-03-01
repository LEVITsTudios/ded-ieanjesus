import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// same jwt decode helper used in other endpoints
function decodeJwt(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1]
    const json = Buffer.from(payload, 'base64').toString()
    const obj = JSON.parse(json)
    if (obj.exp && Date.now() / 1000 > obj.exp) return null
    return obj
  } catch (e) {
    return null
  }
}

async function authenticate(request: Request) {
  const supabase = await createClient()
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
  return user
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const user = await authenticate(request)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data, error } = await supabase
    .from('meetings')
    .select(`*, organizer:organizer_id (id, full_name)`)
    .eq('id', params.id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ meeting: data })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    const user = await authenticate(request)

    if (!user || !['admin', 'teacher'].includes(user.user_metadata?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // teacher can only modify their own meetings
    if (user.user_metadata?.role === 'teacher') {
      const { data: meeting } = await supabase
        .from('meetings')
        .select('organizer_id, course_id')
        .eq('id', params.id)
        .single()
      if (meeting?.organizer_id !== user.id) {
        return NextResponse.json({ error: 'Teachers can only update their own sessions' }, { status: 403 })
      }
      // for classes also ensure they belong to one of their courses
      if (body.meeting_type === 'class' && body.course_id) {
        const { data: course } = await supabase
          .from('courses')
          .select('teacher_id')
          .eq('id', body.course_id)
          .single()
        if (!course || course.teacher_id !== user.id) {
          return NextResponse.json({ error: 'Teachers can only edit classes for their own courses' }, { status: 403 })
        }
      }
    }

    const updatePayload: any = body
    // ensure undefined participants don't wipe column
    if (body.participants === undefined) delete updatePayload.participants

    const { data, error } = await supabase.from('meetings').update(updatePayload).eq('id', params.id).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ meeting: data?.[0] })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const user = await authenticate(request)
  if (!user || !['admin', 'teacher'].includes(user.user_metadata?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // teachers can only delete their own sessions
  if (user.user_metadata?.role === 'teacher') {
    const { data: meeting } = await supabase
      .from('meetings')
      .select('organizer_id')
      .eq('id', params.id)
      .single()
    if (meeting?.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Teachers can only delete their own sessions' }, { status: 403 })
    }
  }

  const { error } = await supabase.from('meetings').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
