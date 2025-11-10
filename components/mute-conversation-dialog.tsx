"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface MuteConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId?: string
  otherUserId?: string
  isDM: boolean
  onMuted: () => void
}

export function MuteConversationDialog({
  open,
  onOpenChange,
  conversationId,
  otherUserId,
  isDM,
  onMuted,
}: MuteConversationDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleMute = async (duration?: number) => {
    setIsLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    try {
      const mutedUntil = duration ? new Date(Date.now() + duration * 60 * 60 * 1000).toISOString() : null

      if (isDM && otherUserId) {
        await supabase.from("muted_direct_messages").insert({
          user_id: user.id,
          other_user_id: otherUserId,
          muted_until: mutedUntil,
        })
      } else if (conversationId) {
        await supabase.from("muted_conversations").insert({
          user_id: user.id,
          conversation_id: conversationId,
          muted_until: mutedUntil,
        })
      }

      toast({
        title: "Conversation muted",
        description: duration ? `Muted for ${duration} hours` : "Muted until you unmute it",
      })

      onMuted()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mute conversation",
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
          <DialogTitle>Mute conversation</DialogTitle>
          <DialogDescription>You won't receive notifications from this conversation</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => handleMute(8)}
            disabled={isLoading}
          >
            For 8 hours
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => handleMute(24)}
            disabled={isLoading}
          >
            For 1 day
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => handleMute(168)}
            disabled={isLoading}
          >
            For 1 week
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => handleMute()}
            disabled={isLoading}
          >
            Until I unmute
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
