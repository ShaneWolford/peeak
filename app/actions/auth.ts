"use server"

import { createClient } from "@/lib/supabase/server"

export async function signInWithIdentifier(identifier: string, password: string) {
  try {
    console.log("[v0] Sign in attempt with identifier:", identifier)
    const supabase = await createClient()

    // Check if identifier is an email or username
    const isEmail = identifier.includes("@")
    let email = identifier

    // If it's a username, look up the email
    if (!isEmail) {
      console.log("[v0] Looking up username:", identifier)

      // First, get the user ID from the profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", identifier)
        .single()

      console.log("[v0] Profile lookup result:", { profile, error: profileError })

      if (profileError || !profile) {
        return { error: "Username not found" }
      }

      // Use service role client to get the user's email from auth.users
      const { createClient: createServiceClient } = await import("@/lib/supabase/service")

      // Check if service client is properly configured
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("[v0] SUPABASE_SERVICE_ROLE_KEY is not set!")
        return { error: "Invalid API key" }
      }

      const serviceSupabase = createServiceClient()
      console.log("[v0] Getting user by ID:", profile.id)

      const { data: userData, error: userError } = await serviceSupabase.auth.admin.getUserById(profile.id)

      console.log("[v0] User data result:", {
        hasEmail: !!userData?.user?.email,
        error: userError,
      })

      if (userError || !userData.user?.email) {
        console.error("[v0] Failed to get user email:", userError)
        return { error: "Unable to find account" }
      }

      email = userData.user.email
      console.log("[v0] Found email for username")
    }

    // Sign in with email and password
    console.log("[v0] Attempting sign in with email")
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("[v0] Sign in error:", error.message)
      return { error: error.message }
    }

    console.log("[v0] Sign in successful")
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error in signInWithIdentifier:", error)
    return { error: error instanceof Error ? error.message : "An error occurred" }
  }
}
