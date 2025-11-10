"use client"

import type { Notification, Profile } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, UserPlus, Share2 } from "lucide-react"

interface NotificationsListProps {
  notifications: (Notification & { actor?: Profile })[]
}

export function NotificationsList({ notifications }: NotificationsListProps) {
  if (notifications.length === 0) {
    return <div className="p-12 text-center text-muted-foreground">No notifications yet</div>
  }

  return (
    <div className="divide-y divide-border">
      {notifications.map((notification) => {
        const actor = notification.actor
        if (!actor) return null

        const initials = actor.display_name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)

        let icon
        let message
        let linkHref = `/profile/${actor.username}`

        switch (notification.type) {
          case "like":
            icon = <Heart className="h-5 w-5 text-muted-foreground" />
            message = "liked your post"
            if (notification.post_id) {
              linkHref = `/post/${notification.post_id}`
            }
            break
          case "comment":
            icon = <MessageCircle className="h-5 w-5 text-muted-foreground" />
            message = "commented on your post"
            if (notification.post_id) {
              linkHref = `/post/${notification.post_id}`
            }
            break
          case "follow":
            icon = <UserPlus className="h-5 w-5 text-muted-foreground" />
            message = "started following you"
            linkHref = `/profile/${actor.username}`
            break
          case "share":
            icon = <Share2 className="h-5 w-5 text-muted-foreground" />
            message = "shared your post"
            if (notification.post_id) {
              linkHref = `/post/${notification.post_id}`
            }
            break
          default:
            return null
        }

        return (
          <Link key={notification.id} href={linkHref} className="flex gap-4 p-6 hover:bg-muted/30 transition-colors">
            <div className="flex-shrink-0">{icon}</div>

            <Avatar className="h-12 w-12">
              <AvatarImage src={actor.avatar_url || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="space-y-1">
                <p className="text-base">
                  <span className="font-semibold">{actor.display_name}</span>{" "}
                  <span className="text-sm text-muted-foreground">@{actor.username}</span>{" "}
                  <span className="text-muted-foreground">{message}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
