import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get received requests
    const { data: requests, error } = await supabase
      .from("message_requests")
      .select(`
        *,
        sender:profiles!message_requests_sender_id_fkey(id, username, display_name, avatar_url, is_pro)
      `)
      .eq("recipient_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("[v0] Error fetching message requests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recipient_id, message } = await request.json()

    if (!recipient_id) {
      return NextResponse.json({ error: "Recipient ID is required" }, { status: 400 })
    }

    // Check if request already exists
    const { data: existing } = await supabase
      .from("message_requests")
      .select("id, status")
      .eq("sender_id", user.id)
      .eq("recipient_id", recipient_id)
      .maybeSingle()

    if (existing) {
      if (existing.status === "pending") {
        return NextResponse.json({ error: "Request already sent" }, { status: 400 })
      }
      if (existing.status === "accepted") {
        return NextResponse.json({ error: "Request already accepted" }, { status: 400 })
      }
    }

    // Create message request
    const { data, error } = await supabase
      .from("message_requests")
      .insert({
        sender_id: user.id,
        recipient_id,
        message: message || null,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create notification
    await supabase.from("notifications").insert({
      user_id: recipient_id,
      type: "message_request",
      actor_id: user.id,
    })

    return NextResponse.json({ request: data })
  } catch (error) {
    console.error("[v0] Error creating message request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
