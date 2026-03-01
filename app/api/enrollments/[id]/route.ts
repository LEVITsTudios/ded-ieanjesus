import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE enrollment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    supabase.auth.setAuth(authHeader.substring(7))
  }
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const userRole = user.user_metadata?.role

  if (userRole !== 'admin') {
    // according to RLS only admins can delete
    return NextResponse.json(
      { error: 'Only admins can delete enrollments' },
      { status: 403 }
    )
  }

  const { error } = await supabase.from('enrollments').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
