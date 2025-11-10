import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user owns the post
    const { data: post, error: postError } = await supabase.from("posts").select("author_id").eq("id", postId).single()

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (post.author_id !== user.id) {
      return NextResponse.json({ error: "You can only edit your own posts" }, { status: 403 })
    }

    const body = await request.json()
    const { content, media_urls, media_types } = body

    // Get original post data for edit history
    const { data: originalPost } = await supabase
      .from("posts")
      .select("content, media_urls, media_types")
      .eq("id", postId)
      .single()

    // Save edit history
    if (originalPost) {
      await supabase.from("post_edits").insert({
        post_id: postId,
        content: originalPost.content,
        media_urls: originalPost.media_urls,
        media_types: originalPost.media_types,
        edited_by: user.id,
      })
    }

    // Update the post
    const { error: updateError } = await supabase
      .from("posts")
      .update({
        content,
        media_urls,
        media_types,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error editing post:", error)
    return NextResponse.json({ error: "Failed to edit post" }, { status: 500 })
  }
}
