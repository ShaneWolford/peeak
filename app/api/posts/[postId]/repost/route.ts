import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user already reposted
    const { data: existingRepost } = await supabase
      .from("reposts")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existingRepost) {
      // Remove repost
      const { error: deleteError } = await supabase.from("reposts").delete().eq("id", existingRepost.id)

      if (deleteError) {
        console.error("[v0] Error removing repost:", deleteError)
        return NextResponse.json({ error: "Failed to remove repost" }, { status: 500 })
      }

      const { count } = await supabase.from("reposts").select("*", { count: "exact", head: true }).eq("post_id", postId)

      return NextResponse.json({ reposted: false, count: count || 0 })
    } else {
      // Add repost
      const { error: insertError } = await supabase.from("reposts").insert({
        post_id: postId,
        user_id: user.id,
      })

      if (insertError) {
        console.error("[v0] Error adding repost:", insertError)
        return NextResponse.json({ error: "Failed to add repost" }, { status: 500 })
      }

      // Create notification for post author
      const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single()

      if (post && post.author_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: post.author_id,
          actor_id: user.id,
          type: "repost",
          post_id: postId,
        })
      }

      const { count } = await supabase.from("reposts").select("*", { count: "exact", head: true }).eq("post_id", postId)

      return NextResponse.json({ reposted: true, count: count || 0 })
    }
  } catch (error) {
    console.error("[v0] Error in repost toggle:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has reposted this post
    const { data: repost } = await supabase
      .from("reposts")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle()

    return NextResponse.json({ reposted: !!repost })
  } catch (error) {
    console.error("[v0] Error checking repost status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
