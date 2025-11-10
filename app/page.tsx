import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is logged in, redirect to feed
  if (user) {
    redirect("/feed")
  }

  // If not logged in, redirect to login
  redirect("/auth/login")
}
