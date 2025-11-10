import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const req = await request.json() // Renamed request to req to avoid variable name conflict
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { other_user_id } = req

    if (!other_user_id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if there's an accepted request in either direction
    const { data: messageRequest, error } = await supabase
      .from("message_requests")
      .select("id, status")
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${other_user_id}),and(sender_id.eq.${other_user_id},recipient_id.eq.${user.id})`,
      )
      .eq("status", "accepted")
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ can_message: !!messageRequest })
  } catch (error) {
    console.error("[v0] Error checking message request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
