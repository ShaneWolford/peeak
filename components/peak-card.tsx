"use client"

import { useRouter } from "next/navigation"
import type React from "react"
import type { Post, Profile } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Play,
  EyeOff,
  UserPlus,
  VolumeX,
  Ban,
  Flag,
  Link2,
  Edit,
  Trash2,
  Loader2,
  Repeat2,
  Send,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { SharePostDialog } from "./share-post-dialog"
import { PeaksCommentDialog } from "./peaks-comment-dialog"
import { EditPostDialog } from "./edit-post-dialog"
import { DeletePostDialog } from "./delete-post-dialog"
import { ReportDialog } from "./report-dialog"
import { BookmarkIcon } from "./icons/bookmark-icon"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface PeakCardProps {
  post: Post & { profiles: Profile }
  index: number
  isActive: boolean
  observerRef: React.MutableRefObject<IntersectionObserver | null>
  onRefresh: () => void
  isAdmin?: boolean
}

export function PeakCard({ post, index, isActive, observerRef, onRefresh, isAdmin }: PeakCardProps) {
  const profile = post.profiles
  const router = useRouter()
  const { toast } = useToast()
  const [isLiked, setIsLiked] = useState(post.is_liked)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReposted, setIsReposted] = useState(false)
  const [repostsCount, setRepostsCount] = useState(post.reposts_count || 0)
  const [isReposting, setIsReposting] = useState(false)
  const [viewsCount] = useState(Math.floor(Math.random() * 1000) + 100) // Mock view count for display
  const [showLikeAnimation, setShowLikeAnimation] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const lastClickTimeRef = useRef<number>(0)

  const initials = profile.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)

        // Check bookmark status
        const bookmarkRes = await fetch(`/api/posts/${post.id}/bookmark`)
        const bookmarkData = await bookmarkRes.json()
        if (bookmarkData.bookmarked !== undefined) {
          setIsBookmarked(bookmarkData.bookmarked)
        }

        const repostRes = await fetch(`/api/posts/${post.id}/repost`)
        const repostData = await repostRes.json()
        if (repostData.reposted !== undefined) {
          setIsReposted(repostData.reposted)
        }

        // Check follow status
        if (user.id !== profile.id) {
          const followRes = await fetch(`/api/users/${profile.id}/follow`)
          const followData = await followRes.json()
          if (followData.following !== undefined) {
            setIsFollowing(followData.following)
          }
        }
      }
    }
    getCurrentUser()
  }, [post.id, profile.id])

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
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {})
        setIsPlaying(true)
      } else {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }
  }, [isActive])

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
          description: "Failed to like peak. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setIsLiked(previousLiked)
      setLikesCount(previousCount)
      toast({
        title: "Error",
        description: "Failed to like peak. Please try again.",
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
          title: data.bookmarked ? "Peak saved" : "Peak unsaved",
          description: data.bookmarked ? "Added to your bookmarks" : "Removed from your bookmarks",
        })
      } else {
        setIsBookmarked(previousBookmarked)
      }
    } catch (error) {
      setIsBookmarked(previousBookmarked)
    } finally {
      setIsBookmarking(false)
    }
  }

  const handleComment = () => {
    setCommentDialogOpen(true)
  }

  const handleShare = () => {
    setShareDialogOpen(true)
  }

  const togglePlayPause = () => {
    const now = Date.now()
    const timeSinceLastClick = now - lastClickTimeRef.current

    // Double-click detected (clicks within 300ms)
    if (timeSinceLastClick < 300) {
      // Like the post
      if (!isLiked && !isLiking) {
        handleLike()
        // Show animation
        setShowLikeAnimation(true)
        setTimeout(() => setShowLikeAnimation(false), 1000)
      }
      lastClickTimeRef.current = 0 // Reset
      return
    }

    // Single click - toggle play/pause
    lastClickTimeRef.current = now
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        videoRef.current.play().catch(() => {})
        setIsPlaying(true)
      }
    }
  }

  const handleCommentAdded = () => {
    setCommentsCount((prev) => prev + 1)
  }

  const handleNotInterested = async () => {
    try {
      const supabase = createClient()
      if (currentUserId) {
        await supabase.from("hidden_posts").insert({
          user_id: currentUserId,
          post_id: post.id,
        })
        toast({ title: "Peak hidden", description: "You won't see this peak anymore" })
        onRefresh()
      }
    } catch (error) {
      console.error("Error hiding peak:", error)
    }
  }

  const handleFollow = async () => {
    if (isFollowLoading || !currentUserId) return

    setIsFollowLoading(true)
    try {
      const response = await fetch(`/api/users/${profile.id}/follow`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.following)

        toast({
          title: data.following ? "Following" : "Unfollowed",
          description: data.following
            ? `You are now following @${profile.username}`
            : `You unfollowed @${profile.username}`,
        })
      }
    } catch (error) {
      console.error("Error following user:", error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleMute = async () => {
    try {
      const supabase = createClient()
      if (currentUserId) {
        await supabase.from("muted_users").insert({
          user_id: currentUserId,
          muted_user_id: profile.id,
        })
        toast({ title: "User muted", description: `You won't see peaks from @${profile.username}` })
        onRefresh()
      }
    } catch (error) {
      console.error("Error muting user:", error)
    }
  }

  const handleBlock = async () => {
    try {
      const supabase = createClient()
      if (currentUserId) {
        await supabase.from("blocked_users").insert({
          user_id: currentUserId,
          blocked_user_id: profile.id,
        })
        toast({ title: "User blocked", description: `@${profile.username} has been blocked` })
        onRefresh()
      }
    } catch (error) {
      console.error("Error blocking user:", error)
    }
  }

  const handleCopyLink = async () => {
    const peakUrl = `${window.location.origin}/post/${post.id}`
    try {
      await navigator.clipboard.writeText(peakUrl)
      toast({
        title: "Link copied!",
        description: "Peak link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      })
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
          title: data.reposted ? "Peak reposted" : "Repost removed",
          description: data.reposted ? "Peak added to your profile" : "Peak removed from your profile",
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

  const primaryMediaUrl = post.media_urls?.[0]
  const primaryMediaType = post.media_types?.[0] || "image"

  return (
    <>
      <div
        ref={cardRef}
        data-index={index}
        className="relative h-screen w-full snap-start snap-always flex items-center justify-center bg-background overflow-hidden"
      >
        <div className="relative w-full h-full flex flex-col max-w-full md:max-w-lg">
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between z-20 p-3 md:p-4 bg-gradient-to-b from-background/80 to-transparent">
            <Link
              href={`/profile/${profile.username}`}
              className="flex items-center gap-2 md:gap-3 group min-w-0 flex-1"
            >
              <Avatar className="h-10 w-10 md:h-11 md:w-11 border-2 border-background flex-shrink-0">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-foreground font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-sm truncate">{profile.display_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors flex-shrink-0 ml-2">
                  <MoreHorizontal className="h-5 w-5 text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Copy link
                </DropdownMenuItem>
                {!canEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleNotInterested}>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Not Interested
                    </DropdownMenuItem>
                    {!isFollowing && (
                      <DropdownMenuItem onClick={handleFollow} disabled={isFollowLoading}>
                        {isFollowLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Following...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Follow @{profile.username}
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleMute}>
                      <VolumeX className="h-4 w-4 mr-2" />
                      Mute @{profile.username}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBlock} className="text-destructive">
                      <Ban className="h-4 w-4 mr-2" />
                      Block @{profile.username}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setReportDialogOpen(true)} className="text-destructive">
                      <Flag className="h-4 w-4 mr-2" />
                      Report Peak
                    </DropdownMenuItem>
                  </>
                )}
                {canEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit peak
                    </DropdownMenuItem>
                  </>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDialogOpen(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete peak
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-1 relative flex items-center justify-center bg-muted/5 w-full">
            {primaryMediaType === "video" ? (
              <>
                <video
                  ref={videoRef}
                  src={primaryMediaUrl}
                  className="w-full h-full object-contain cursor-pointer max-w-full"
                  loop
                  playsInline
                  onClick={togglePlayPause}
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
                  <Eye className="h-3.5 w-3.5 text-white" />
                  <span className="text-xs font-medium text-white">{viewsCount}</span>
                </div>
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <Play className="h-8 w-8 md:h-10 md:w-10 text-white ml-1" />
                    </div>
                  </div>
                )}
                {showLikeAnimation && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-in duration-300">
                    <Heart className="h-24 w-24 md:h-32 md:w-32 text-red-500 fill-red-500 drop-shadow-2xl animate-out zoom-out-50 fade-out duration-700" />
                  </div>
                )}
              </>
            ) : (
              <img
                src={primaryMediaUrl || "/placeholder.svg"}
                alt=""
                className="w-full h-full object-contain max-w-full"
              />
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border">
            {post.content && (
              <div className="px-3 md:px-4 pt-3 pb-2 border-b border-border">
                <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
              </div>
            )}

            <div className="px-3 md:px-4 py-3">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4 md:gap-6">
                  <button
                    onClick={handleLike}
                    disabled={isLiking}
                    className={`flex items-center gap-1.5 md:gap-2 transition-colors ${
                      isLiked ? "text-red-500" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500" : ""}`} />
                    <span className="text-sm font-medium">{likesCount}</span>
                  </button>

                  <button
                    onClick={handleComment}
                    className="flex items-center gap-1.5 md:gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">{commentsCount}</span>
                  </button>

                  <button
                    onClick={handleRepost}
                    disabled={isReposting}
                    className={`flex items-center gap-1.5 md:gap-2 transition-colors ${
                      isReposted ? "text-green-500" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Repeat2 className="h-5 w-5" />
                    <span className="text-sm font-medium">{repostsCount}</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 md:gap-4">
                  <button
                    onClick={handleBookmark}
                    disabled={isBookmarking}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <BookmarkIcon className="h-5 w-5" filled={isBookmarked} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {currentUserId && (
        <>
          <PeaksCommentDialog
            open={commentDialogOpen}
            onOpenChange={setCommentDialogOpen}
            postId={post.id}
            currentUserId={currentUserId}
            commentsCount={commentsCount}
            onCommentAdded={handleCommentAdded}
          />
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
                onRefresh()
                toast({
                  title: "Peak updated",
                  description: "Your peak has been updated successfully",
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
                onRefresh()
                toast({
                  title: "Peak deleted",
                  description: "The peak has been deleted successfully",
                })
              }}
            />
          )}
        </>
      )}
    </>
  )
}
