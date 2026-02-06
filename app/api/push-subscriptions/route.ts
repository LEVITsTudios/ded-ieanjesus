import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { subscription } = body

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription provided' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const insert = await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      subscription: subscription,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

    if (insert.error) {
      return NextResponse.json({ error: insert.error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
