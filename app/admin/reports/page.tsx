import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { checkAdmin } from "@/lib/check-admin"
import { ReportsManager } from "@/components/reports-manager"

export default async function AdminReportsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const isAdmin = await checkAdmin(user.id)

  if (!isAdmin) {
    redirect("/feed")
  }

  // Fetch all reports with related data
  const { data: reports, error } = await supabase
    .from("reports")
    .select(
      `
      *,
      reporter:profiles!reports_reporter_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      ),
      reported_user:profiles!reports_reported_user_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      ),
      reported_post:posts (
        id,
        content,
        created_at
      ),
      reported_comment:comments (
        id,
        content,
        created_at
      ),
      resolved_by_user:profiles!reports_resolved_by_fkey (
        id,
        username,
        display_name
      )
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching reports:", error)
    return <div>Error loading reports</div>
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Reports</h1>
        <p className="text-muted-foreground">Review and manage user-reported content</p>
      </div>

      <ReportsManager reports={reports || []} currentUserId={user.id} />
    </div>
  )
}
