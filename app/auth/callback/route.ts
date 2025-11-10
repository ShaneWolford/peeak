import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/feed"

  if (code) {
    const supabase = await createClient()

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("[v0] Error exchanging code for session:", error.message)
        return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
      }

      // URL to redirect to after sign in process completes
      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.error("[v0] Callback exception:", error)
      return NextResponse.redirect(`${origin}/auth/login?error=callback_exception`)
    }
  }

  // If no code, redirect to login
  return NextResponse.redirect(`${origin}/auth/login`)
}
