import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Add member to group
export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: member } = await supabase
      .from("conversation_members")
      .select("role")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single()

    if (!member || member.role !== "admin") {
      return NextResponse.json({ error: "Only admins can add members" }, { status: 403 })
    }

    const { userId } = await request.json()

    const { error } = await supabase.from("conversation_members").insert({
      conversation_id: conversationId,
      user_id: userId,
      role: "member",
    })

    if (error) throw error

    // Create notification
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "message",
      actor_id: user.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding member:", error)
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 })
  }
}

// Remove member from group (kick)
export async function DELETE(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: member } = await supabase
      .from("conversation_members")
      .select("role")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single()

    if (!member || member.role !== "admin") {
      return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 })
    }

    const { userId } = await request.json()

    // Can't remove yourself
    if (userId === user.id) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 })
    }

    const { error } = await supabase
      .from("conversation_members")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}
