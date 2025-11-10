import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { NotificationsList } from "@/components/notifications-list"

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  // Fetch notifications with actor profiles
  const { data: notifications, error: notificationsError } = await supabase
    .from("notifications")
    .select(`
      *,
      actor:profiles!notifications_actor_id_fkey (*),
      post:posts (*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (notificationsError) {
    console.error("Error fetching notifications:", notificationsError)
  }

  // Mark all as read
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false)

  return (
    <>
      <Navigation />
      <main className="mobile-screen md:min-h-screen pt-14 pb-14 md:pb-6 md:pl-64 md:pt-0 bg-background">
        <div className="mobile-content h-full overflow-y-auto md:max-w-2xl md:mx-auto">
          <div className="border-b border-border p-6 bg-background md:sticky top-14 md:top-0 z-40">
            <h1 className="text-2xl font-bold">Notifications</h1>
          </div>

          <NotificationsList notifications={notifications || []} />
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
