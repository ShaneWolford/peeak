import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Fetching conversations for user:", user.id)

    // Use service role to bypass RLS
    const serviceSupabase = await createClient()

    // Get all conversation IDs where user is a member
    const { data: memberData, error: memberError } = await serviceSupabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id)

    if (memberError) {
      console.error("[v0] Error fetching member conversations:", memberError)
      return NextResponse.json({ conversations: [] })
    }

    const conversationIds = memberData?.map((m) => m.conversation_id) || []
    console.log("[v0] Found conversation IDs:", conversationIds)

    if (conversationIds.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    // Fetch conversation details
    const { data: conversations, error: convError } = await serviceSupabase
      .from("conversations")
      .select("*")
      .in("id", conversationIds)

    if (convError) {
      console.error("[v0] Error fetching conversations:", convError)
      return NextResponse.json({ conversations: [] })
    }

    // For each conversation, get members and last message
    const conversationsData = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Get members
        const { data: members } = await serviceSupabase
          .from("conversation_members")
          .select(`
            *,
            profile:profiles(*)
          `)
          .eq("conversation_id", conv.id)

        // Get last message
        const { data: lastMessageData } = await serviceSupabase
          .from("messages")
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(*)
          `)
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)

        const lastMessage = lastMessageData?.[0] || null

        // Count unread messages
        const { count: unreadCount } = await serviceSupabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("sender_id", user.id)
          .eq("is_read", false)

        return {
          ...conv,
          members: members || [],
          lastMessage,
          unreadCount: unreadCount || 0,
        }
      }),
    )

    // Sort by last message time
    conversationsData.sort((a, b) => {
      const aTime = a.lastMessage?.created_at || a.created_at
      const bTime = b.lastMessage?.created_at || b.created_at
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

    console.log("[v0] Returning conversations:", conversationsData.length)
    return NextResponse.json({ conversations: conversationsData })
  } catch (error) {
    console.error("[v0] Error in conversations list:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
