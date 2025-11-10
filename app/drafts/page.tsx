import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { DraftCard } from "@/components/draft-card"

export default async function DraftsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  // Fetch user's drafts
  const { data: drafts, error: draftsError } = await supabase
    .from("post_drafts")
    .select("*")
    .eq("author_id", user.id)
    .order("updated_at", { ascending: false })

  if (draftsError) {
    console.error("Error fetching drafts:", draftsError)
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-14 pb-14 md:pb-6 md:pl-60 md:pt-0 flex justify-center">
        <div className="flex-1 max-w-3xl border-x border-border">
          <div className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3">
            <h1 className="text-xl font-bold">Drafts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {drafts?.length || 0} {drafts?.length === 1 ? "draft" : "drafts"}
            </p>
          </div>

          <div className="divide-y divide-border">
            {!drafts || drafts.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-muted-foreground">No drafts yet. Save a draft from the composer!</p>
              </div>
            ) : (
              drafts.map((draft) => <DraftCard key={draft.id} draft={draft} />)
            )}
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
