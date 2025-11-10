"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Comment, Profile } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Heart, X, Loader2, Send, MessageCircle } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface PeaksCommentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: string
  currentUserId: string
  commentsCount: number
  onCommentAdded?: () => void
}

function CommentItem({
  comment,
  currentUserId,
}: {
  comment: Comment & { profiles: Profile }
  currentUserId: string
}) {
  const [isLiked, setIsLiked] = useState(comment.is_liked || false)
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0)
  const [isLiking, setIsLiking] = useState(false)

  const profile = comment.profiles
  const initials = profile.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handleLike = async () => {
    if (isLiking) return
    setIsLiking(true)

    const previousLiked = isLiked
    const previousCount = likesCount

    setIsLiked(!isLiked)
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1)

    try {
      const response = await fetch(`/api/comments/${comment.id}/like`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to like comment")

      const data = await response.json()
      setIsLiked(data.liked)
    } catch (error) {
      console.error("Error liking comment:", error)
      setIsLiked(previousLiked)
      setLikesCount(previousCount)
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <div className="flex gap-3 p-4 hover:bg-muted/30 transition-colors">
      <Link href={`/profile/${profile.username}`} className="group">
        <Avatar className="h-10 w-10 flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/profile/${profile.username}`}
            className="font-semibold text-sm hover:underline transition-colors"
          >
            {profile.display_name}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>

        <button
          onClick={handleLike}
          disabled={isLiking}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
        >
          <Heart
            className={`h-4 w-4 transition-all duration-200 ${
              isLiked ? "fill-red-500 text-red-500 scale-110" : "group-hover:scale-105"
            }`}
          />
          {likesCount > 0 && <span className="font-medium">{likesCount}</span>}
        </button>
      </div>
    </div>
  )
}

export function PeaksCommentDialog({
  open,
  onOpenChange,
  postId,
  currentUserId,
  commentsCount,
  onCommentAdded,
}: PeaksCommentDialogProps) {
  const [comments, setComments] = useState<(Comment & { profiles: Profile })[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      fetchComments()
    }
  }, [open, postId])

  const fetchComments = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const { data: allComments, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          profiles!comments_author_id_fkey (*)
        `,
        )
        .eq("post_id", postId)
        .eq("is_deleted", false)
        .is("parent_comment_id", null)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      const commentIds = allComments?.map((c) => c.id) || []
      const { data: likesData } = await supabase
        .from("comment_likes")
        .select("comment_id, user_id")
        .in("comment_id", commentIds)

      const likesMap = new Map<string, { count: number; isLiked: boolean }>()
      likesData?.forEach((like) => {
        const current = likesMap.get(like.comment_id) || { count: 0, isLiked: false }
        current.count++
        if (like.user_id === currentUserId) current.isLiked = true
        likesMap.set(like.comment_id, current)
      })

      const commentsWithLikes = allComments?.map((comment) => ({
        ...comment,
        likes_count: likesMap.get(comment.id)?.count || 0,
        is_liked: likesMap.get(comment.id)?.isLiked || false,
      }))

      setComments(commentsWithLikes || [])
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("comments").insert({
        author_id: currentUserId,
        post_id: postId,
        parent_comment_id: null,
        content: newComment.trim(),
      })

      if (error) throw error

      const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single()

      if (post && post.author_id !== currentUserId) {
        await supabase.from("notifications").insert({
          user_id: post.author_id,
          type: "comment",
          actor_id: currentUserId,
          post_id: postId,
        })
      }

      setNewComment("")
      await fetchComments()
      onCommentAdded?.()
    } catch (error) {
      console.error("Error posting comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[85vh] p-0 gap-0 flex flex-col border shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-xl">
            Comments {commentsCount > 0 && <span className="text-muted-foreground font-normal">({commentsCount})</span>}
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="h-10 w-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">No comments yet</p>
              <p className="text-xs">Be the first to comment!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} currentUserId={currentUserId} />
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-4 bg-muted/10">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[48px] max-h-[120px] resize-none flex-1 border focus:border-primary transition-colors"
              maxLength={500}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <Button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              size="icon"
              className="h-12 w-12 flex-shrink-0 transition-all hover:scale-105 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
