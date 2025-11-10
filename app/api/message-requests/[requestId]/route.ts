import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request, props: { params: Promise<{ requestId: string }> }) {
  const params = await props.params
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status } = await request.json()

    if (!["accepted", "declined"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Verify the request exists and belongs to the user
    const { data: messageRequest, error: fetchError } = await supabase
      .from("message_requests")
      .select("*")
      .eq("id", params.requestId)
      .eq("recipient_id", user.id)
      .eq("status", "pending")
      .single()

    if (fetchError || !messageRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Update the request status
    const { error } = await supabase
      .from("message_requests")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.requestId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If accepted, create notification for sender
    if (status === "accepted") {
      await supabase.from("notifications").insert({
        user_id: messageRequest.sender_id,
        type: "message_request_accepted",
        actor_id: user.id,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating message request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
