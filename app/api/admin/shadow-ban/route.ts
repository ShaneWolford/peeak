import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Shadow ban the user
    const { error } = await supabase.from("profiles").update({ is_shadow_banned: true }).eq("id", userId)

    if (error) {
      console.error("[v0] Error shadow banning user:", error)
      return NextResponse.json({ error: "Failed to shadow ban user" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Shadow ban error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
