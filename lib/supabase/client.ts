"use client"

import { createBrowserClient } from "@supabase/ssr"

function validateEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('Missing Supabase env vars:', {
      url: url ? '✓' : '✗ NEXT_PUBLIC_SUPABASE_URL',
      key: key ? '✓' : '✗ NEXT_PUBLIC_SUPABASE_ANON_KEY'
    })
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  if (!url.startsWith("https://")) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must start with "https://"')
  }

  return { url, key }
}

export function createClient() {
  const { url, key } = validateEnv()

  try {
    // Crear una nueva instancia cada vez para evitar problemas de estado
    const client = createBrowserClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        // Aumentar timeout para conexiones lentas
        headers: {
          'x-client-type': 'browser'
        }
      }
    })
    
    return client
  } catch (err) {
    console.error('Error creating Supabase browser client:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗',
      error: err instanceof Error ? err.message : String(err)
    })
    throw err
  }
}
