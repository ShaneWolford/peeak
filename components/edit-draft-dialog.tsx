"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { MediaUpload } from "./media-upload"
import { EmojiPicker } from "./emoji-picker"
import { createClient } from "@/lib/supabase/client"

interface Draft {
  id: string
  author_id: string
  content: string | null
  media_urls: string[] | null
  media_types: string[] | null
  created_at: string
  updated_at: string
}

interface EditDraftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: Draft
  onSuccess: () => void
}

export function EditDraftDialog({ open, onOpenChange, draft, onSuccess }: EditDraftDialogProps) {
  const [content, setContent] = useState(draft.content || "")
  const [mediaUrls, setMediaUrls] = useState<string[]>(draft.media_urls || [])
  const [mediaTypes, setMediaTypes] = useState<string[]>(draft.media_types || [])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

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

  const handleSaveDraft = async () => {
    if (!content.trim() && mediaUrls.length === 0) {
      setError("Draft must have content or media")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from("post_drafts")
        .update({
          content: content.trim() || null,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
          media_types: mediaTypes.length > 0 ? mediaTypes : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", draft.id)

      if (updateError) throw updateError

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update draft")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!content.trim() && mediaUrls.length === 0) {
      setError("Post must have content or media")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Create the post
      const { error: insertError } = await supabase.from("posts").insert({
        author_id: draft.author_id,
        content: content.trim() || null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        media_types: mediaTypes.length > 0 ? mediaTypes : null,
      })

      if (insertError) throw insertError

      // Delete the draft
      const { error: deleteError } = await supabase.from("post_drafts").delete().eq("id", draft.id)

      if (deleteError) throw deleteError

      onSuccess()
      onOpenChange(false)
      router.push("/feed")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish post")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Draft</DialogTitle>
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
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isLoading || (!content.trim() && mediaUrls.length === 0)}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Draft"
            )}
          </Button>
          <Button onClick={handlePublish} disabled={isLoading || (!content.trim() && mediaUrls.length === 0)}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              "Publish"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
