"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { MoreHorizontal, EyeOff, UserPlus, VolumeX, Ban, Code, Flag, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface PostMenuProps {
  postId: string
  authorId: string
  authorUsername: string
  currentUserId: string
  isFollowing?: boolean
}

export function PostMenu({ postId, authorId, authorUsername, currentUserId, isFollowing }: PostMenuProps) {
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFollowingState, setIsFollowingState] = useState(isFollowing || false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const isOwnPost = currentUserId === authorId

  const embedCode = `<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/post/${postId}/embed" width="550" height="400" frameborder="0"></iframe>`

  const handleNotInterested = async () => {
    try {
      const supabase = createClient()
      await supabase.from("hidden_posts").insert({
        user_id: currentUserId,
        post_id: postId,
      })
      router.refresh()
    } catch (error) {
      console.error("Error hiding post:", error)
    }
  }

  const handleFollow = async () => {
    if (isFollowLoading) return

    setIsFollowLoading(true)
    try {
      const response = await fetch(`/api/users/${authorId}/follow`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setIsFollowingState(data.following)

        toast({
          title: data.following ? "Following" : "Unfollowed",
          description: data.following
            ? `You are now following @${authorUsername}`
            : `You unfollowed @${authorUsername}`,
        })

        router.refresh()
      } else {
        throw new Error("Failed to toggle follow")
      }
    } catch (error) {
      console.error("Error following user:", error)
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleMute = async () => {
    try {
      const supabase = createClient()
      await supabase.from("muted_users").insert({
        user_id: currentUserId,
        muted_user_id: authorId,
      })
      router.refresh()
    } catch (error) {
      console.error("Error muting user:", error)
    }
  }

  const handleBlock = async () => {
    try {
      const supabase = createClient()
      await supabase.from("blocked_users").insert({
        user_id: currentUserId,
        blocked_user_id: authorId,
      })
      router.refresh()
    } catch (error) {
      console.error("Error blocking user:", error)
    }
  }

  const handleReport = async () => {
    if (!reportReason.trim()) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      await supabase.from("reports").insert({
        reporter_id: currentUserId,
        reported_post_id: postId,
        reported_user_id: authorId,
        reason: reportReason.trim(),
      })
      setReportDialogOpen(false)
      setReportReason("")
      alert("Report submitted successfully")
    } catch (error) {
      console.error("Error reporting post:", error)
      alert("Failed to submit report")
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode)
    alert("Embed code copied to clipboard!")
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {!isOwnPost && (
            <>
              <DropdownMenuItem onClick={handleNotInterested}>
                <EyeOff className="h-4 w-4 mr-2" />
                Not Interested
              </DropdownMenuItem>
              {!isFollowingState && (
                <DropdownMenuItem onClick={handleFollow} disabled={isFollowLoading}>
                  {isFollowLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Following...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow @{authorUsername}
                    </>
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleMute}>
                <VolumeX className="h-4 w-4 mr-2" />
                Mute @{authorUsername}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBlock} className="text-destructive">
                <Ban className="h-4 w-4 mr-2" />
                Block @{authorUsername}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => setEmbedDialogOpen(true)}>
            <Code className="h-4 w-4 mr-2" />
            Embed Post
          </DropdownMenuItem>
          {!isOwnPost && (
            <DropdownMenuItem onClick={() => setReportDialogOpen(true)} className="text-destructive">
              <Flag className="h-4 w-4 mr-2" />
              Report Post
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
            <DialogDescription>
              Please describe why you're reporting this post. Our moderation team will review it.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe the issue..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleReport} disabled={isSubmitting || !reportReason.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Embed Dialog */}
      <Dialog open={embedDialogOpen} onOpenChange={setEmbedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed Post</DialogTitle>
            <DialogDescription>Copy this code to embed the post on your website.</DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-md">
            <code className="text-sm break-all">{embedCode}</code>
          </div>
          <DialogFooter>
            <Button onClick={copyEmbedCode}>Copy Code</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
