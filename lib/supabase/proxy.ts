import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip auth check for paths that don't need it
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith("/auth") || pathname === "/" || pathname.startsWith("/api/")) {
    return supabaseResponse
  }

  const { url, key } = validateEnv()

  let supabase
  try {
    supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })
  } catch (err) {
    console.error('Error creating Supabase server client in middleware:', err)
    return supabaseResponse
  }

  try {
    // Add timeout to prevent hanging on fetch failure
    const getAuthPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 3000)
    )

    const {
      data: { user },
    } = await Promise.race([getAuthPromise, timeoutPromise]) as any

    if (!user) {
      const urlRedirect = request.nextUrl.clone()
      urlRedirect.pathname = "/auth/login"
      return NextResponse.redirect(urlRedirect)
    }
  } catch (err) {
    // Log fetch/auth errors from Supabase (e.g. network or fetch failing in edge runtime)
    console.error('Error calling supabase.auth.getUser in middleware:', err)
    // Continue without blocking the request; user may be unauthenticated.
  }

  return supabaseResponse
}
