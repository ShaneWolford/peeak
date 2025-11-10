"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface EditMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messageId: string
  currentContent: string
  isDM: boolean
  onMessageEdited: () => void
}

export function EditMessageDialog({
  open,
  onOpenChange,
  messageId,
  currentContent,
  isDM,
  onMessageEdited,
}: EditMessageDialogProps) {
  const [content, setContent] = useState(currentContent || "")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setContent(currentContent || "")
  }, [currentContent])

  const handleSave = async () => {
    if (!content?.trim()) return

    setIsLoading(true)
    const supabase = createClient()
    const table = isDM ? "direct_messages" : "messages"

    try {
      await supabase
        .from(table)
        .update({
          content: content.trim(),
          edited_at: new Date().toISOString(),
        })
        .eq("id", messageId)

      toast({
        title: "Message edited",
        description: "Your message has been updated",
      })

      onMessageEdited()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to edit message",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit message</DialogTitle>
          <DialogDescription>Make changes to your message</DialogDescription>
        </DialogHeader>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message..."
          className="min-h-[100px]"
          maxLength={1000}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !content?.trim()}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
