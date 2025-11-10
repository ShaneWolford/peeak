import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { MessageRequestCard } from "@/components/message-request-card"

export default async function MessageRequestsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  const { data: requests } = await supabase
    .from("message_requests")
    .select(`
      *,
      sender:profiles!message_requests_sender_id_fkey(id, username, display_name, avatar_url, is_pro)
    `)
    .eq("recipient_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  return (
    <>
      <Navigation />
      <main className="mobile-screen md:min-h-screen pt-14 pb-14 md:pb-6 md:pl-64 md:pt-0 bg-background md:flex md:justify-center">
        <div className="mobile-content flex-1 max-w-[680px] md:border-x border-border overflow-y-auto">
          <div className="border-b border-border p-4 bg-background md:sticky top-14 md:top-0 z-40">
            <h1 className="text-xl font-semibold">Message Requests</h1>
            <p className="text-sm text-muted-foreground mt-1">
              People who want to message you but aren't mutual follows
            </p>
          </div>

          {!requests || requests.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No pending message requests</div>
          ) : (
            <div className="divide-y divide-border">
              {requests.map((request: any) => (
                <MessageRequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
