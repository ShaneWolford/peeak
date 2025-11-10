import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { PeaksUpload } from "@/components/peaks-upload"

export default async function PeaksUploadPage() {
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
      <Navigation />
      <main className="min-h-screen pt-14 pb-14 md:pb-6 md:pl-64 md:pt-0 bg-background">
        <div className="max-w-2xl mx-auto p-6">
          <PeaksUpload />
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
