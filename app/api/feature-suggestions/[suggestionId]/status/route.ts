import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ suggestionId: string }> }) {
  try {
    const { suggestionId } = await params
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.email !== "shaneswolfords@gmail.com") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    const { status } = await request.json()

    // Update the feature suggestion
    const updateData: any = { status, updated_at: new Date().toISOString() }

    // If marking as completed or approved, set completed_at
    if (status === "completed" || status === "approved") {
      updateData.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("feature_suggestions")
      .update(updateData)
      .eq("id", suggestionId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating feature suggestion:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in PATCH /api/feature-suggestions/[suggestionId]/status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
