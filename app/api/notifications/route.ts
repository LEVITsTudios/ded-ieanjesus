import { NextResponse } from 'next/server'
import { createSafeClient, getSafeUser } from '@/lib/supabase/safe-client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, body: text, data } = body

    const supabase = await createSafeClient()
    const user = await getSafeUser(supabase)

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
    console.error('POST /api/notifications error:', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createSafeClient()
    const user = await getSafeUser(supabase)

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notifications: data })
  } catch (e) {
    console.error('GET /api/notifications error:', e)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
