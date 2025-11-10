import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
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
      return NextResponse.json({ error: "Only admins can update group settings" }, { status: 403 })
    }

    const { name, avatar_url, background_url } = await request.json()

    const updates: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (background_url !== undefined) updates.background_url = background_url

    const { data, error } = await supabase
      .from("conversations")
      .update(updates)
      .eq("id", conversationId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ conversation: data })
  } catch (error) {
    console.error("Error updating conversation:", error)
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 })
  }
}
