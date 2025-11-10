import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is banned
    const { data: profile } = await supabase.from("profiles").select("is_banned").eq("id", user.id).single()

    if (!profile?.is_banned) {
      return NextResponse.json({ error: "User is not banned" }, { status: 400 })
    }

    // Check if user already has a pending appeal
    const { data: existingAppeal } = await supabase
      .from("appeals")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .single()

    if (existingAppeal) {
      return NextResponse.json({ error: "You already have a pending appeal" }, { status: 400 })
    }

    const { reason } = await request.json()

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 })
    }

    // Create appeal
    const { error } = await supabase.from("appeals").insert({
      user_id: user.id,
      reason: reason.trim(),
      status: "pending",
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error submitting appeal:", error)
    return NextResponse.json({ error: "Failed to submit appeal" }, { status: 500 })
  }
}
