import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { FeedComposer } from "@/components/feed-composer"

export default async function NewPostPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-14 pb-14 md:pb-6 md:pl-60 md:pt-0 flex justify-center bg-background">
        <div className="flex-1 max-w-[630px]">
          <div className="border-b border-border bg-background">
            <div className="px-4 py-3">
              <h1 className="text-lg font-semibold">Create New Post</h1>
            </div>
          </div>
          {profile && <FeedComposer profile={profile} />}
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
