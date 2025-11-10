import { createClient } from "@/lib/supabase/server"

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return false
  }

  return user.email === "shaneswolfords@gmail.com"
}

export async function requireAdmin() {
  const admin = await isAdmin()

  if (!admin) {
    throw new Error("Unauthorized: Admin access required")
  }

  return true
}
