import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// `web-push` is an optional dependency; require dynamically to avoid build errors when not installed
let webpush: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  webpush = require('web-push')
} catch (e) {
  // web-push not available
}

export async function POST(request: Request) {
  if (!webpush) {
    return NextResponse.json({ error: 'web-push not installed on server' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { title, body: text, data, userId } = body

    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY

    if (!vapidPublic || !vapidPrivate) {
      return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
    }

    webpush.setVapidDetails(
      `mailto:${process.env.NOTIFICATIONS_FROM || 'no-reply@example.com'}`,
      vapidPublic,
      vapidPrivate
    )

    const supabase = await createClient()
    let query = supabase.from('push_subscriptions').select('subscription')
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: subscriptions, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const payload = JSON.stringify({ title: title || 'Notificación', body: text || '', data: data || {} })

    const results: Array<any> = []

    for (const row of subscriptions || []) {
      const sub = row.subscription
      try {
        await webpush.sendNotification(sub, payload)
        results.push({ ok: true })
      } catch (err: any) {
        results.push({ ok: false, error: err?.message })
      }
    }

    return NextResponse.json({ results })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
