import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
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

    const { userId } = await params
    const { badgeId } = await request.json()

    // Assign badge to user
    const { error } = await supabase.from("user_badges").insert({
      user_id: userId,
      badge_id: badgeId,
      assigned_by: user.id,
    })

    if (error) {
      console.error("Error assigning badge:", error)
      return NextResponse.json({ error: "Failed to assign badge" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in badge assignment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
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

    const { userId } = await params
    const { badgeId } = await request.json()

    // Remove badge from user
    const { error } = await supabase.from("user_badges").delete().eq("user_id", userId).eq("badge_id", badgeId)

    if (error) {
      console.error("Error removing badge:", error)
      return NextResponse.json({ error: "Failed to remove badge" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in badge removal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
