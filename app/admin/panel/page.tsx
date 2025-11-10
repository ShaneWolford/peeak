import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { AdminPanelContent } from "@/components/admin-panel-content"

export default async function AdminPanelPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/feed")
  }

  // Fetch site settings
  const { data: settings } = await supabase.from("site_settings").select("*")

  // Fetch recent warnings
  const { data: warnings } = await supabase
    .from("user_warnings")
    .select(
      `
      *,
      user:profiles!user_warnings_user_id_fkey(id, username, display_name, avatar_url),
      issuer:profiles!user_warnings_issued_by_fkey(id, username, display_name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(10)

  // Fetch banned users
  const { data: bannedUsers } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, is_banned, ban_expires_at")
    .eq("is_banned", true)
    .order("ban_expires_at", { ascending: true })

  const { data: appeals } = await supabase
    .from("appeals")
    .select(
      `
      *,
      user:profiles!appeals_user_id_fkey(id, username, display_name, avatar_url, is_banned, ban_expires_at)
    `,
    )
    .order("created_at", { ascending: false })

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 bg-muted/30">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">Manage site settings, users, and moderation</p>
          </div>

          <AdminPanelContent
            initialSettings={settings || []}
            initialWarnings={warnings || []}
            initialBannedUsers={bannedUsers || []}
            initialAppeals={appeals || []}
          />
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
