import { createClient } from "@/lib/supabase/server"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { PatchNotesContent } from "@/components/patch-notes-content"

export default async function PatchNotesPage() {
  const supabase = await createClient()

  // Fetch published patch notes
  const { data: patchNotes } = await supabase
    .from("patch_notes")
    .select(
      `
      *,
      creator:profiles!patch_notes_created_by_fkey(username, display_name)
    `,
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false })

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 bg-background">
        <PatchNotesContent patchNotes={patchNotes || []} />
      </main>
      <MobileBottomNav />
    </>
  )
}
