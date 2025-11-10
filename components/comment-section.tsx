"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Comment, Profile } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageCircle, Loader2, MoreHorizontal, Edit, Trash2, Flag, ImageIcon, X } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditCommentDialog } from "./edit-comment-dialog"
import { DeleteCommentDialog } from "./delete-comment-dialog"
import { BadgeIcon } from "./badge-icon"
import { ReportDialog } from "./report-dialog"
import { EmojiPicker } from "@/components/emoji-picker"
import { GifPicker } from "@/components/gif-picker"

interface CommentSectionProps {
  postId: string
  currentUserId: string
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  level = 0,
  onUpdate,
}: {
  comment: Comment & { profiles: Profile }
  currentUserId: string
  onReply: (commentId: string, username: string) => void
  level?: number
  onUpdate: () => void
}) {
  const [isLiked, setIsLiked] = useState(comment.is_liked || false)
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0)
  const [isLiking, setIsLiking] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)

  const profile = comment.profiles
  const initials = profile.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const canEdit = currentUserId === comment.author_id
  const canDelete = currentUserId === comment.author_id

  const handleLike = async () => {
    if (isLiking) return
    setIsLiking(true)

    const previousLiked = isLiked
    const previousCount = likesCount

    // Optimistic update
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
      // Revert on error
      setIsLiked(previousLiked)
      setLikesCount(previousCount)
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <>
      <div className={`${level > 0 ? "ml-12 border-l-2 border-muted pl-4" : ""}`}>
        <div className="p-4 hover:bg-muted/30 transition-colors">
          <div className="flex gap-3">
            <Link href={`/profile/${profile.username}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/profile/${profile.username}`} className="font-semibold hover:underline">
                      {profile.display_name}
                    </Link>
                    {profile.active_badge && (
                      <BadgeIcon
                        iconUrl={profile.active_badge.icon_url}
                        name={profile.active_badge.name}
                        description={profile.active_badge.description}
                        className="w-4 h-4"
                      />
                    )}
                  </div>
                  <Link href={`/profile/${profile.username}`} className="text-sm text-muted-foreground hover:underline">
                    @{profile.username}
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                  {comment.updated_at && comment.updated_at !== comment.created_at && (
                    <span className="text-xs text-muted-foreground">(edited)</span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <>
                        <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {canDelete && (
                      <>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialogOpen(true)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {!canEdit && (
                      <DropdownMenuItem onClick={() => setReportDialogOpen(true)} className="text-destructive">
                        <Flag className="h-4 w-4 mr-2" />
                        Report
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-base leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>

              {comment.media_url && (
                <div className="mt-2 rounded-lg overflow-hidden border border-border max-w-md">
                  {comment.media_type === "video" ? (
                    <video src={comment.media_url} className="w-full max-h-64 object-contain" controls />
                  ) : (
                    <img
                      src={comment.media_url || "/placeholder.svg"}
                      alt="Comment attachment"
                      className="w-full max-h-64 object-contain"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 pt-1">
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <Heart
                    className={`h-4 w-4 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "group-hover:text-red-500"}`}
                  />
                  {likesCount > 0 && <span>{likesCount}</span>}
                </button>

                <button
                  onClick={() => onReply(comment.id, profile.username)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-0">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                onReply={onReply}
                level={level + 1}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        )}
      </div>

      {canEdit && (
        <EditCommentDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          commentId={comment.id}
          initialContent={comment.content}
          onSuccess={onUpdate}
        />
      )}
      {canDelete && (
        <DeleteCommentDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          commentId={comment.id}
          onSuccess={onUpdate}
        />
      )}
      {!canEdit && (
        <ReportDialog
          reportedCommentId={comment.id}
          reportedUserId={profile.id}
          trigger={<div style={{ display: "none" }} />}
        />
      )}
    </>
  )
}

export function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<(Comment & { profiles: Profile })[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<string | null>(null)
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const { data: allComments, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          profiles!comments_author_id_fkey (
            *,
            active_badge:badges!profiles_active_badge_id_fkey (
              id,
              name,
              description,
              icon_url,
              color
            )
          )
        `,
        )
        .eq("post_id", postId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })

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

      const commentMap = new Map<string, Comment & { profiles: Profile }>()
      const rootComments: (Comment & { profiles: Profile })[] = []

      commentsWithLikes?.forEach((comment) => {
        commentMap.set(comment.id, { ...comment, replies: [] })
      })

      commentsWithLikes?.forEach((comment) => {
        const commentWithReplies = commentMap.get(comment.id)!
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id)
          if (parent) {
            if (!parent.replies) parent.replies = []
            parent.replies.push(commentWithReplies)
          }
        } else {
          rootComments.push(commentWithReplies)
        }
      })

      setComments(rootComments)
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim() && !mediaUrl) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("comments").insert({
        author_id: currentUserId,
        post_id: postId,
        parent_comment_id: replyingTo?.id || null,
        content: newComment.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
      })

      if (error) throw error

      if (replyingTo) {
        const { data: parentComment } = await supabase
          .from("comments")
          .select("author_id")
          .eq("id", replyingTo.id)
          .single()

        if (parentComment && parentComment.author_id !== currentUserId) {
          await supabase.from("notifications").insert({
            user_id: parentComment.author_id,
            type: "comment",
            actor_id: currentUserId,
            post_id: postId,
            comment_id: replyingTo.id,
          })
        }
      } else {
        const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single()

        if (post && post.author_id !== currentUserId) {
          await supabase.from("notifications").insert({
            user_id: post.author_id,
            type: "comment",
            actor_id: currentUserId,
            post_id: postId,
          })
        }
      }

      setNewComment("")
      setMediaUrl(null)
      setMediaType(null)
      setReplyingTo(null)
      fetchComments()
    } catch (error) {
      console.error("Error posting comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReply = (commentId: string, username: string) => {
    setReplyingTo({ id: commentId, username })
    setNewComment(`@${username} `)
    setMediaUrl(null)
    setMediaType(null)
  }

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setNewComment((prev) => prev + emoji)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = newComment.substring(0, start) + emoji + newComment.substring(end)
    setNewComment(newContent)

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length
      textarea.focus()
    }, 0)
  }

  const handleGifSelect = (gifUrl: string) => {
    setMediaUrl(gifUrl)
    setMediaType("gif")
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      alert("Please select an image or video file")
      return
    }

    setIsUploadingMedia(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const fileExtension = file.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}.${fileExtension}`

      const { error: uploadError } = await supabase.storage.from("post-media").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("post-media").getPublicUrl(fileName)

      setMediaUrl(publicUrl)
      setMediaType(file.type.startsWith("video/") ? "video" : "image")
    } catch (error) {
      console.error("Error uploading media:", error)
      alert("Failed to upload media")
    } finally {
      setIsUploadingMedia(false)
    }
  }

  const removeMedia = () => {
    setMediaUrl(null)
    setMediaType(null)
  }

  return (
    <div className="divide-y divide-border">
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {replyingTo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Replying to @{replyingTo.username}</span>
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null)
                  setNewComment("")
                  setMediaUrl(null)
                  setMediaType(null)
                }}
                className="text-foreground hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
          <Textarea
            ref={textareaRef}
            placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Write a comment..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] resize-none"
            maxLength={1000}
          />

          {mediaUrl && (
            <div className="relative rounded-lg overflow-hidden border border-border max-w-md">
              {mediaType === "video" ? (
                <video src={mediaUrl} className="w-full max-h-64 object-contain" controls />
              ) : (
                <img
                  src={mediaUrl || "/placeholder.svg"}
                  alt="Upload preview"
                  className="w-full max-h-64 object-contain"
                />
              )}
              <button
                type="button"
                onClick={removeMedia}
                className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingMedia || !!mediaUrl}
                title="Add image or video"
              >
                {isUploadingMedia ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
              </Button>
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              <GifPicker onGifSelect={handleGifSelect} />
            </div>
            <span className="text-sm text-muted-foreground">{newComment.length} / 1000</span>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || (!newComment.trim() && !mediaUrl)}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Comment"
              )}
            </Button>
          </div>
        </form>
      </div>

      <div>
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No comments yet. Be the first to comment!</div>
        ) : (
          <div className="divide-y divide-border">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                onReply={handleReply}
                onUpdate={fetchComments}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
