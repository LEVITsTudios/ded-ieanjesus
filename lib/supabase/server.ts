import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function validateEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  if (!url.startsWith("https://")) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must start with "https://"')
  }

  return { url, key }
}

export async function createClient() {
  const { url, key } = validateEnv()

  const cookieStore = await cookies()

  try {
    return createServerClient(url, key, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    })
  } catch (err) {
    console.error('Error creating Supabase server client:', err)
    throw err
  }
}
