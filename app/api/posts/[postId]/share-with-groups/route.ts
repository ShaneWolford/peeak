import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { postId } = await params
    const { conversationIds } = await request.json()

    if (!conversationIds || conversationIds.length === 0) {
      return NextResponse.json({ error: "No conversations selected" }, { status: 400 })
    }

    // Verify the post exists
    const { data: post, error: postError } = await supabase.from("posts").select("id").eq("id", postId).single()

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Verify user is a member of all selected conversations
    const { data: memberships } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id)
      .in("conversation_id", conversationIds)

    const memberConversationIds = memberships?.map((m) => m.conversation_id) || []
    const unauthorizedConversations = conversationIds.filter((id: string) => !memberConversationIds.includes(id))

    if (unauthorizedConversations.length > 0) {
      return NextResponse.json({ error: "Not a member of all selected conversations" }, { status: 403 })
    }

    // Send message to each conversation with shared_post_id
    const messagePromises = conversationIds.map(async (conversationId: string) => {
      try {
        // Insert message with shared post reference
        const { error: messageError } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: "shared a post", // Simple text, the UI will render the post
          shared_post_id: postId,
        })

        if (messageError) {
          console.error(`Error sending message to conversation ${conversationId}:`, messageError)
          return { conversationId, success: false, error: messageError }
        }

        return { conversationId, success: true }
      } catch (error) {
        console.error(`Error processing conversation ${conversationId}:`, error)
        return { conversationId, success: false, error }
      }
    })

    const results = await Promise.all(messagePromises)
    const successCount = results.filter((r) => r.success).length

    return NextResponse.json({
      success: true,
      sharedCount: successCount,
      totalRequested: conversationIds.length,
    })
  } catch (error) {
    console.error("Error sharing post with groups:", error)
    return NextResponse.json({ error: "Failed to share post" }, { status: 500 })
  }
}
