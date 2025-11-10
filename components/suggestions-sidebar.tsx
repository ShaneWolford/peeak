"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export function SuggestionsSidebar() {
  const [suggestions, setSuggestions] = useState<Profile[]>([])
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({})
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  useEffect(() => {
    loadSuggestions()
  }, [])

  const loadSuggestions = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Get users the current user is following
      const { data: following } = await supabase.from("follows").select("following_id").eq("follower_id", user.id)

      const followingIds = following?.map((f) => f.following_id) || []

      // Get users who follow the current user
      const { data: followers } = await supabase.from("follows").select("follower_id").eq("following_id", user.id)

      const followerIds = followers?.map((f) => f.follower_id) || []

      // Get users that your following are following (friends of friends)
      let friendsOfFriends: string[] = []
      if (followingIds.length > 0) {
        const { data: fofData } = await supabase
          .from("follows")
          .select("following_id")
          .in("follower_id", followingIds)
          .not("following_id", "eq", user.id)
          .not("following_id", "in", `(${followingIds.join(",")})`)

        friendsOfFriends = fofData?.map((f) => f.following_id) || []
      }

      // Prioritize: 1) Followers you don't follow back, 2) Friends of friends, 3) Random users
      let suggestedProfiles: Profile[] = []

      // First, get followers you don't follow back
      const followersNotFollowingBack = followerIds.filter((id) => !followingIds.includes(id))
      if (followersNotFollowingBack.length > 0) {
        const { data: followerProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", followersNotFollowingBack)
          .limit(3)

        if (followerProfiles) {
          suggestedProfiles = [...suggestedProfiles, ...followerProfiles]
        }
      }

      // Then, get friends of friends
      if (suggestedProfiles.length < 5 && friendsOfFriends.length > 0) {
        const { data: fofProfiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", friendsOfFriends)
          .limit(5 - suggestedProfiles.length)

        if (fofProfiles) {
          suggestedProfiles = [...suggestedProfiles, ...fofProfiles]
        }
      }

      // Finally, fill with random users if needed
      if (suggestedProfiles.length < 5) {
        const excludeIds = [...followingIds, user.id, ...suggestedProfiles.map((p) => p.id)]
        const { data: randomProfiles } = await supabase
          .from("profiles")
          .select("*")
          .not("id", "in", `(${excludeIds.join(",")})`)
          .limit(5 - suggestedProfiles.length)

        if (randomProfiles) {
          suggestedProfiles = [...suggestedProfiles, ...randomProfiles]
        }
      }

      setSuggestions(suggestedProfiles)
      // Initialize following states
      const states: Record<string, boolean> = {}
      suggestedProfiles.forEach((p) => {
        states[p.id] = false
      })
      setFollowingStates(states)
    } catch (error) {
      console.error("Error loading suggestions:", error)
    }
  }

  const handleFollow = async (userId: string) => {
    setLoadingStates((prev) => ({ ...prev, [userId]: true }))
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setFollowingStates((prev) => ({ ...prev, [userId]: data.following }))
        if (data.following) {
          toast({
            title: "Following",
            description: "You are now following this user.",
          })
          // Remove from suggestions after following
          setSuggestions((prev) => prev.filter((p) => p.id !== userId))
        }
      }
    } catch (error) {
      console.error("Error following user:", error)
      toast({
        title: "Error",
        description: "Failed to follow user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingStates((prev) => ({ ...prev, [userId]: false }))
    }
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <aside className="hidden lg:block w-80 flex-shrink-0 p-6 sticky top-0 h-screen overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Suggestions for you</h2>
          <button className="text-xs font-semibold hover:text-muted-foreground transition-colors">See All</button>
        </div>

        <div className="space-y-3">
          {suggestions.map((profile) => {
            const initials = profile.display_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)

            return (
              <div key={profile.id} className="flex items-center justify-between gap-3">
                <Link href={`/profile/${profile.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{profile.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-semibold flex-shrink-0"
                  onClick={() => handleFollow(profile.id)}
                  disabled={loadingStates[profile.id]}
                >
                  {loadingStates[profile.id] ? "..." : "Follow"}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
