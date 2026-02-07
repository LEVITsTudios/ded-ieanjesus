import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

let retryCount = 0

export async function createSafeClient() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error('Missing Supabase environment variables')
    }

    const cookieStore = await cookies()

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
          } catch (e) {
            console.error('Error setting cookies:', e)
          }
        },
      },
    })
  } catch (err) {
    console.error('Error creating safe Supabase client:', err)
    throw err
  }
}

/**
 * Safely call supabase.auth.getUser() with timeout and error handling
 */
export async function getSafeUser(supabase: any) {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 2000)
    )

    const userPromise = supabase.auth.getUser()

    const result = await Promise.race([userPromise, timeoutPromise]) as any
    return result.data?.user || null
  } catch (err) {
    console.error('Error getting safe user:', err)
    return null
  }
}
