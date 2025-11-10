import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to check admin status
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    // Check if user owns the post or is admin
    const { data: post, error: postError } = await supabase.from("posts").select("author_id").eq("id", postId).single()

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const isOwner = post.author_id === user.id
    const isAdmin = profile?.is_admin === true

    console.log("[v0] Delete post attempt:", { postId, userId: user.id, isOwner, isAdmin })

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "You can only delete your own posts" }, { status: 403 })
    }

    // Delete the post (cascade will handle related data)
    const { error: deleteError } = await supabase.from("posts").delete().eq("id", postId)

    if (deleteError) {
      console.error("[v0] Error deleting post:", deleteError)
      throw deleteError
    }

    console.log("[v0] Post deleted successfully:", { postId, isAdmin })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting post:", error)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}
