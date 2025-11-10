import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { PeaksFeed } from "@/components/peaks-feed"

export default async function PeaksPage({
  searchParams,
}: {
  searchParams: { postId?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  return (
    <>
      <div className="hidden md:block">
        <Navigation />
      </div>
      <main className="h-dvh md:h-screen md:pl-64 bg-black">
        <PeaksFeed initialPostId={searchParams.postId} />
      </main>
      <MobileBottomNav />
    </>
  )
}
