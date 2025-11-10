"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { Profile } from "@/lib/types"
import Link from "next/link"
import { useState } from "react"
import { Loader2 } from "lucide-react"

interface UserListItemProps {
  user: Profile
  currentUserId: string
  isFollowing: boolean
  onFollowChange?: (userId: string, isFollowing: boolean) => void
}

export function UserListItem({
  user,
  currentUserId,
  isFollowing: initialIsFollowing,
  onFollowChange,
}: UserListItemProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const isOwnProfile = user.id === currentUserId

  const initials = user.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handleFollow = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}/follow`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.following)
        onFollowChange?.(user.id, data.following)
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
      <Link href={`/profile/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{user.display_name}</p>
          <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
          {user.bio && <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{user.bio}</p>}
        </div>
      </Link>
      {!isOwnProfile && (
        <Button
          variant={isFollowing ? "outline" : "default"}
          size="sm"
          onClick={handleFollow}
          disabled={isLoading}
          className="ml-3 flex-shrink-0"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  )
}
