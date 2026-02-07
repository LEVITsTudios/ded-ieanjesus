"use client"

import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | null = null

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

export function createClient() {
  if (client) return client

  const { url, key } = validateEnv()

  try {
    client = createBrowserClient(url, key)
  } catch (err) {
    console.error('Error creating Supabase browser client:', err)
    throw err
  }

  return client
}
