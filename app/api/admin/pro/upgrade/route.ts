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

    const { userId, duration } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("[v0] Upgrading user to Pro:", { userId, duration })

    // Calculate expiration date
    const proExpiresAt = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString() : null

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        is_pro: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (profileError) {
      console.error("[v0] Error updating profile:", profileError)
      return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
    }

    console.log("[v0] Profile updated successfully")

    const { data: proFeature, error: proError } = await supabase
      .from("pro_features")
      .upsert(
        {
          user_id: userId,
          is_pro: true,
          pro_since: new Date().toISOString(),
          pro_expires_at: proExpiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select()
      .single()

    if (proError) {
      console.error("[v0] Error updating pro features:", proError)
      return NextResponse.json({ error: "Failed to create Pro feature record" }, { status: 500 })
    }

    console.log("[v0] Pro features updated successfully:", proFeature)

    const { data: verifiedBadge } = await supabase.from("badges").select("id").eq("name", "Verified Pro").single()

    if (verifiedBadge) {
      console.log("[v0] Assigning Verified Pro badge:", verifiedBadge.id)

      const { error: badgeError } = await supabase.from("user_badges").upsert(
        {
          user_id: userId,
          badge_id: verifiedBadge.id,
          assigned_by: user.id,
          assigned_at: new Date().toISOString(),
        },
        { onConflict: "user_id,badge_id", ignoreDuplicates: true },
      )

      if (badgeError) {
        console.error("[v0] Error assigning badge:", badgeError)
      } else {
        console.log("[v0] Badge assigned successfully")
      }
    }

    return NextResponse.json({ success: true, proFeature })
  } catch (error) {
    console.error("[v0] Error upgrading user to pro:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
