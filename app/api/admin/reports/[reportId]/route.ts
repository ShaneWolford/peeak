import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkAdmin } from "@/lib/check-admin"

export async function PATCH(request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const { reportId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await checkAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { status, admin_notes, resolved_by } = body

    const updateData: any = {
      status,
      admin_notes,
      resolved_by,
    }

    if (status === "resolved" || status === "dismissed") {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data, error } = await supabase.from("reports").update(updateData).eq("id", reportId).select().single()

    if (error) {
      console.error("Error updating report:", error)
      return NextResponse.json({ error: "Failed to update report" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PATCH /api/admin/reports/[reportId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
