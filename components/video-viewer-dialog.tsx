"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Post, Profile } from "@/lib/types"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share2, Volume2, VolumeX, X } from "lucide-react"
import Link from "next/link"
import { SharePostDialog } from "./share-post-dialog"
import { PeaksCommentDialog } from "./peaks-comment-dialog"

interface VideoViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialPostId: string
}

export function VideoViewerDialog({ open, onOpenChange, initialPostId }: VideoViewerDialogProps) {
  const [posts, setPosts] = useState<(Post & { profiles: Profile })[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [showLikeAnimation, setShowLikeAnimation] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (open) {
      loadVideoPosts()
      getCurrentUser()
    }
  }, [open, initialPostId])

  const getCurrentUser = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)
  }

  const loadVideoPosts = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        *,
        profiles!posts_author_id_fkey (*)
      `)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(50)

    if (postsData) {
      const videoPosts = postsData.filter(
        (post) => post.media_urls && post.media_urls.length > 0 && post.media_types?.[0] === "video",
      )

      const postsWithEngagement = await Promise.all(
        videoPosts.map(async (post) => {
          const [likesResult, commentsResult, userLikeResult] = await Promise.all([
            supabase.from("likes").select("id", { count: "exact", head: true }).eq("post_id", post.id),
            supabase
              .from("comments")
              .select("id", { count: "exact", head: true })
              .eq("post_id", post.id)
              .eq("is_deleted", false),
            supabase.from("likes").select("id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle(),
          ])

          return {
            ...post,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
            is_liked: !!userLikeResult.data,
          }
        }),
      )

      const typedPosts = postsWithEngagement as (Post & { profiles: Profile })[]
      setPosts(typedPosts)

      const initialIndex = typedPosts.findIndex((p) => p.id === initialPostId)
      if (initialIndex !== -1) {
        setCurrentIndex(initialIndex)
        setTimeout(() => {
          if (containerRef.current) {
            const targetElement = containerRef.current.children[initialIndex] as HTMLElement
            targetElement?.scrollIntoView({ behavior: "instant", block: "start" })
          }
        }, 100)
      }
    }
  }

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number.parseInt(entry.target.getAttribute("data-index") || "0")
            setCurrentIndex(index)
          }
        })
      },
      { threshold: 0.5 },
    )

    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  const currentPost = posts[currentIndex]

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-full h-screen p-0 bg-black border-none">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all"
          >
            <X className="h-5 w-5 text-white" />
          </button>

          <div ref={containerRef} className="h-full overflow-y-scroll snap-y snap-mandatory">
            {posts.map((post, index) => (
              <VideoCard
                key={post.id}
                post={post}
                index={index}
                isActive={index === currentIndex}
                observerRef={observerRef}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                currentUserId={currentUserId}
                videoRefs={videoRefs}
                onCommentClick={() => setCommentDialogOpen(true)}
                onShareClick={() => setShareDialogOpen(true)}
                showLikeAnimation={showLikeAnimation}
                setShowLikeAnimation={setShowLikeAnimation}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {currentPost && currentUserId && (
        <>
          <PeaksCommentDialog
            open={commentDialogOpen}
            onOpenChange={setCommentDialogOpen}
            postId={currentPost.id}
            currentUserId={currentUserId}
            commentsCount={currentPost.comments_count || 0}
            onCommentAdded={() => {}}
          />
          <SharePostDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} postId={currentPost.id} />
        </>
      )}
    </>
  )
}

function VideoCard({
  post,
  index,
  isActive,
  observerRef,
  isMuted,
  setIsMuted,
  currentUserId,
  videoRefs,
  onCommentClick,
  onShareClick,
  showLikeAnimation,
  setShowLikeAnimation,
}: {
  post: Post & { profiles: Profile }
  index: number
  isActive: boolean
  observerRef: React.MutableRefObject<IntersectionObserver | null>
  isMuted: boolean
  setIsMuted: (muted: boolean) => void
  currentUserId: string | null
  videoRefs: React.MutableRefObject<(HTMLVideoElement | null)[]>
  onCommentClick: () => void
  onShareClick: () => void
  showLikeAnimation: boolean
  setShowLikeAnimation: (show: boolean) => void
}) {
  const profile = post.profiles
  const [isLiked, setIsLiked] = useState(post.is_liked)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [isLiking, setIsLiking] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const initials = profile.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  useEffect(() => {
    if (cardRef.current && observerRef.current) {
      observerRef.current.observe(cardRef.current)
    }
    return () => {
      if (cardRef.current && observerRef.current) {
        observerRef.current.unobserve(cardRef.current)
      }
    }
  }, [observerRef])

  useEffect(() => {
    const video = videoRefs.current[index]
    if (video) {
      if (isActive) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    }
  }, [isActive, index])

  const handleLike = async () => {
    if (isLiking) return

    setIsLiking(true)
    if (!isLiked) {
      setShowLikeAnimation(true)
      setTimeout(() => setShowLikeAnimation(false), 1000)
    }

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
        setLikesCount((prev) => (data.liked ? prev + 1 : prev - 1))
      }
    } catch (error) {
      console.error("Error liking post:", error)
    } finally {
      setIsLiking(false)
    }
  }

  const toggleMute = () => {
    const video = videoRefs.current[index]
    if (video) {
      video.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <div
      ref={cardRef}
      data-index={index}
      className="relative h-screen w-full snap-start snap-always flex items-center justify-center bg-black overflow-hidden"
    >
      <video
        ref={(el) => {
          videoRefs.current[index] = el
        }}
        src={post.media_urls?.[0]}
        className="absolute inset-0 w-full h-full object-contain"
        loop
        playsInline
        muted={isMuted}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent via-40% to-black/95 pointer-events-none" />

      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <Link href={`/profile/${profile.username}`} className="flex items-center gap-3 group">
          <Avatar className="h-14 w-14 border-2 border-white shadow-xl ring-4 ring-black/10 transition-all duration-300 group-hover:scale-110">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <p className="font-bold text-white text-lg drop-shadow-2xl">{profile.display_name}</p>
            <p className="text-sm text-white/90 drop-shadow-lg">@{profile.username}</p>
          </div>
        </Link>

        <button
          onClick={toggleMute}
          className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-all duration-300 hover:scale-110 shadow-xl border border-white/10"
        >
          {isMuted ? (
            <VolumeX className="h-6 w-6 text-white" />
          ) : (
            <Volume2 className="h-6 w-6 text-white animate-pulse" />
          )}
        </button>
      </div>

      <div className="absolute bottom-32 md:bottom-12 left-6 right-28 z-10">
        {post.content && (
          <div className="backdrop-blur-sm bg-black/30 rounded-2xl p-4 border border-white/10 shadow-2xl">
            <p className="text-white text-base md:text-lg leading-relaxed drop-shadow-2xl font-medium line-clamp-4">
              {post.content}
            </p>
          </div>
        )}
      </div>

      <div className="absolute bottom-32 md:bottom-12 right-6 flex flex-col gap-5 z-10">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className="flex flex-col items-center gap-2 transition-all duration-300 active:scale-90 group"
        >
          <div
            className={`w-14 h-14 rounded-full bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl transition-all duration-300 ${
              isLiked
                ? "scale-110 from-red-500/40 to-pink-500/40 border-red-400/50"
                : "group-hover:scale-110 group-hover:from-white/30"
            }`}
          >
            <Heart
              className={`h-7 w-7 transition-all duration-300 ${
                isLiked ? "fill-red-500 text-red-500 scale-110" : "text-white group-hover:scale-110"
              }`}
            />
          </div>
          <span className="text-white text-sm font-bold drop-shadow-2xl px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm min-w-[3rem] text-center">
            {likesCount}
          </span>
        </button>

        <button
          onClick={onCommentClick}
          className="flex flex-col items-center gap-2 transition-all duration-300 active:scale-90 group"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl transition-all duration-300 group-hover:scale-110">
            <MessageCircle className="h-7 w-7 text-white group-hover:scale-110 transition-transform duration-200" />
          </div>
          <span className="text-white text-sm font-bold drop-shadow-2xl px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm min-w-[3rem] text-center">
            {post.comments_count || 0}
          </span>
        </button>

        <button
          onClick={onShareClick}
          className="flex flex-col items-center gap-2 transition-all duration-300 active:scale-90 group"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
            <Share2 className="h-7 w-7 text-white group-hover:scale-110 transition-transform duration-200" />
          </div>
        </button>
      </div>

      {showLikeAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Heart className="h-32 w-32 fill-red-500 text-red-500 animate-ping opacity-75" />
          <Heart className="absolute h-32 w-32 fill-red-500 text-red-500 animate-bounce" />
        </div>
      )}
    </div>
  )
}
