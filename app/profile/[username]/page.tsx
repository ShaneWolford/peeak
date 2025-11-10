"use client"

import { useEffect, useState } from "react"
import { notFound, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { PostCard } from "@/components/post-card"
import { FollowRecommendations } from "@/components/follow-recommendations"
import Link from "next/link"
import type { Post, Profile } from "@/lib/types"
import { Loader2, MapPin, Globe, Calendar } from "lucide-react"
import { BadgeIcon } from "@/components/badge-icon" // Import BadgeIcon component

interface BadgeType {
  id: string
  name: string
  description: string
  icon_url: string
  color: string
}

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }> | { username: string }
}) {
  const [username, setUsername] = useState<string>("")
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<(Post & { profiles: Profile })[]>([])
  const [activeTab, setActiveTab] = useState<"posts" | "reposts" | "bookmarks">("posts")
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowingBack, setIsFollowingBack] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [isMessageLoading, setIsMessageLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [activeBadge, setActiveBadge] = useState<BadgeType | null>(null)
  const [proTheme, setProTheme] = useState<any>(null)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [justFollowedUserId, setJustFollowedUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = params instanceof Promise ? await params : params
      const reservedRoutes = ["edit", "settings"]
      if (reservedRoutes.includes(resolvedParams.username)) {
        setIsLoading(false)
        return
      }
      setUsername(resolvedParams.username)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (username) {
      loadProfile()
    }
  }, [username])

  useEffect(() => {
    if (profile) {
      loadProfile()
    }
  }, [activeTab])

  const loadProfile = async () => {
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

      const { data: profileData, error: profileError } = await supabase
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
        .eq("username", username)
        .single()

      if (profileError || !profileData) {
        notFound()
        return
      }

      setProfile(profileData)
      setIsOwnProfile(profileData.id === user.id)
      setActiveBadge(profileData.active_badge || null)

      const [followData, followBackData, followersResult, followingResult, proData] = await Promise.all([
        supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", profileData.id)
          .maybeSingle(),
        supabase
          .from("follows")
          .select("id")
          .eq("follower_id", profileData.id)
          .eq("following_id", user.id)
          .maybeSingle(),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", profileData.id),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", profileData.id),
        profileData.is_pro
          ? supabase.from("pro_features").select("profile_theme").eq("user_id", profileData.id).single()
          : Promise.resolve({ data: null }),
      ])

      setIsFollowing(!!followData.data)
      setIsFollowingBack(!!followBackData.data)
      setFollowersCount(followersResult.count || 0)
      setFollowingCount(followingResult.count || 0)

      if (proData?.data?.profile_theme) {
        setProTheme(proData.data.profile_theme)
      }

      if (activeTab === "posts") {
        const { data: postsData } = await supabase
          .from("posts")
          .select(`
            *,
            profiles!posts_author_id_fkey (
              *,
              active_badge:badges!profiles_active_badge_id_fkey (
                id,
                name,
                description,
                icon_url,
                color
              )
            )
          `)
          .eq("author_id", profileData.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })

        if (postsData && postsData.length > 0) {
          const postIds = postsData.map((p) => p.id)

          const [likesData, commentsData, repostsData, userLikesData] = await Promise.all([
            supabase.from("likes").select("post_id").in("post_id", postIds),
            supabase.from("comments").select("post_id").eq("is_deleted", false).in("post_id", postIds),
            supabase.from("reposts").select("post_id").in("post_id", postIds),
            supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds),
          ])

          const likesMap = new Map<string, number>()
          const commentsMap = new Map<string, number>()
          const repostsMap = new Map<string, number>()
          const userLikesSet = new Set(userLikesData.data?.map((l) => l.post_id) || [])

          likesData.data?.forEach((like) => {
            likesMap.set(like.post_id, (likesMap.get(like.post_id) || 0) + 1)
          })
          commentsData.data?.forEach((comment) => {
            commentsMap.set(comment.post_id, (commentsMap.get(comment.post_id) || 0) + 1)
          })
          repostsData.data?.forEach((repost) => {
            repostsMap.set(repost.post_id, (repostsMap.get(repost.post_id) || 0) + 1)
          })

          const postsWithEngagement = postsData.map((post) => ({
            ...post,
            likes_count: likesMap.get(post.id) || 0,
            comments_count: commentsMap.get(post.id) || 0,
            reposts_count: repostsMap.get(post.id) || 0,
            is_liked: userLikesSet.has(post.id),
          }))

          setPosts(postsWithEngagement as (Post & { profiles: Profile })[])
        } else {
          setPosts([])
        }
      } else if (activeTab === "bookmarks") {
        // Only fetch bookmarks for own profile
        if (profileData.id !== user.id) {
          setPosts([])
        } else {
          const { data: bookmarksData } = await supabase
            .from("bookmarks")
            .select(`
              post_id,
              posts (
                *,
                profiles!posts_author_id_fkey (
                  *,
                  active_badge:badges!profiles_active_badge_id_fkey (
                    id,
                    name,
                    description,
                    icon_url,
                    color
                  )
                )
              )
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

          const validBookmarks = (bookmarksData || []).filter((bookmark) => bookmark.posts)

          if (validBookmarks.length > 0) {
            const postIds = validBookmarks.map((bookmark) => (bookmark.posts as any).id)

            const [likesData, commentsData, repostsData, userLikesData] = await Promise.all([
              supabase.from("likes").select("post_id").in("post_id", postIds),
              supabase.from("comments").select("post_id").eq("is_deleted", false).in("post_id", postIds),
              supabase.from("reposts").select("post_id").in("post_id", postIds),
              supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds),
            ])

            const likesMap = new Map<string, number>()
            const commentsMap = new Map<string, number>()
            const repostsMap = new Map<string, number>()
            const userLikesSet = new Set(userLikesData.data?.map((l) => l.post_id) || [])

            likesData.data?.forEach((like) => {
              likesMap.set(like.post_id, (likesMap.get(like.post_id) || 0) + 1)
            })
            commentsData.data?.forEach((comment) => {
              commentsMap.set(comment.post_id, (commentsMap.get(comment.post_id) || 0) + 1)
            })
            repostsData.data?.forEach((repost) => {
              repostsMap.set(repost.post_id, (repostsMap.get(repost.post_id) || 0) + 1)
            })

            const bookmarksWithEngagement = validBookmarks.map((bookmark) => {
              const post = bookmark.posts as any
              return {
                ...post,
                likes_count: likesMap.get(post.id) || 0,
                comments_count: commentsMap.get(post.id) || 0,
                reposts_count: repostsMap.get(post.id) || 0,
                is_liked: userLikesSet.has(post.id),
              }
            })

            setPosts(bookmarksWithEngagement as (Post & { profiles: Profile })[])
          } else {
            setPosts([])
          }
        }
      } else {
        const { data: repostsData } = await supabase
          .from("reposts")
          .select(`
            created_at,
            posts (
              *,
              profiles!posts_author_id_fkey (
                *,
                active_badge:badges!profiles_active_badge_id_fkey (
                  id,
                  name,
                  description,
                  icon_url,
                  color
                )
              )
            )
          `)
          .eq("user_id", profileData.id)
          .order("created_at", { ascending: false })

        const validReposts = (repostsData || []).filter((repost) => repost.posts)

        if (validReposts.length > 0) {
          const postIds = validReposts.map((repost) => (repost.posts as any).id)

          const [likesData, commentsData, repostsCount, userLikesData] = await Promise.all([
            supabase.from("likes").select("post_id").in("post_id", postIds),
            supabase.from("comments").select("post_id").eq("is_deleted", false).in("post_id", postIds),
            supabase.from("reposts").select("post_id").in("post_id", postIds),
            supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds),
          ])

          const likesMap = new Map<string, number>()
          const commentsMap = new Map<string, number>()
          const repostsMap = new Map<string, number>()
          const userLikesSet = new Set(userLikesData.data?.map((l) => l.post_id) || [])

          likesData.data?.forEach((like) => {
            likesMap.set(like.post_id, (likesMap.get(like.post_id) || 0) + 1)
          })
          commentsData.data?.forEach((comment) => {
            commentsMap.set(comment.post_id, (commentsMap.get(comment.post_id) || 0) + 1)
          })
          repostsCount.data?.forEach((repost) => {
            repostsMap.set(repost.post_id, (repostsMap.get(repost.post_id) || 0) + 1)
          })

          const repostsWithEngagement = validReposts.map((repost) => {
            const post = repost.posts as any
            return {
              ...post,
              likes_count: likesMap.get(post.id) || 0,
              comments_count: commentsMap.get(post.id) || 0,
              reposts_count: repostsMap.get(post.id) || 0,
              is_liked: userLikesSet.has(post.id),
            }
          })

          setPosts(repostsWithEngagement as (Post & { profiles: Profile })[])
        } else {
          setPosts([])
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!profile || isFollowLoading) return

    setIsFollowLoading(true)
    try {
      const response = await fetch(`/api/users/${profile.id}/follow`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        const wasFollowing = isFollowing
        setIsFollowing(data.following)
        setFollowersCount((prev) => (data.following ? prev + 1 : prev - 1))

        if (data.following && !wasFollowing) {
          setJustFollowedUserId(profile.id)
          setShowRecommendations(true)
        }

        if (data.following) {
          const supabase = createClient()
          const { data: followBackData } = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", profile.id)
            .eq("following_id", currentUserId)
            .maybeSingle()
          setIsFollowingBack(!!followBackData)
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleMessage = async () => {
    if (!profile || isMessageLoading) return

    setIsMessageLoading(true)
    try {
      const supabase = createClient()
      const { data: conversationId, error } = await supabase.rpc("get_or_create_dm_conversation", {
        user1_id: currentUserId,
        user2_id: profile.id,
      })

      if (error) {
        console.error("Error getting conversation:", error)
        return
      }

      router.push(`/messages/${profile.username}`)
    } catch (error) {
      console.error("Error navigating to messages:", error)
    } finally {
      setIsMessageLoading(false)
    }
  }

  useEffect(() => {
    if (profile) {
      document.title = `${profile.display_name} (@${profile.username}) - Peeak`

      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription) {
        metaDescription.setAttribute("content", profile.bio || `${profile.display_name}'s profile on Peeak`)
      }

      const ogTitle = document.querySelector('meta[property="og:title"]')
      if (ogTitle) {
        ogTitle.setAttribute("content", `${profile.display_name} (@${profile.username})`)
      }

      const ogDescription = document.querySelector('meta[property="og:description"]')
      if (ogDescription) {
        ogDescription.setAttribute("content", profile.bio || `${profile.display_name}'s profile on Peeak`)
      }

      const ogImage = document.querySelector('meta[property="og:image"]')
      if (ogImage) {
        ogImage.setAttribute("content", profile.avatar_url || "/placeholder.svg?height=630&width=1200")
      }
    }
  }, [profile])

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

  if (!profile) {
    return null
  }

  const initials = profile.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const isMutualFollow = isFollowing && isFollowingBack

  return (
    <>
      <Navigation />
      <main className="mobile-screen md:min-h-screen pt-14 pb-14 md:pb-6 md:pl-64 md:pt-0 flex justify-center bg-background">
        <div className="mobile-content flex-1 max-w-[680px] border-x border-border">
          <div className="relative">
            {profile.banner_url ? (
              <div className="h-32 md:h-48 bg-muted relative overflow-hidden">
                <img
                  src={profile.banner_url || "/placeholder.svg"}
                  alt="Profile banner"
                  className="w-full h-full object-cover"
                />
                {proTheme?.primaryColor && (
                  <div
                    className="absolute inset-0 mix-blend-overlay opacity-20"
                    style={{ backgroundColor: proTheme.primaryColor }}
                  />
                )}
              </div>
            ) : (
              <div
                className="h-32 md:h-48"
                style={{
                  background: proTheme?.primaryColor
                    ? `linear-gradient(135deg, ${proTheme.primaryColor} 0%, ${proTheme.accentColor || proTheme.primaryColor} 100%)`
                    : "var(--muted)",
                }}
              />
            )}

            <div className="px-4 md:px-6 pb-4 md:pb-6">
              <div className="flex items-end justify-between -mt-12 md:-mt-20 mb-3 md:mb-4">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl md:text-3xl">{initials}</AvatarFallback>
                </Avatar>

                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Button variant="outline" size="sm" asChild className="h-9 bg-transparent">
                      <Link href="/settings/profile">Edit Profile</Link>
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMessage}
                        disabled={isMessageLoading}
                        className="h-9 bg-transparent"
                      >
                        {isMessageLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Message"}
                      </Button>
                      <Button
                        size="sm"
                        variant={isFollowing ? "outline" : "default"}
                        onClick={handleFollow}
                        disabled={isFollowLoading}
                        className="h-9"
                      >
                        {isFollowLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isFollowing ? (
                          isMutualFollow ? (
                            "Friends"
                          ) : (
                            "Following"
                          )
                        ) : (
                          "Follow"
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl md:text-2xl font-bold">{profile.display_name}</h1>
                    {activeBadge && (
                      <BadgeIcon
                        iconUrl={activeBadge.icon_url}
                        name={activeBadge.name}
                        description={activeBadge.description}
                        size="md"
                      />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                </div>

                {profile.bio && <p className="text-sm leading-relaxed">{profile.bio}</p>}

                {(profile.location || profile.website || profile.birth_date) && (
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-foreground hover:underline transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        <span>{profile.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                      </a>
                    )}
                    {profile.birth_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Born{" "}
                          {new Date(profile.birth_date + "T00:00:00Z").toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                            timeZone: "UTC",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="font-bold">{posts.length}</span>{" "}
                    <span className="text-muted-foreground">posts</span>
                  </div>
                  <Link href={`/profile/${username}/followers`} className="hover:underline">
                    <span className="font-bold">{followersCount}</span>{" "}
                    <span className="text-muted-foreground">followers</span>
                  </Link>
                  <Link href={`/profile/${username}/following`} className="hover:underline">
                    <span className="font-bold">{followingCount}</span>{" "}
                    <span className="text-muted-foreground">following</span>
                  </Link>
                </div>
              </div>
            </div>

            {showRecommendations && justFollowedUserId && (
              <div className="px-4 md:px-6 pb-4 md:pb-6">
                <FollowRecommendations justFollowedUserId={justFollowedUserId} />
              </div>
            )}

            <div className="border-t border-b border-border flex">
              <button
                onClick={() => setActiveTab("posts")}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${
                  activeTab === "posts"
                    ? "text-foreground border-b-2 border-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Posts
              </button>
              <button
                onClick={() => setActiveTab("reposts")}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${
                  activeTab === "reposts"
                    ? "text-foreground border-b-2 border-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Reposts
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab("bookmarks")}
                  className={`flex-1 py-4 text-sm font-medium transition-colors ${
                    activeTab === "bookmarks"
                      ? "text-foreground border-b-2 border-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Bookmarks
                </button>
              )}
            </div>

            <div className="border-t border-border">
              {posts.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  {activeTab === "posts"
                    ? "No posts yet"
                    : activeTab === "reposts"
                      ? "No reposts yet"
                      : "No bookmarks yet"}
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} currentUserId={currentUserId} isFollowing={isFollowing} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
