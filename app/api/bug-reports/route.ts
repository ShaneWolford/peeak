import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: reports, error: reportsError } = await supabase
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false })

    if (reportsError) {
      console.error("Error fetching bug reports:", reportsError)
      return NextResponse.json({ error: "Failed to fetch bug reports", details: reportsError.message }, { status: 500 })
    }

    if (reports && reports.length > 0) {
      const userIds = [...new Set(reports.map((r) => r.user_id))]

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds)

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError)
      }

      const reportsWithProfiles = reports.map((report) => ({
        ...report,
        profiles: profiles?.find((p) => p.id === report.user_id) || null,
      }))

      return NextResponse.json(reportsWithProfiles)
    }

    return NextResponse.json(reports || [])
  } catch (error) {
    console.error("Error in bug reports GET:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, category, severity } = await request.json()

    if (!title || !description || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: report, error } = await supabase
      .from("bug_reports")
      .insert({
        user_id: user.id,
        title,
        description,
        category,
        severity: severity || "medium",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating bug report:", error)
      return NextResponse.json({ error: "Failed to create bug report" }, { status: 500 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("Error in bug reports POST:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
