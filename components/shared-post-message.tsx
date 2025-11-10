"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Heart, MessageCircle, Play } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface SharedPostMessageProps {
  postId: string
}

export function SharedPostMessage({ postId }: SharedPostMessageProps) {
  const [post, setPost] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("[v0] SharedPostMessage received postId:", postId)
    loadPost()
  }, [postId])

  const loadPost = async () => {
    try {
      console.log("[v0] Loading post with ID:", postId)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("posts")
        .select("*, profiles!posts_author_id_fkey(*), likes_count:likes(count), comments_count:comments(count)")
        .eq("id", postId)
        .single()

      if (error) {
        console.error("[v0] Error loading shared post:", error)
        return
      }

      console.log("[v0] Loaded post data:", data)
      setPost(data)
    } catch (error) {
      console.error("[v0] Error loading shared post:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    console.log("[v0] SharedPostMessage is loading...")
    return (
      <div className="bg-white border border-border rounded-lg p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!post) {
    console.log("[v0] SharedPostMessage: Post not found")
    return (
      <div className="bg-white border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground text-center">Post not found or deleted</p>
      </div>
    )
  }

  console.log("[v0] SharedPostMessage rendering post:", post.id)

  const profile = post.profiles
  const initials = profile.display_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const hasMedia = post.media_urls && post.media_urls.length > 0
  const hasVideo = post.media_types?.[0] === "video"
  const linkHref = hasVideo ? `/peaks?postId=${post.id}` : `/post/${post.id}`

  const likesCount = post.likes_count?.[0]?.count || 0
  const commentsCount = post.comments_count?.[0]?.count || 0

  return (
    <Link href={linkHref} className="block">
      <article className="bg-background border border-border rounded-xl overflow-hidden hover:border-foreground/20 transition-all shadow-sm hover:shadow-md max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/30">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-xs font-medium bg-muted text-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{profile.username}</p>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Media - Show first if available */}
        {hasMedia && (
          <div className="w-full">
            <div className="relative w-full aspect-square bg-muted">
              {post.media_types?.[0] === "video" ? (
                <div className="relative h-full">
                  <video src={post.media_urls[0]} className="w-full h-full object-cover" playsInline />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <Play className="h-7 w-7 text-foreground ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </div>
              ) : (
                <img src={post.media_urls[0] || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
              )}
              {post.media_urls.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/80 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
                  1/{post.media_urls.length}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Caption */}
        {post.content && (
          <div className="px-3 py-2.5">
            <p className="text-sm leading-relaxed text-foreground line-clamp-3 break-words">{post.content}</p>
          </div>
        )}

        {/* Engagement stats - Compact version */}
        <div className="px-3 py-2.5 border-t border-border bg-muted/20">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {likesCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" />
                {likesCount.toLocaleString()}
              </span>
            )}
            {commentsCount > 0 && (
              <span className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" />
                {commentsCount.toLocaleString()}
              </span>
            )}
            {likesCount === 0 && commentsCount === 0 && (
              <span className="text-muted-foreground/60">No engagement yet</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
