import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET endpoint to check bookmark status
export async function GET(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ bookmarked: false })
    }

    const { data: bookmark } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .maybeSingle()

    return NextResponse.json({ bookmarked: !!bookmark })
  } catch (error) {
    console.error("Error checking bookmark status:", error)
    return NextResponse.json({ bookmarked: false })
  }
}

// POST endpoint to toggle bookmark
export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .maybeSingle()

    if (existingBookmark) {
      // Remove bookmark
      const { error } = await supabase.from("bookmarks").delete().eq("id", existingBookmark.id)

      if (error) throw error

      return NextResponse.json({ bookmarked: false })
    } else {
      // Add bookmark
      const { error } = await supabase.from("bookmarks").insert({
        user_id: user.id,
        post_id: postId,
      })

      if (error) throw error

      return NextResponse.json({ bookmarked: true })
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error)
    return NextResponse.json({ error: "Failed to toggle bookmark" }, { status: 500 })
  }
}
