import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BannedContent } from "@/components/banned-content"

export default async function BannedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is actually banned
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned, ban_expires_at")
    .eq("id", user.id)
    .single()

  if (!profile?.is_banned) {
    redirect("/feed")
  }

  // Check if user has already submitted an appeal
  const { data: existingAppeal } = await supabase
    .from("appeals")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .single()

  return <BannedContent banExpiresAt={profile.ban_expires_at} existingAppeal={existingAppeal} />
}
