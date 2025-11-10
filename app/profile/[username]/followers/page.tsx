"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { UserListItem } from "@/components/user-list-item"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Lock } from "lucide-react"
import type { Profile } from "@/lib/types"
import Link from "next/link"

export default function FollowersPage({
  params,
}: {
  params: Promise<{ username: string }> | { username: string }
}) {
  const [username, setUsername] = useState<string>("")
  const [profile, setProfile] = useState<Profile | null>(null)
  const [followers, setFollowers] = useState<Profile[]>([])
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({})
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isPrivate, setIsPrivate] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = params instanceof Promise ? await params : params
      setUsername(resolvedParams.username)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (username) {
      loadFollowers()
    }
  }, [username])

  const loadFollowers = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      setCurrentUserId(user.id)

      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single()

      if (profileError || !profileData) {
        router.push("/feed")
        return
      }

      setProfile(profileData)

      // Check if followers list is hidden
      if (!profileData.show_followers_list && profileData.id !== user.id) {
        setIsPrivate(true)
        setIsLoading(false)
        return
      }

      // Get followers
      const { data: followsData } = await supabase
        .from("follows")
        .select(`
          follower_id,
          profiles!follows_follower_id_fkey (*)
        `)
        .eq("following_id", profileData.id)

      const followerProfiles = (followsData || []).map((f: any) => f.profiles).filter(Boolean) as Profile[]

      setFollowers(followerProfiles)

      // Check which users the current user is following
      const { data: currentUserFollows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id)

      const followingIds = new Set((currentUserFollows || []).map((f) => f.following_id))
      const followingMapData: Record<string, boolean> = {}
      followerProfiles.forEach((follower) => {
        followingMapData[follower.id] = followingIds.has(follower.id)
      })
      setFollowingMap(followingMapData)
    } catch (error) {
      console.error("Error loading followers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    setFollowingMap((prev) => ({ ...prev, [userId]: isFollowing }))
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 md:pt-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <MobileBottomNav />
      </>
    )
  }

  if (isPrivate) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen pt-14 pb-14 md:pb-6 md:pl-64 md:pt-0 flex justify-center bg-background">
          <div className="flex-1 max-w-[680px] border-x border-border">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
              <div className="flex items-center gap-4 p-4">
                <Link href={`/profile/${username}`}>
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-bold">Followers</h1>
                  <p className="text-sm text-muted-foreground">@{username}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Lock className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">This list is private</h2>
              <p className="text-muted-foreground">@{username} has chosen to hide their followers list.</p>
            </div>
          </div>
        </main>
        <MobileBottomNav />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-14 pb-14 md:pb-6 md:pl-64 md:pt-0 flex justify-center bg-background">
        <div className="flex-1 max-w-[680px] border-x border-border">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="flex items-center gap-4 p-4">
              <Link href={`/profile/${username}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Followers</h1>
                <p className="text-sm text-muted-foreground">@{username}</p>
              </div>
            </div>
          </div>

          <div>
            {followers.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">No followers yet</div>
            ) : (
              followers.map((follower) => (
                <UserListItem
                  key={follower.id}
                  user={follower}
                  currentUserId={currentUserId}
                  isFollowing={followingMap[follower.id] || false}
                  onFollowChange={handleFollowChange}
                />
              ))
            )}
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
