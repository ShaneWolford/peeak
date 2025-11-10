"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

interface MessageReactionPickerProps {
  messageId: string
  isDM: boolean
  currentReactions?: Array<{ emoji: string; user_id: string }>
  currentUserId: string
  onReactionAdded: () => void
}

export function MessageReactionPicker({
  messageId,
  isDM,
  currentReactions = [],
  currentUserId,
  onReactionAdded,
}: MessageReactionPickerProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const handleReaction = async (emoji: string) => {
    const supabase = createClient()
    const table = isDM ? "direct_message_reactions" : "message_reactions"

    try {
      // Check if user already reacted with this emoji
      const existingReaction = currentReactions.find((r) => r.emoji === emoji && r.user_id === currentUserId)

      if (existingReaction) {
        // Remove reaction
        await supabase.from(table).delete().eq("message_id", messageId).eq("user_id", currentUserId).eq("emoji", emoji)
      } else {
        // Add reaction
        await supabase.from(table).insert({
          message_id: messageId,
          user_id: currentUserId,
          emoji,
        })
      }

      onReactionAdded()
      setOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      })
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          React
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1">
          {EMOJI_OPTIONS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform"
              onClick={() => handleReaction(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
