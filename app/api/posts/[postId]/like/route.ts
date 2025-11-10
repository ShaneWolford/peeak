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

    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .maybeSingle()

    if (existingLike) {
      // Unlike
      const { error } = await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", postId)

      if (error) throw error

      const { count } = await supabase.from("likes").select("id", { count: "exact", head: true }).eq("post_id", postId)

      return NextResponse.json({ liked: false, count: count || 0 })
    } else {
      // Like
      const { error } = await supabase.from("likes").insert({
        user_id: user.id,
        post_id: postId,
      })

      if (error) throw error

      // Create notification for post author
      const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single()

      if (post && post.author_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: post.author_id,
          type: "like",
          actor_id: user.id,
          post_id: postId,
        })
      }

      const { count } = await supabase.from("likes").select("id", { count: "exact", head: true }).eq("post_id", postId)

      return NextResponse.json({ liked: true, count: count || 0 })
    }
  } catch (error) {
    console.error("Error toggling like:", error)
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}
