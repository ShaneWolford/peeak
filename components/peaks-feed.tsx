"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { PeakCard } from "./peak-card"
import { Loader2, Upload } from "lucide-react"
import { Button } from "./ui/button"
import Link from "next/link"

interface PeaksFeedProps {
  initialPostId?: string
}

export function PeaksFeed({ initialPostId }: PeaksFeedProps) {
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    loadPosts()
  }, [initialPostId])

  const loadPosts = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Fetch video posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(
          `
            *,
            profiles!posts_author_id_fkey (
              id,
              username,
              display_name,
              avatar_url,
              is_pro
            )
          `,
        )
        .eq("is_deleted", false)
        .not("media_urls", "is", null)
        .order("created_at", { ascending: false })
        .limit(20)

      if (postsError) throw postsError

      // Filter for video posts only
      const videoPosts = postsData.filter(
        (post) => post.media_urls && post.media_urls.length > 0 && post.media_types?.[0] === "video",
      )

      if (user && videoPosts.length > 0) {
        const postIds = videoPosts.map((p) => p.id)

        const [likesData, commentsData, repostsData, userLikesData] = await Promise.all([
          supabase.from("likes").select("post_id").in("post_id", postIds),
          supabase.from("comments").select("post_id").in("post_id", postIds).eq("is_deleted", false),
          supabase.from("reposts").select("post_id").in("post_id", postIds),
          supabase.from("likes").select("post_id").in("post_id", postIds).eq("user_id", user.id),
        ])

        // Create lookup maps
        const likesMap = new Map<string, number>()
        const commentsMap = new Map<string, number>()
        const repostsMap = new Map<string, number>()
        const userLikesSet = new Set(userLikesData.data?.map((l) => l.post_id))

        likesData.data?.forEach((like) => {
          likesMap.set(like.post_id, (likesMap.get(like.post_id) || 0) + 1)
        })

        commentsData.data?.forEach((comment) => {
          commentsMap.set(comment.post_id, (commentsMap.get(comment.post_id) || 0) + 1)
        })

        repostsData.data?.forEach((repost) => {
          repostsMap.set(repost.post_id, (repostsMap.get(repost.post_id) || 0) + 1)
        })

        // Add engagement data to posts
        const postsWithEngagement = videoPosts.map((post) => ({
          ...post,
          likes_count: likesMap.get(post.id) || 0,
          comments_count: commentsMap.get(post.id) || 0,
          reposts_count: repostsMap.get(post.id) || 0,
          is_liked: userLikesSet.has(post.id),
        }))

        setPosts(postsWithEngagement)
      } else {
        setPosts(videoPosts)
      }

      // Find initial post if provided
      if (initialPostId) {
        const initialIndex = videoPosts.findIndex((p) => p.id === initialPostId)
        if (initialIndex !== -1) {
          setActiveIndex(initialIndex)
        }
      }
    } catch (error) {
      console.error("Error loading peaks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const index = Number.parseInt(entry.target.getAttribute("data-index") || "0")
        setActiveIndex(index)
      }
    })
  }, [])

  const navigateToPeak = useCallback(
    (index: number) => {
      if (index < 0 || index >= posts.length) return

      const container = containerRef.current
      if (!container) return

      const targetElement = container.children[index] as HTMLElement
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" })
        setActiveIndex(index)
      }
    },
    [posts.length],
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return
      }

      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
        case " ": // Space key
          e.preventDefault()
          navigateToPeak(activeIndex + 1)
          break
        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault()
          navigateToPeak(activeIndex - 1)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeIndex, navigateToPeak])

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.5,
    }

    observerRef.current = new IntersectionObserver(handleObserver, options)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleObserver])

  if (isLoading) {
    return (
      <div className="h-dvh md:h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="h-dvh md:h-screen flex flex-col items-center justify-center bg-black text-white px-6">
        <Upload className="h-16 w-16 mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">No Peaks Yet</h2>
        <p className="text-muted-foreground text-center mb-6">
          Be the first to create a Peak! Upload a short video to get started.
        </p>
        <Link href="/peaks/upload">
          <Button size="lg">Create Peak</Button>
        </Link>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-dvh md:h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth hide-scrollbar"
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

      {posts.map((post, index) => (
        <div key={post.id} data-index={index} className="h-dvh md:h-screen w-full snap-start snap-always">
          <PeakCard
            post={post}
            index={index}
            isActive={index === activeIndex}
            observerRef={observerRef}
            onRefresh={loadPosts}
          />
        </div>
      ))}
    </div>
  )
}
