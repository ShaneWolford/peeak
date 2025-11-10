"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

export function useTypingIndicator(
  conversationId: string | null,
  userId: string | null,
  isDM = false,
  recipientId?: string,
) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const sendTypingIndicator = async () => {
    if (!userId) return

    const supabase = createClient()

    try {
      if (isDM && recipientId) {
        // For DMs
        await supabase.from("dm_typing_indicators").upsert({
          sender_id: userId,
          recipient_id: recipientId,
          updated_at: new Date().toISOString(),
        })
      } else if (conversationId) {
        // For group chats
        await supabase.from("typing_indicators").upsert({
          conversation_id: conversationId,
          user_id: userId,
          updated_at: new Date().toISOString(),
        })
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Set timeout to remove indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(async () => {
        if (isDM && recipientId) {
          await supabase.from("dm_typing_indicators").delete().eq("sender_id", userId).eq("recipient_id", recipientId)
        } else if (conversationId) {
          await supabase.from("typing_indicators").delete().eq("conversation_id", conversationId).eq("user_id", userId)
        }
      }, 3000)
    } catch (error) {
      console.error("[v0] Error sending typing indicator:", error)
    }
  }

  const clearTypingIndicator = async () => {
    if (!userId) return

    const supabase = createClient()

    try {
      if (isDM && recipientId) {
        await supabase.from("dm_typing_indicators").delete().eq("sender_id", userId).eq("recipient_id", recipientId)
      } else if (conversationId) {
        await supabase.from("typing_indicators").delete().eq("conversation_id", conversationId).eq("user_id", userId)
      }
    } catch (error) {
      console.error("[v0] Error clearing typing indicator:", error)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return { sendTypingIndicator, clearTypingIndicator }
}
