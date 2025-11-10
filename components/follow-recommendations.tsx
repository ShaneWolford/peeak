"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import type { Profile } from "@/lib/types"

interface FollowRecommendationsProps {
  justFollowedUserId: string
}

export function FollowRecommendations({ justFollowedUserId }: FollowRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Profile[]>([])
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({})
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadRecommendations()
  }, [justFollowedUserId])

  const loadRecommendations = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get users that the just-followed user follows
      const { data: mutualFollows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", justFollowedUserId)

      const mutualFollowIds = mutualFollows?.map((f) => f.following_id) || []

      // Get users the current user already follows
      const { data: currentUserFollows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id)

      const alreadyFollowingIds = new Set(currentUserFollows?.map((f) => f.following_id) || [])
      alreadyFollowingIds.add(user.id) // Don't recommend yourself

      // Filter out users already followed
      const recommendedIds = mutualFollowIds.filter((id) => !alreadyFollowingIds.has(id))

      if (recommendedIds.length === 0) {
        // If no mutual follows, get popular users (Pro users or users with most followers)
        const { data: popularUsers } = await supabase
          .from("profiles")
          .select(`
            *,
            active_badge:badges!profiles_active_badge_id_fkey (
              id,
              name,
              description,
              icon_url,
              color
            )
          `)
          .eq("is_pro", true)
          .limit(5)

        const filteredPopular = popularUsers?.filter((p) => !alreadyFollowingIds.has(p.id)) || []
        setRecommendations(filteredPopular.slice(0, 3))
      } else {
        // Get profiles for recommended users
        const { data: recommendedProfiles } = await supabase
          .from("profiles")
          .select(`
            *,
            active_badge:badges!profiles_active_badge_id_fkey (
              id,
              name,
              description,
              icon_url,
              color
            )
          `)
          .in("id", recommendedIds.slice(0, 5))

        setRecommendations(recommendedProfiles || [])
      }
    } catch (error) {
      console.error("Error loading recommendations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollow = async (userId: string) => {
    setLoadingMap((prev) => ({ ...prev, [userId]: true }))

    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setFollowingMap((prev) => ({ ...prev, [userId]: data.following }))

        // Remove from recommendations if followed
        if (data.following) {
          setRecommendations((prev) => prev.filter((u) => u.id !== userId))
        }
      }
    } catch (error) {
      console.error("Error following user:", error)
    } finally {
      setLoadingMap((prev) => ({ ...prev, [userId]: false }))
    }
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      const newPosition = scrollContainerRef.current.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount)
      scrollContainerRef.current.scrollTo({
        left: newPosition,
        behavior: "smooth",
      })
    }
  }

  if (isLoading || recommendations.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-base">Similar accounts</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">People you might also like</p>

      {/* Scroll buttons */}
      <div className="absolute right-0 top-0 flex gap-2 z-10">
        <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" onClick={() => scroll("left")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" onClick={() => scroll("right")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Horizontal scrolling container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style jsx>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {recommendations.map((user) => {
          const initials = user.display_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)

          return (
            <Card
              key={user.id}
              className="flex-shrink-0 w-48 p-4 space-y-3 border-2 hover:border-primary/50 transition-colors"
            >
              <Link href={`/profile/${user.username}`} className="flex flex-col items-center">
                <Avatar className="h-16 w-16 mb-2">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <p className="font-semibold text-sm truncate max-w-full">{user.display_name}</p>
                    {user.is_pro && (
                      <div className="flex-shrink-0 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs px-1.5 py-0.5 font-bold">
                        PRO
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                </div>
              </Link>
              <Button
                size="sm"
                variant={followingMap[user.id] ? "outline" : "default"}
                onClick={() => handleFollow(user.id)}
                disabled={loadingMap[user.id]}
                className="w-full"
              >
                {followingMap[user.id] ? "Following" : "Follow"}
              </Button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
