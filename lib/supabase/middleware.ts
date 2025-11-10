import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[v0] Supabase environment variables not found in middleware. Skipping authentication checks.")
    console.warn(
      "[v0] Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the Vars section.",
    )
    // Allow request to continue without authentication
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    })

    let user = null
    try {
      // getSession() uses cached session data and doesn't make network requests
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession()

      if (authError) {
        // Only log unexpected errors, not missing sessions
        if (authError.message !== "Auth session missing!") {
          console.error("[v0] Auth error in middleware:", authError.message)
        }
      }

      user = session?.user ?? null
    } catch (error: any) {
      if (error?.message?.includes("Too Many Requests") || error?.message?.includes("not valid JSON")) {
        console.warn("[v0] Rate limit or parse error in middleware, continuing without auth check")
      } else {
        console.error("[v0] Auth exception in middleware:", error)
      }
      // Continue without user if auth fails
    }

    // Redirect unauthenticated users to login (except for auth pages and home)
    if (!user && !request.nextUrl.pathname.startsWith("/auth") && request.nextUrl.pathname !== "/") {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from auth pages
    if (user && request.nextUrl.pathname.startsWith("/auth")) {
      const url = request.nextUrl.clone()
      url.pathname = "/feed"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error: any) {
    if (error?.message?.includes("Too Many Requests") || error?.message?.includes("not valid JSON")) {
      console.warn("[v0] Rate limit in middleware, allowing request through")
    } else {
      console.error("[v0] Middleware exception:", error)
    }
    // Return next response if anything fails
    return NextResponse.next({
      request,
    })
  }
}
