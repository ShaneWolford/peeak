import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[Peeak] Missing Supabase environment variables during build.\n" +
        "Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env\n" +
        "Then rebuild with: docker compose build --no-cache",
    )

    client = createBrowserClient("https://placeholder.supabase.co", "placeholder-anon-key")
    return client
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return client
}
