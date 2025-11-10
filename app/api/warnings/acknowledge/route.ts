import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { warningId } = await request.json()

    if (!warningId) {
      return NextResponse.json({ error: "Warning ID is required" }, { status: 400 })
    }

    // Update the warning to mark it as acknowledged
    const { error } = await supabase
      .from("user_warnings")
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", warningId)
      .eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error acknowledging warning:", error)
    return NextResponse.json({ error: "Failed to acknowledge warning" }, { status: 500 })
  }
}
