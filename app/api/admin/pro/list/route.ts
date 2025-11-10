import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
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

    // Get all pro users
    const { data: proUsers, error } = await supabase
      .from("pro_features")
      .select(
        `
        *,
        profiles!inner (
          id,
          username,
          display_name,
          avatar_url
        )
      `,
      )
      .eq("is_pro", true)
      .order("pro_since", { ascending: false })

    if (error) {
      console.error("Error fetching pro users:", error)
      return NextResponse.json({ error: "Failed to fetch pro users" }, { status: 500 })
    }

    // Flatten the data structure
    const formattedUsers = proUsers.map((proUser: any) => ({
      id: proUser.profiles.id,
      username: proUser.profiles.username,
      display_name: proUser.profiles.display_name,
      avatar_url: proUser.profiles.avatar_url,
      pro_since: proUser.pro_since,
      pro_expires_at: proUser.pro_expires_at,
    }))

    return NextResponse.json({ proUsers: formattedUsers })
  } catch (error) {
    console.error("Error in pro list API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
