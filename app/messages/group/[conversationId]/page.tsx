"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { DirectMessage, Profile, Conversation, ConversationMember } from "@/lib/types"
import { ArrowLeft, Send, Loader2, Settings, MoreVertical, BellOff, LogOut } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MuteConversationDialog } from "@/components/mute-conversation-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MessageBubble } from "@/components/message-bubble"
import { EmojiPicker } from "@/components/emoji-picker"
import { GifPicker } from "@/components/gif-picker"

export default function GroupConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }> | { conversationId: string }
}) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<(DirectMessage & { sender?: Profile })[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [members, setMembers] = useState<(ConversationMember & { profile?: Profile })[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  const [showMuteDialog, setShowMuteDialog] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)

  useEffect(() => {
    const resolveParams = async () => {
      if (params instanceof Promise) {
        const resolved = await params
        setConversationId(resolved.conversationId)
      } else {
        setConversationId(params.conversationId)
      }
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (!conversationId) return
    loadConversation()
  }, [conversationId])

  useEffect(() => {
    if (!conversationId || !currentUserId) return

    const supabase = createClient()

    // Subscribe to new messages in this conversation
    const channel = supabase
      .channel(`group-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log("[v0] New message received:", payload)
          // Fetch the full message with sender profile
          const { data: newMessage } = await supabase
            .from("messages")
            .select("*, sender:profiles!messages_sender_id_fkey(*)")
            .eq("id", payload.new.id)
            .single()

          if (newMessage) {
            setMessages((prev) => [...prev, newMessage])

            // Mark as read if not sent by current user
            if (newMessage.sender_id !== currentUserId) {
              await supabase.from("messages").update({ is_read: true }).eq("id", newMessage.id)
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log("[v0] Message updated:", payload)
          // Fetch the updated message with sender profile
          const { data: updatedMessage } = await supabase
            .from("messages")
            .select("*, sender:profiles!messages_sender_id_fkey(*)")
            .eq("id", payload.new.id)
            .single()

          if (updatedMessage) {
            setMessages((prev) => prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)))
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("[v0] Message deleted:", payload)
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId])

  useEffect(() => {
    if (!conversationId) return
    loadConversation()
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadConversation = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setCurrentUserId(user.id)

      // Fetch conversation details
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single()

      if (convError || !conv) {
        router.push("/messages")
        return
      }

      setConversation(conv)

      // Fetch members
      const { data: membersData } = await supabase
        .from("conversation_members")
        .select("*, profile:profiles(*)")
        .eq("conversation_id", conversationId)

      setMembers(membersData || [])

      // Check if user is a member
      const isMember = membersData?.some((m) => m.user_id === user.id)
      if (!isMember) {
        router.push("/messages")
        return
      }

      await loadMessages()

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("is_read", false)
    } catch (error) {
      console.error("Error loading conversation:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(*), reactions:message_reactions(*)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !currentUserId || !conversation) return

    setIsSending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: newMessage.trim(),
      })

      if (error) throw error

      // Create notifications for all members except sender
      const notifications = members
        .filter((m) => m.user_id !== currentUserId)
        .map((m) => ({
          user_id: m.user_id,
          type: "message" as const,
          actor_id: currentUserId,
        }))

      await supabase.from("notifications").insert(notifications)

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!currentUserId || !conversationId) return

    try {
      const supabase = createClient()
      await supabase
        .from("conversation_members")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("user_id", currentUserId)

      toast({
        title: "Left group",
        description: "You have left the conversation",
      })

      router.push("/messages")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave group",
        variant: "destructive",
      })
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
  }

  const handleGifSelect = async (gifUrl: string) => {
    if (!currentUserId || !conversation) return

    setIsSending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: gifUrl,
        media_url: gifUrl,
      })

      if (error) throw error

      // Create notifications for all members except sender
      const notifications = members
        .filter((m) => m.user_id !== currentUserId)
        .map((m) => ({
          user_id: m.user_id,
          type: "message" as const,
          actor_id: currentUserId,
        }))

      await supabase.from("notifications").insert(notifications)
    } catch (error) {
      console.error("Error sending GIF:", error)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 md:pt-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <MobileBottomNav />
      </>
    )
  }

  if (!conversation) {
    return null
  }

  const initials = conversation.name?.slice(0, 2).toUpperCase() || "GC"

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 md:pt-0 flex flex-col">
        <div className="max-w-2xl mx-auto w-full flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-1.5rem)]">
          {/* Group Header */}
          <div className="border-b border-border p-4 bg-background sticky top-16 md:top-0 z-40">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <Avatar className="h-10 w-10">
                <AvatarImage src={conversation.avatar_url || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="font-semibold">{conversation.name || "Unnamed Group"}</p>
                <p className="text-sm text-muted-foreground">{members.length} members</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/messages/group/${conversationId}/settings`)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Group settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowMuteDialog(true)}>
                    <BellOff className="h-4 w-4 mr-2" />
                    Mute conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowLeaveDialog(true)} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Leave group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-6 space-y-4 relative"
            style={{
              background:
                conversation.background_url?.startsWith("linear-gradient") ||
                conversation.background_url?.startsWith("#")
                  ? conversation.background_url
                  : conversation.background_url
                    ? `url(${conversation.background_url}) center/cover`
                    : undefined,
            }}
          >
            {conversation.background_url && <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />}

            <div className="relative z-10">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">No messages yet. Start the conversation!</div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.sender_id === currentUserId

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwnMessage={isOwnMessage}
                      currentUserId={currentUserId || ""}
                      showSender={true}
                      onMessageUpdated={loadMessages}
                      isDM={false}
                    />
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t border-border p-4 bg-background">
            <form onSubmit={handleSend} className="space-y-2">
              <div className="flex gap-2">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                <GifPicker onGifSelect={handleGifSelect} />
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 h-11"
                  maxLength={1000}
                />
                <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()} className="h-11 w-11">
                  {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <MobileBottomNav />

      <MuteConversationDialog
        open={showMuteDialog}
        onOpenChange={setShowMuteDialog}
        conversationId={conversationId || undefined}
        isDM={false}
        onMuted={() => {
          toast({
            title: "Conversation muted",
            description: "You won't receive notifications from this conversation",
          })
        }}
      />

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group? You won't be able to see messages or participate unless someone
              adds you back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveGroup} className="bg-destructive text-destructive-foreground">
              Leave group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
