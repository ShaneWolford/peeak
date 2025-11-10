import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { adminNotes } = await request.json()

    // Get appeal details
    const { data: appeal } = await supabase.from("appeals").select("user_id").eq("id", params.id).single()

    if (!appeal) {
      return NextResponse.json({ error: "Appeal not found" }, { status: 404 })
    }

    // Unban the user
    const { error: unbanError } = await supabase
      .from("profiles")
      .update({ is_banned: false, ban_expires_at: null })
      .eq("id", appeal.user_id)

    if (unbanError) throw unbanError

    // Update appeal status
    const { error: appealError } = await supabase
      .from("appeals")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        admin_notes: adminNotes || null,
      })
      .eq("id", params.id)

    if (appealError) throw appealError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error approving appeal:", error)
    return NextResponse.json({ error: "Failed to approve appeal" }, { status: 500 })
  }
}
