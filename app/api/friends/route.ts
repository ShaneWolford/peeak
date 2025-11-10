import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get users that the current user follows
    const { data: following, error: followingError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)

    if (followingError) throw followingError

    const followingIds = following?.map((f) => f.following_id) || []

    if (followingIds.length === 0) {
      return NextResponse.json({ friends: [] })
    }

    // Get profiles of users being followed
    const { data: friends, error: friendsError } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", followingIds)
      .order("display_name")

    if (friendsError) throw friendsError

    return NextResponse.json({ friends: friends || [] })
  } catch (error) {
    console.error("Error fetching friends:", error)
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 })
  }
}
