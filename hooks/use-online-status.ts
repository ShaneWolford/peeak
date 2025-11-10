"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function useOnlineStatus(userId: string | null) {
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // Set user as online
    const setOnline = async () => {
      await supabase
        .from("profiles")
        .update({
          is_online: true,
          last_seen: new Date().toISOString(),
        })
        .eq("id", userId)
    }

    // Set user as offline
    const setOffline = async () => {
      await supabase
        .from("profiles")
        .update({
          is_online: false,
          last_seen: new Date().toISOString(),
        })
        .eq("id", userId)
    }

    // Update online status every 30 seconds
    const updateInterval = setInterval(setOnline, 30000)

    // Set online on mount
    setOnline()

    // Set offline on unmount or page unload
    const handleBeforeUnload = () => {
      setOffline()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      clearInterval(updateInterval)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      setOffline()
    }
  }, [userId])
}
