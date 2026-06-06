// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

export type TypedSupabaseClient = SupabaseClient<Database>

let client: TypedSupabaseClient | undefined

// Singleton agar tidak membuat instance baru setiap render
export function createClient(): TypedSupabaseClient {
  if (client) return client
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ) as TypedSupabaseClient
  return client
}
