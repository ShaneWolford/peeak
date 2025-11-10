"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { NotificationIcon } from "./icons/notification-icon"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function LiveNotifications({ compact = false }: { compact?: boolean }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    let channel: any = null

    const fetchUnreadCount = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false)

      setUnreadCount(count || 0)
    }

    const setupRealtimeSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            setUnreadCount((prev) => prev + 1)
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchUnreadCount()
          },
        )
        .subscribe()
    }

    fetchUnreadCount()
    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  useEffect(() => {
    if (pathname === "/notifications") {
      setUnreadCount(0)
    }
  }, [pathname])

  const isActive = pathname === "/notifications"

  if (compact) {
    return (
      <button
        onClick={() => {
          window.location.href = "/notifications"
        }}
        className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <NotificationIcon className={`h-5 w-5 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    )
  }

  return (
    <Link
      href="/notifications"
      className={`flex items-center gap-4 px-4 py-3 rounded-lg text-base transition-colors relative ${
        isActive ? "font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      <div className="relative">
        <NotificationIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>
      <span>Notifications</span>
    </Link>
  )
}
