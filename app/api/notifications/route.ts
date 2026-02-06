import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, body: text, data } = body

    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const insert = await supabase.from('notifications').insert({
      user_id: user.id,
      title: title,
      body: text,
      data: data || null,
      is_read: false,
    })

    if (insert.error) {
      return NextResponse.json({ error: insert.error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
