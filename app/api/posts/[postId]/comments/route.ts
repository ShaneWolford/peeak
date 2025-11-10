import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const supabase = await createClient()
    const { postId } = await params

    // Get limit from query params (default to 10)
    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    // Fetch comments with author profiles
    const { data: comments, error } = await supabase
      .from("comments")
      .select(`
        *,
        profiles!comments_author_id_fkey (*)
      `)
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ comments: comments || [] })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}
