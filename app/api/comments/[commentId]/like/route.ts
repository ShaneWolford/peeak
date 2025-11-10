import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const { commentId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("comment_likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("comment_id", commentId)
      .maybeSingle()

    if (existingLike) {
      // Unlike
      const { error } = await supabase.from("comment_likes").delete().eq("id", existingLike.id)

      if (error) throw error

      return NextResponse.json({ liked: false })
    } else {
      // Like
      const { error } = await supabase.from("comment_likes").insert({
        user_id: user.id,
        comment_id: commentId,
      })

      if (error) throw error

      // Create notification for comment author
      const { data: comment } = await supabase
        .from("comments")
        .select("author_id, post_id")
        .eq("id", commentId)
        .single()

      if (comment && comment.author_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: comment.author_id,
          type: "like",
          actor_id: user.id,
          comment_id: commentId,
          post_id: comment.post_id,
        })
      }

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error("Error toggling comment like:", error)
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}
