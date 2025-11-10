"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import type { Post } from "@/lib/types"
import { MediaUpload } from "./media-upload"
import { EmojiPicker } from "./emoji-picker"

interface EditPostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post: Post
  onSuccess: () => void
}

export function EditPostDialog({ open, onOpenChange, post, onSuccess }: EditPostDialogProps) {
  const [content, setContent] = useState(post.content || "")
  const [mediaUrls, setMediaUrls] = useState<string[]>(post.media_urls || [])
  const [mediaTypes, setMediaTypes] = useState<string[]>(post.media_types || [])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.substring(0, start) + emoji + content.substring(end)
    setContent(newContent)

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length
      textarea.focus()
    }, 0)
  }

  const handleSubmit = async () => {
    if (!content.trim() && mediaUrls.length === 0) {
      setError("Post must have content or media")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/posts/${post.id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim() || null,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
          media_types: mediaTypes.length > 0 ? mediaTypes : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to edit post")
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to edit post")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] text-base resize-none"
              maxLength={5000}
            />
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{content.length} / 5000</span>
            </div>
          </div>

          <div className="flex gap-2">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>

          <MediaUpload
            onMediaUploaded={(urls, types) => {
              setMediaUrls(urls)
              setMediaTypes(types)
            }}
          />

          {error && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md border border-destructive/20">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || (!content.trim() && mediaUrls.length === 0)}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
