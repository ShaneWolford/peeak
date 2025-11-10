import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { reportId } = await params
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.email !== "shaneswolfords@gmail.com") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    const { status } = await request.json()

    // Update the bug report
    const updateData: any = { status, updated_at: new Date().toISOString() }

    // If marking as resolved/fixed, set completed_at
    if (status === "resolved" || status === "fixed") {
      updateData.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase.from("bug_reports").update(updateData).eq("id", reportId).select().single()

    if (error) {
      console.error("[v0] Error updating bug report:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in PATCH /api/bug-reports/[reportId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { reportId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or owner of the report
    const isAdmin = user.email === "shaneswolfords@gmail.com"

    if (!isAdmin) {
      // Check if user owns this report
      const { data: report } = await supabase.from("bug_reports").select("user_id").eq("id", reportId).single()

      if (!report || report.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const { error } = await supabase.from("bug_reports").delete().eq("id", reportId)

    if (error) {
      console.error("[v0] Error deleting bug report:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/bug-reports/[reportId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
