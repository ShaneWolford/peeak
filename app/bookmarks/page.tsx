"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { PostCard } from "@/components/post-card"
import type { Post, Profile } from "@/lib/types"
import { Loader2, Bookmark } from "lucide-react"

export default function BookmarksPage() {
  const [posts, setPosts] = useState<(Post & { profiles: Profile })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    loadBookmarks()
  }, [])

  const loadBookmarks = async () => {
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

      // Get bookmarked posts
      const { data: bookmarksData } = await supabase
        .from("bookmarks")
        .select(`
          post_id,
          posts (
            *,
            profiles!posts_author_id_fkey (*)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (!bookmarksData) {
        setPosts([])
        return
      }

      // Get engagement data for each post
      const postsWithEngagement = await Promise.all(
        bookmarksData
          .filter((bookmark) => bookmark.posts)
          .map(async (bookmark) => {
            const post = bookmark.posts as any

            const [likesResult, commentsResult, repostsResult, userLikeResult] = await Promise.all([
              supabase.from("likes").select("id", { count: "exact", head: true }).eq("post_id", post.id),
              supabase
                .from("comments")
                .select("id", { count: "exact", head: true })
                .eq("post_id", post.id)
                .eq("is_deleted", false),
              supabase.from("reposts").select("id", { count: "exact", head: true }).eq("post_id", post.id),
              supabase.from("likes").select("id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle(),
            ])

            return {
              ...post,
              likes_count: likesResult.count || 0,
              comments_count: commentsResult.count || 0,
              reposts_count: repostsResult.count || 0,
              is_liked: !!userLikeResult.data,
            }
          }),
      )

      setPosts(postsWithEngagement as (Post & { profiles: Profile })[])
    } catch (error) {
      console.error("Error loading bookmarks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-14 pb-14 md:pb-6 md:pl-64 md:pt-0 flex justify-center bg-background">
        <div className="flex-1 max-w-[680px] border-x border-border">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <Bookmark className="h-6 w-6" />
              <h1 className="text-xl font-bold">Bookmarks</h1>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center">
              <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold mb-2">No bookmarks yet</h2>
              <p className="text-sm text-muted-foreground">Save posts to read later by tapping the bookmark icon</p>
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)
          )}
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
