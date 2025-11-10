"use client"

import { useState, useEffect } from "react"
import { NotificationIcon } from "@/components/icons/notification-icon"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import type { Notification, Profile } from "@/lib/types"

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<(Notification & { actor?: Profile })[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from("notifications")
      .select("*, actor:profiles!notifications_actor_id_fkey(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.is_read).length)
    }
  }

  const markAsRead = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false)

    setUnreadCount(0)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && unreadCount > 0) {
      markAsRead()
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <NotificationIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2 border-b border-border">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No notifications yet</div>
          ) : (
            notifications.map((notification) => {
              const actor = notification.actor
              if (!actor) return null

              const initials = actor.display_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)

              let message = ""
              let linkHref = `/profile/${actor.username}`

              switch (notification.type) {
                case "like":
                  message = "liked your post"
                  if (notification.post_id) linkHref = `/post/${notification.post_id}`
                  break
                case "comment":
                  message = "commented on your post"
                  if (notification.post_id) linkHref = `/post/${notification.post_id}`
                  break
                case "follow":
                  message = "started following you"
                  break
                case "share":
                  message = "shared your post"
                  if (notification.post_id) linkHref = `/post/${notification.post_id}`
                  break
              }

              return (
                <DropdownMenuItem key={notification.id} asChild>
                  <Link href={linkHref} className="flex gap-3 p-3 cursor-pointer">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={actor.avatar_url || undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold">{actor.display_name}</span>{" "}
                        <span className="text-xs text-muted-foreground">@{actor.username}</span> {message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              )
            })
          )}
        </div>
        <div className="p-2 border-t border-border">
          <Link href="/notifications" className="text-sm text-primary hover:underline block text-center">
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
