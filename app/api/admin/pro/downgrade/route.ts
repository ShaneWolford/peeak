import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("[v0] Downgrading user from Pro:", userId)

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        is_pro: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (profileError) {
      console.error("[v0] Error updating profile:", profileError)
      return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
    }

    const { error: proError } = await supabase.from("pro_features").upsert(
      {
        user_id: userId,
        is_pro: false,
        pro_expires_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

    if (proError) {
      console.error("[v0] Error downgrading pro features:", proError)
    }

    const { data: verifiedBadge } = await supabase.from("badges").select("id").eq("name", "Verified Pro").single()

    if (verifiedBadge) {
      await supabase.from("user_badges").delete().eq("user_id", userId).eq("badge_id", verifiedBadge.id)
      console.log("[v0] Verified badge removed")
    }

    console.log("[v0] User downgraded from Pro successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error downgrading user from pro:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
