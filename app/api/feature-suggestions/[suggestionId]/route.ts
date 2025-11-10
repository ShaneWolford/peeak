import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isAdmin } from "@/lib/admin"

export async function DELETE(request: Request, { params }: { params: Promise<{ suggestionId: string }> }) {
  try {
    const { suggestionId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or owner of the suggestion
    const admin = await isAdmin(user.email)

    if (!admin) {
      // Check if user owns this suggestion
      const { data: suggestion } = await supabase
        .from("feature_suggestions")
        .select("user_id")
        .eq("id", suggestionId)
        .single()

      if (!suggestion || suggestion.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const { error } = await supabase.from("feature_suggestions").delete().eq("id", suggestionId)

    if (error) {
      console.error("[v0] Error deleting feature suggestion:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/feature-suggestions/[suggestionId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
