import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { BadgeSelector } from "@/components/badge-selector"

export default async function BadgesSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's profile with active badge
  const { data: profile } = await supabase.from("profiles").select("active_badge_id").eq("id", user.id).single()

  // Get all badges assigned to this user
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select(`
      badge_id,
      badges (
        id,
        name,
        description,
        icon_url,
        color
      )
    `)
    .eq("user_id", user.id)

  const badges = userBadges?.map((ub: any) => ub.badges).filter(Boolean) || []

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 bg-background">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Badge Settings</h1>
            <p className="text-muted-foreground">Choose which badge to display on your profile</p>
          </div>

          <BadgeSelector badges={badges} activeBadgeId={profile?.active_badge_id || null} />
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
