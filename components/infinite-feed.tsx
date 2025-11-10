"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { PostCard } from "./post-card"
import { Loader2 } from "lucide-react"
import type { Post, Profile } from "@/lib/types"

interface InfiniteFeedProps {
  initialPosts: (Post & { profiles: Profile })[]
  currentUserId: string
  isAdmin: boolean
  filter: string
}

export function InfiniteFeed({ initialPosts, currentUserId, isAdmin, filter }: InfiniteFeedProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length >= 10)
  const observerTarget = useRef<HTMLDivElement>(null)

  const loadMorePosts = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const response = await fetch(`/api/feed?filter=${filter}&page=${page}&limit=10`)
      const data = await response.json()

      if (data.posts && data.posts.length > 0) {
        setPosts((prev) => [...prev, ...data.posts])
        setPage((prev) => prev + 1)
        setHasMore(data.hasMore)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("[v0] Error loading more posts:", error)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, filter, page])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMorePosts()
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [loadMorePosts, hasMore, loading])

  useEffect(() => {
    setPosts(initialPosts)
    setPage(1)
    setHasMore(initialPosts.length >= 10)
  }, [filter, initialPosts])

  return (
    <>
      {posts.length === 0 ? (
        <div className="p-12 text-center border-t border-border">
          <p className="text-sm text-muted-foreground">
            {filter === "following"
              ? "No posts from people you follow. Start following users to see their posts here!"
              : filter === "pro"
                ? "No posts from Pro users yet."
                : filter === "media"
                  ? "No posts with media yet."
                  : filter === "polls"
                    ? "No polls yet."
                    : "No posts yet. Create your first post above!"}
          </p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post as Post & { profiles: Profile }}
              currentUserId={currentUserId}
              isFollowing={post.is_following}
              isAdmin={isAdmin}
            />
          ))}

          {/* Intersection observer target */}
          <div ref={observerTarget} className="h-20 flex items-center justify-center">
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading more posts...</span>
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <p className="text-sm text-muted-foreground py-8">You've reached the end</p>
            )}
          </div>
        </>
      )}
    </>
  )
}
