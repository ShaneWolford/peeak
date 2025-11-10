import { createClient } from "@/lib/supabase/client"

export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", userId).single()

    if (error || !data) return false
    return data.is_admin || false
  } catch {
    return false
  }
}

export { checkIsAdmin as checkAdmin }
