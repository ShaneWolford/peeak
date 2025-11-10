"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter, usePathname } from "next/navigation"

export function LiveMessageNotifications() {
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const setupMessageNotifications = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const dmChannel = supabase
        .channel("live-direct-messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "direct_messages",
            filter: `recipient_id=eq.${user.id}`,
          },
          async (payload) => {
            const newMessage = payload.new as any

            // Don't show notification if on the conversation page
            if (pathname?.includes(`/messages/${newMessage.sender_id}`)) return

            // Fetch sender info
            const { data: sender } = await supabase
              .from("profiles")
              .select("username, display_name, avatar_url")
              .eq("id", newMessage.sender_id)
              .single()

            if (sender) {
              toast({
                title: sender.display_name || sender.username,
                description: newMessage.content?.slice(0, 100) || "Sent you a message",
                action: {
                  label: "View",
                  onClick: () => router.push(`/messages/${sender.username}`),
                },
              })
            }
          },
        )
        .subscribe()

      const { data: userConversations } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id)

      const conversationIds = userConversations?.map((c) => c.conversation_id) || []

      const groupChannel = supabase
        .channel("live-group-messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          async (payload) => {
            const newMessage = payload.new as any

            // Only show notification if user is in this conversation and didn't send the message
            if (!conversationIds.includes(newMessage.conversation_id) || newMessage.sender_id === user.id) {
              return
            }

            // Don't show notification if on the conversation page
            if (pathname?.includes(`/messages/group/${newMessage.conversation_id}`)) return

            // Fetch sender and conversation info
            const [{ data: sender }, { data: conversation }] = await Promise.all([
              supabase
                .from("profiles")
                .select("username, display_name, avatar_url")
                .eq("id", newMessage.sender_id)
                .single(),
              supabase.from("conversations").select("name, avatar_url").eq("id", newMessage.conversation_id).single(),
            ])

            if (sender && conversation) {
              toast({
                title: conversation.name || "Group Chat",
                description: `${sender.display_name || sender.username}: ${newMessage.content?.slice(0, 80) || "Sent a message"}`,
                action: {
                  label: "View",
                  onClick: () => router.push(`/messages/group/${newMessage.conversation_id}`),
                },
              })
            }
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(dmChannel)
        supabase.removeChannel(groupChannel)
      }
    }

    setupMessageNotifications()
  }, [pathname])

  return null
}
