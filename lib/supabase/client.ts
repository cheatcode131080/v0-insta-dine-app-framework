import { createBrowserClient as createClient } from "@supabase/ssr"

let client: ReturnType<typeof createClient> | null = null

export function createBrowserClient() {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Supabase credentials are missing!")
    console.error("[v0] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "present" : "missing")
    console.error("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "present" : "missing")
    throw new Error("Supabase credentials are required but not found")
  }

  console.log("[v0] Creating Supabase browser client with URL:", supabaseUrl)

  client = createClient(supabaseUrl, supabaseAnonKey)

  return client
}
