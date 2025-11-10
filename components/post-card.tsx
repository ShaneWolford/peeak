"use client"

import type { Post, Profile } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2, Link2, Flag } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SharePostDialog } from "./share-post-dialog"
import { EditPostDialog } from "./edit-post-dialog"
import { DeletePostDialog } from "./delete-post-dialog"
import { ReportDialog } from "./report-dialog"
import { ImageLightbox } from "./image-lightbox"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PostContentRenderer } from "./post-content-renderer"
import { PostMediaCarousel } from "./post-media-carousel"
import { BadgeIcon } from "./badge-icon"
import { PollDisplay } from "./poll-display"
import { HeartIcon } from "./icons/heart-icon"
import { CommentIcon } from "./icons/comment-icon"
import { RepostIcon } from "./icons/repost-icon"
import { BookmarkIcon } from "./icons/bookmark-icon"
import { SendIcon } from "./icons/send-icon"

interface PostCardProps {
  post: Post & { profiles: Profile }
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
  currentUserId?: string
  isFollowing?: boolean
  isAdmin?: boolean
}

export function PostCard({ post, onLike, onComment, onShare, currentUserId, isFollowing, isAdmin }: PostCardProps) {
  const profile = post.profiles
  const router = useRouter()
  const { toast } = useToast()
  const [isLiked, setIsLiked] = useState(post.is_liked)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [isReposted, setIsReposted] = useState(false)
  const [repostsCount, setRepostsCount] = useState(post.reposts_count || 0)
  const [isReposting, setIsReposting] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [commentText, setCommentText] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

  const CONTENT_LIMIT = 500
  const shouldTruncate = post.content && post.content.length > CONTENT_LIMIT
  const displayContent = shouldTruncate && !isExpanded ? post.content.slice(0, CONTENT_LIMIT) + "..." : post.content

  useEffect(() => {
    if (currentUserId) {
      fetch(`/api/posts/${post.id}/bookmark`)
        .then((res) => res.json())
        .then((data) => {
          if (data.bookmarked !== undefined) {
            setIsBookmarked(data.bookmarked)
          }
        })
        .catch((err) => console.error("Error fetching bookmark status:", err))

      fetch(`/api/posts/${post.id}/repost`)
        .then((res) => res.json())
        .then((data) => {
          if (data.reposted !== undefined) {
            setIsReposted(data.reposted)
          }
        })
        .catch((err) => console.error("Error fetching repost status:", err))
    }
  }, [post.id, currentUserId])

  const handleLike = async () => {
    if (isLiking) return

    setIsLiking(true)
    const previousLiked = isLiked
    const previousCount = likesCount
    setIsLiked(!isLiked)
    setLikesCount((prev) => (!isLiked ? prev + 1 : prev - 1))

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
        setLikesCount(data.count)
      } else {
        setIsLiked(previousLiked)
        setLikesCount(previousCount)
        toast({
          title: "Error",
          description: "Failed to like post. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setIsLiked(previousLiked)
      setLikesCount(previousCount)
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLiking(false)
    }
  }

  const handleBookmark = async () => {
    if (isBookmarking) return

    setIsBookmarking(true)
    const previousBookmarked = isBookmarked
    setIsBookmarked(!isBookmarked)

    try {
      const response = await fetch(`/api/posts/${post.id}/bookmark`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setIsBookmarked(data.bookmarked)
        toast({
          title: data.bookmarked ? "Post saved" : "Post unsaved",
          description: data.bookmarked ? "Post added to your bookmarks" : "Post removed from your bookmarks",
        })
      } else {
        setIsBookmarked(previousBookmarked)
        toast({
          title: "Error",
          description: "Failed to bookmark post. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setIsBookmarked(previousBookmarked)
      toast({
        title: "Error",
        description: "Failed to bookmark post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsBookmarking(false)
    }
  }

  const handleComment = () => {
    router.push(`/post/${post.id}`)
  }

  const handleCopyLink = async () => {
    const postUrl = `${window.location.origin}/post/${post.id}`
    try {
      await navigator.clipboard.writeText(postUrl)
      toast({
        title: "Link copied!",
        description: "Post link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  const handleImageClick = (index: number) => {
    const imageUrls = post.media_urls?.filter((_, i) => post.media_types?.[i] === "image") || []
    if (imageUrls.length > 0) {
      setLightboxIndex(index)
      setLightboxOpen(true)
    }
  }

  const handleShare = () => {
    if (onShare) {
      onShare(post.id)
    }
  }

  const handleRepost = async () => {
    if (isReposting) return

    setIsReposting(true)
    const previousReposted = isReposted
    const previousCount = repostsCount
    setIsReposted(!isReposted)
    setRepostsCount((prev) => (!isReposted ? prev + 1 : prev - 1))

    try {
      const response = await fetch(`/api/posts/${post.id}/repost`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setIsReposted(data.reposted)
        setRepostsCount(data.count)
        toast({
          title: data.reposted ? "Post reposted" : "Repost removed",
          description: data.reposted ? "Post added to your profile" : "Post removed from your profile",
        })
      } else {
        setIsReposted(previousReposted)
        setRepostsCount(previousCount)
        toast({
          title: "Error",
          description: "Failed to repost. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setIsReposted(previousReposted)
      setRepostsCount(previousCount)
      toast({
        title: "Error",
        description: "Failed to repost. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsReposting(false)
    }
  }

  const canEdit = currentUserId === profile.id
  const canDelete = currentUserId === profile.id || isAdmin

  const initials = profile.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const isPro = profile.is_pro || false

  return (
    <>
      <article className="bg-card border-b border-border px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
        <div className="flex gap-3">
          <Link href={`/profile/${profile.username}`} className="flex-shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-sm font-medium bg-muted text-foreground">{initials}</AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Link href={`/profile/${profile.username}`} className="font-bold text-[15px] hover:underline truncate">
                {profile.display_name || profile.username}
              </Link>
              {isPro && profile.active_badge && (
                <BadgeIcon
                  iconUrl={profile.active_badge.icon_url}
                  name={profile.active_badge.name}
                  description={profile.active_badge.description}
                  size="sm"
                />
              )}
              <Link
                href={`/profile/${profile.username}`}
                className="text-muted-foreground text-[15px] hover:underline truncate"
              >
                @{profile.username}
              </Link>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-[15px]" title={new Date(post.created_at).toLocaleString()}>
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true }).replace("about ", "")}
              </span>
              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Copy link
                    </DropdownMenuItem>
                    {!canEdit && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
                          <Flag className="h-4 w-4 mr-2" />
                          Report post
                        </DropdownMenuItem>
                      </>
                    )}
                    {canEdit && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit post
                        </DropdownMenuItem>
                      </>
                    )}
                    {canDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialogOpen(true)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete post
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {post.content && (
              <div className="mb-3">
                <PostContentRenderer content={displayContent || ""} />
                {shouldTruncate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 px-0 h-auto text-primary hover:underline hover:bg-transparent"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? "Show less" : "Read more"}
                  </Button>
                )}
              </div>
            )}

            <div className="mb-3">
              <PollDisplay postId={post.id} currentUserId={currentUserId} />
            </div>

            {post.media_urls && post.media_urls.length > 0 && (
              <div className="mb-3 rounded-2xl overflow-hidden border border-border">
                <PostMediaCarousel
                  mediaUrls={post.media_urls}
                  mediaTypes={post.media_types || []}
                  onMediaClick={handleImageClick}
                />
              </div>
            )}

            <div className="flex items-center justify-between -ml-2 mt-3">
              {/* Left side - Main interactions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 gap-2 hover:bg-[#1D9BF0]/10 hover:text-[#1D9BF0] rounded-full transition-colors"
                  onClick={handleComment}
                >
                  <CommentIcon className="text-muted-foreground group-hover:text-[#1D9BF0] transition-colors" />
                  <span className="text-[13px] text-muted-foreground">{post.comments_count || 0}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 gap-2 hover:bg-green-500/10 hover:text-green-500 rounded-full transition-colors"
                  onClick={handleRepost}
                  disabled={isReposting}
                >
                  <RepostIcon
                    className={`transition-colors ${isReposted ? "text-green-500" : "text-muted-foreground"}`}
                  />
                  <span
                    className={`text-[13px] transition-colors ${isReposted ? "text-green-500" : "text-muted-foreground"}`}
                  >
                    {repostsCount}
                  </span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 gap-2 hover:bg-[#F4245E]/10 hover:text-[#F4245E] rounded-full transition-colors"
                  onClick={handleLike}
                  disabled={isLiking}
                >
                  <HeartIcon
                    filled={isLiked}
                    className={`transition-colors ${isLiked ? "text-[#F4245E]" : "text-muted-foreground"}`}
                  />
                  <span
                    className={`text-[13px] transition-colors ${isLiked ? "text-[#F4245E]" : "text-muted-foreground"}`}
                  >
                    {likesCount}
                  </span>
                </Button>
              </div>

              {/* Right side - Bookmark and Share */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-primary/10 hover:text-primary rounded-full transition-colors"
                  onClick={handleBookmark}
                  disabled={isBookmarking}
                >
                  <BookmarkIcon
                    filled={isBookmarked}
                    className={`transition-colors ${isBookmarked ? "text-primary" : "text-muted-foreground"}`}
                  />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-primary/10 hover:text-primary rounded-full transition-colors"
                  onClick={handleShare}
                >
                  <SendIcon className="text-muted-foreground transition-colors" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Lightbox for images */}
      {post.media_urls && post.media_urls.length > 0 && (
        <ImageLightbox
          images={post.media_urls.filter((_, i) => post.media_types?.[i] === "image")}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      )}

      <SharePostDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} postId={post.id} />
      {!canEdit && (
        <ReportDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          reportedPostId={post.id}
          reportedUserId={profile.id}
        />
      )}
      {canEdit && (
        <EditPostDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          post={post}
          onSuccess={() => {
            router.refresh()
            toast({
              title: "Post updated",
              description: "Your post has been updated successfully",
            })
          }}
        />
      )}
      {canDelete && (
        <DeletePostDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          postId={post.id}
          isAdmin={isAdmin}
          onSuccess={() => {
            router.refresh()
            toast({
              title: "Post deleted",
              description: "The post has been deleted successfully",
            })
          }}
        />
      )}
    </>
  )
}
