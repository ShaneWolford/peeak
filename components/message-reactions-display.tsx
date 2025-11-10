"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Reaction {
  emoji: string
  user_id: string
  id: string
}

interface MessageReactionsDisplayProps {
  reactions: Reaction[]
  currentUserId: string
  messageId: string
  isDM: boolean
  onReactionRemoved: () => void
}

export function MessageReactionsDisplay({
  reactions,
  currentUserId,
  messageId,
  isDM,
  onReactionRemoved,
}: MessageReactionsDisplayProps) {
  const { toast } = useToast()

  if (!reactions || reactions.length === 0) return null

  // Group reactions by emoji
  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = []
      }
      acc[reaction.emoji].push(reaction)
      return acc
    },
    {} as Record<string, Reaction[]>,
  )

  const handleReactionClick = async (emoji: string) => {
    const supabase = createClient()
    const table = isDM ? "direct_message_reactions" : "message_reactions"

    const userReaction = reactions.find((r) => r.emoji === emoji && r.user_id === currentUserId)

    try {
      if (userReaction) {
        // Remove reaction
        await supabase.from(table).delete().eq("id", userReaction.id)
      } else {
        // Add reaction
        await supabase.from(table).insert({
          message_id: messageId,
          user_id: currentUserId,
          emoji,
        })
      }

      onReactionRemoved()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(groupedReactions).map(([emoji, emojiReactions]) => {
        const hasUserReacted = emojiReactions.some((r) => r.user_id === currentUserId)
        return (
          <Button
            key={emoji}
            variant={hasUserReacted ? "default" : "outline"}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => handleReactionClick(emoji)}
          >
            {emoji} {emojiReactions.length}
          </Button>
        )
      })}
    </div>
  )
}
