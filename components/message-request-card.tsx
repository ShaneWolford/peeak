"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Loader2 } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

interface MessageRequestCardProps {
  request: {
    id: string
    sender: {
      id: string
      username: string
      display_name: string
      avatar_url: string | null
      is_pro: boolean
    }
    message: string | null
    created_at: string
  }
}

export function MessageRequestCard({ request }: MessageRequestCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const initials = request.sender.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/message-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      })

      if (response.ok) {
        router.push(`/messages/${request.sender.username}`)
      }
    } catch (error) {
      console.error("[v0] Error accepting request:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecline = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/message-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "declined" }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("[v0] Error declining request:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${request.sender.username}`}>
          <Avatar className="h-12 w-12">
            <AvatarImage src={request.sender.avatar_url || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/profile/${request.sender.username}`} className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm">{request.sender.display_name}</p>
            {request.sender.is_pro && (
              <Badge variant="secondary" className="gap-1 text-xs h-5">
                <Crown className="h-3 w-3" />
                Pro
              </Badge>
            )}
          </Link>
          <p className="text-sm text-muted-foreground mb-1">@{request.sender.username}</p>

          {request.message && (
            <p className="text-sm text-foreground mb-3 p-3 bg-muted/50 rounded-lg border border-border">
              {request.message}
            </p>
          )}

          <p className="text-xs text-muted-foreground mb-3">
            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
          </p>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleAccept} disabled={isLoading} className="flex-1">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDecline}
              disabled={isLoading}
              className="flex-1 bg-transparent"
            >
              Decline
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
