import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { badgeId } = await request.json()

    // If badgeId is provided, verify the user has this badge
    if (badgeId) {
      const { data: userBadge } = await supabase
        .from("user_badges")
        .select("id")
        .eq("user_id", user.id)
        .eq("badge_id", badgeId)
        .single()

      if (!userBadge) {
        return NextResponse.json({ error: "You don't have this badge" }, { status: 403 })
      }
    }

    // Update the user's active badge
    const { error } = await supabase.from("profiles").update({ active_badge_id: badgeId }).eq("id", user.id)

    if (error) {
      console.error("Error updating active badge:", error)
      return NextResponse.json({ error: "Failed to update badge" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in active badge route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
