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
    const { friendIds } = await request.json()

    if (!Array.isArray(friendIds) || friendIds.length === 0) {
      return NextResponse.json({ error: "No friends selected" }, { status: 400 })
    }

    // Get post details to verify it exists
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, content, author_id")
      .eq("id", postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Send message to each friend with shared_post_id
    for (const friendId of friendIds) {
      // Check if they're mutual follows
      const { data: iFollowThem } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", friendId)
        .maybeSingle()

      const { data: theyFollowMe } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", friendId)
        .eq("following_id", user.id)
        .maybeSingle()

      // Only send if mutual follows
      if (!iFollowThem || !theyFollowMe) {
        console.log(`[v0] Skipping ${friendId} - not mutual follows`)
        continue
      }

      // Insert message with shared post reference
      const { error: messageError } = await supabase.from("direct_messages").insert({
        sender_id: user.id,
        recipient_id: friendId,
        content: "shared a post", // Simple text, the UI will render the post
        shared_post_id: postId,
      })

      if (messageError) {
        console.error("[v0] Error sending message:", messageError)
        continue
      }

      // Create notification
      await supabase.from("notifications").insert({
        user_id: friendId,
        type: "share",
        actor_id: user.id,
        post_id: postId,
      })
    }

    return NextResponse.json({ success: true, sharedWith: friendIds.length })
  } catch (error) {
    console.error("[v0] Error sharing post with friends:", error)
    return NextResponse.json({ error: "Failed to share post" }, { status: 500 })
  }
}
