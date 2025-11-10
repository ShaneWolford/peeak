import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { ReferralContent } from "@/components/referral-content"

export default async function ReferralsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile with referral data
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, referral_code, referred_by")
    .eq("id", user.id)
    .single()

  const { data: referredUsers } = await supabase
    .from("referrals")
    .select(`
      id,
      created_at,
      referred_user:profiles!referrals_referred_user_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false })

  // Count referrals
  const { count: referralCount } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", user.id)

  // Get referral badge
  const { data: referralBadge } = await supabase.from("badges").select("*").eq("name", "Referral Master").single()

  // Check if user has the badge
  const { data: userBadge } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", user.id)
    .eq("badge_id", referralBadge?.id)
    .single()

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 bg-background">
        <div className="max-w-2xl mx-auto p-6">
          <ReferralContent
            referralCode={profile?.referral_code || ""}
            referralCount={referralCount || 0}
            hasBadge={!!userBadge}
            badgeIcon={referralBadge?.icon_url || ""}
            badgeName={referralBadge?.name || ""}
            badgeDescription={referralBadge?.description || ""}
            referredUsers={referredUsers || []}
          />
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
