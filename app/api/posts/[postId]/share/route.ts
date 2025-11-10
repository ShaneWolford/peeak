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

    // Check if already shared
    const { data: existingShare } = await supabase
      .from("shares")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .single()

    if (existingShare) {
      // Unshare
      const { error } = await supabase.from("shares").delete().eq("user_id", user.id).eq("post_id", postId)

      if (error) throw error

      return NextResponse.json({ shared: false })
    } else {
      // Share
      const { error } = await supabase.from("shares").insert({
        user_id: user.id,
        post_id: postId,
      })

      if (error) throw error

      // Create notification for post author
      const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single()

      if (post && post.author_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: post.author_id,
          type: "share",
          actor_id: user.id,
          post_id: postId,
        })
      }

      return NextResponse.json({ shared: true })
    }
  } catch (error) {
    console.error("Error toggling share:", error)
    return NextResponse.json({ error: "Failed to toggle share" }, { status: 500 })
  }
}
