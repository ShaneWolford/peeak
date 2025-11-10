"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Profile, Post } from "@/lib/types"
import { Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { PostCard } from "@/components/post-card"
import { useSearchParams } from "next/navigation"

type PostWithEngagement = Post & {
  profiles: Profile
  likes_count: number
  comments_count: number
  shares_count: number
  is_liked: boolean
  is_following: boolean
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [userResults, setUserResults] = useState<Profile[]>([])
  const [postResults, setPostResults] = useState<PostWithEngagement[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (initialQuery && initialQuery.trim().length >= 2) {
      handleSearch(initialQuery)
    }
  }, [initialQuery])

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery)

    if (searchQuery.trim().length < 2) {
      setUserResults([])
      setPostResults([])
      return
    }

    setIsSearching(true)
    try {
      const supabase = createClient()

      const isHashtagSearch = searchQuery.trim().startsWith("#")
      const isUsernameSearch = searchQuery.trim().startsWith("@")
      const hashtagQuery = isHashtagSearch ? searchQuery.trim().substring(1) : null
      const usernameQuery = isUsernameSearch ? searchQuery.trim().substring(1) : searchQuery

      let postsResponse
      let usersResponse

      if (isUsernameSearch) {
        // When searching with @, only search usernames
        usersResponse = await supabase.from("profiles").select("*").ilike("username", `%${usernameQuery}%`).limit(20)
      } else {
        // Regular search in both username and display name
        usersResponse = await supabase
          .from("profiles")
          .select("*")
          .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
          .limit(20)
      }

      if (isHashtagSearch && hashtagQuery) {
        postsResponse = await supabase
          .from("posts")
          .select(`
            *,
            profiles:author_id (*),
            post_hashtags!inner (
              hashtags!inner (
                tag
              )
            )
          `)
          .ilike("post_hashtags.hashtags.tag", `%${hashtagQuery}%`)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(20)
      } else if (isUsernameSearch) {
        const userIds = (usersResponse.data || []).map((u) => u.id)
        if (userIds.length > 0) {
          postsResponse = await supabase
            .from("posts")
            .select(`
              *,
              profiles:author_id (*)
            `)
            .in("author_id", userIds)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })
            .limit(20)
        } else {
          postsResponse = { data: [], error: null }
        }
      } else {
        // Regular content search
        postsResponse = await supabase
          .from("posts")
          .select(`
            *,
            profiles:author_id (*)
          `)
          .ilike("content", `%${searchQuery}%`)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(20)
      }

      if (usersResponse.error) throw usersResponse.error
      if (postsResponse.error) throw postsResponse.error

      setUserResults(usersResponse.data || [])

      if (postsResponse.data && currentUserId) {
        const postsWithEngagement = await Promise.all(
          postsResponse.data.map(async (post) => {
            const [likesResult, commentsResult, repostsResult, userLikeResult, followResult] = await Promise.all([
              supabase.from("likes").select("id", { count: "exact", head: true }).eq("post_id", post.id),
              supabase
                .from("comments")
                .select("id", { count: "exact", head: true })
                .eq("post_id", post.id)
                .eq("is_deleted", false),
              supabase.from("reposts").select("id", { count: "exact", head: true }).eq("post_id", post.id),
              supabase.from("likes").select("id").eq("post_id", post.id).eq("user_id", currentUserId).maybeSingle(),
              supabase
                .from("follows")
                .select("id")
                .eq("follower_id", currentUserId)
                .eq("following_id", post.author_id)
                .maybeSingle(),
            ])

            return {
              ...post,
              likes_count: likesResult.count || 0,
              comments_count: commentsResult.count || 0,
              shares_count: repostsResult.count || 0,
              is_liked: !!userLikeResult.data,
              is_following: !!followResult.data,
            }
          }),
        )
        setPostResults(postsWithEngagement as PostWithEngagement[])
      } else {
        setPostResults((postsResponse.data as PostWithEngagement[]) || [])
      }
    } catch (error) {
      console.error("Error searching:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const totalResults = userResults.length + postResults.length

  return (
    <>
      <Navigation />
      <main className="mobile-screen md:min-h-screen pt-14 pb-14 md:pb-6 md:pl-64 md:pt-0 bg-background md:flex md:justify-center">
        <div className="mobile-content flex-1 max-w-[680px] md:border-x border-border overflow-y-auto">
          <div className="border-b border-border p-4 bg-background md:sticky top-14 md:top-0 z-40">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search through users and posts"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pr-10 h-11 bg-background"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto">
            {isSearching ? (
              <div className="p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : query.trim().length < 2 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                Search for users and posts by entering at least 2 characters
              </div>
            ) : totalResults === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">No results found</div>
            ) : (
              <div>
                {userResults.length > 0 && (
                  <div>
                    <div className="px-4 py-3 bg-muted/30 border-b border-border">
                      <h2 className="text-sm font-semibold text-muted-foreground">Users ({userResults.length})</h2>
                    </div>
                    <div className="divide-y divide-border">
                      {userResults.map((profile) => {
                        const initials = profile.display_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)

                        return (
                          <Link
                            key={profile.id}
                            href={`/profile/${profile.username}`}
                            className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                          >
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={profile.avatar_url || undefined} />
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{profile.display_name}</p>
                              <p className="text-sm text-muted-foreground">@{profile.username}</p>
                              {profile.bio && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{profile.bio}</p>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {postResults.length > 0 && (
                  <div>
                    <div className="px-4 py-3 bg-muted/30 border-b border-border">
                      <h2 className="text-sm font-semibold text-muted-foreground">Posts ({postResults.length})</h2>
                    </div>
                    <div>
                      {postResults.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          currentUserId={currentUserId || undefined}
                          isFollowing={post.is_following}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
