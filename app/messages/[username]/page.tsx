"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SharedPostMessage } from "@/components/shared-post-message"
import type { Profile } from "@/lib/types"
import { ArrowLeft, Send, Loader2, Search } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useTypingIndicator } from "@/hooks/use-typing-indicator"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { TypingIndicator } from "@/components/typing-indicator"
import { OnlineStatusIndicator } from "@/components/online-status-indicator"
import { MessageSearchDialog } from "@/components/message-search-dialog"
import { MessageBubble } from "@/components/message-bubble"
import { EmojiPicker } from "@/components/emoji-picker"
import { GifPicker } from "@/components/gif-picker"
import { SendMessageRequestDialog } from "@/components/send-message-request-dialog"

export default function ConversationPage({
  params,
}: {
  params: { username: string } | Promise<{ username: string }>
}) {
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    const resolveParams = async () => {
      if (params instanceof Promise) {
        const resolved = await params
        setUsername(resolved.username)
      } else {
        setUsername(params.username)
      }
    }
    resolveParams()
  }, [params])

  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [canMessage, setCanMessage] = useState(false)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const [showSearchDialog, setShowSearchDialog] = useState(false)

  useEffect(() => {
    if (!username) return

    loadConversation()
  }, [username])

  useEffect(() => {
    if (!currentUserId || !otherUser) return

    const supabase = createClient()

    const channel = supabase
      .channel(`dm-${currentUserId}-${otherUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `or(and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},recipient_id.eq.${currentUserId}))`,
        },
        async (payload) => {
          const { data: newMessage } = await supabase
            .from("direct_messages")
            .select("*, sender:profiles!direct_messages_sender_id_fkey(*)")
            .eq("id", payload.new.id)
            .single()

          if (newMessage) {
            setMessages((prev) => [...prev, newMessage])

            if (newMessage.recipient_id === currentUserId) {
              await supabase
                .from("direct_messages")
                .update({
                  is_read: true,
                  status: "read",
                  read_at: new Date().toISOString(),
                })
                .eq("id", newMessage.id)
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          filter: `or(and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},recipient_id.eq.${currentUserId}))`,
        },
        async (payload) => {
          const { data: updatedMessage } = await supabase
            .from("direct_messages")
            .select("*, sender:profiles!direct_messages_sender_id_fkey(*)")
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
          table: "direct_messages",
          filter: `or(and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},recipient_id.eq.${currentUserId}))`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, otherUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadConversation = async () => {
    if (!username) return

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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle()

      if (profileError || !profile) {
        router.push("/messages")
        return
      }

      setOtherUser(profile)

      const { data: iFollowThem } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", profile.id)
        .maybeSingle()

      const { data: theyFollowMe } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", profile.id)
        .eq("following_id", user.id)
        .maybeSingle()

      const areMutualFollows = !!(iFollowThem && theyFollowMe)

      // Check for accepted message request
      const { data: acceptedRequest } = await supabase
        .from("message_requests")
        .select("id")
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${profile.id}),and(sender_id.eq.${profile.id},recipient_id.eq.${user.id})`,
        )
        .eq("status", "accepted")
        .maybeSingle()

      // Check for pending request
      const { data: pendingRequest } = await supabase
        .from("message_requests")
        .select("id")
        .eq("sender_id", user.id)
        .eq("recipient_id", profile.id)
        .eq("status", "pending")
        .maybeSingle()

      setHasPendingRequest(!!pendingRequest)

      const canMessageUser = areMutualFollows || !!acceptedRequest
      setCanMessage(canMessageUser)

      if (!canMessageUser) {
        return
      }

      await loadMessages(user.id, profile.id)

      await supabase
        .from("direct_messages")
        .update({
          is_read: true,
          status: "read",
          read_at: new Date().toISOString(),
        })
        .eq("sender_id", profile.id)
        .eq("recipient_id", user.id)
        .eq("is_read", false)
    } catch (error) {
      console.error("[v0] Error loading conversation:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (userId?: string, otherId?: string) => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const targetUserId = userId || currentUserId
      const targetOtherId = otherId || otherUser?.id

      if (!targetUserId || !targetOtherId) return

      const { data, error } = await supabase
        .from("direct_messages")
        .select(`
          *, 
          sender:profiles!direct_messages_sender_id_fkey(*),
          reactions:direct_message_reactions(*)
        `)
        .or(
          `and(sender_id.eq.${targetUserId},recipient_id.eq.${targetOtherId}),and(sender_id.eq.${targetOtherId},recipient_id.eq.${targetUserId})`,
        )
        .order("created_at", { ascending: true })

      if (error) {
        console.error("[v0] Error loading messages:", error)
        return
      }

      setMessages(data || [])

      const undeliveredMessages =
        data?.filter((msg: any) => msg.recipient_id === user.id && msg.status === "sent") || []

      if (undeliveredMessages.length > 0) {
        await supabase
          .from("direct_messages")
          .update({
            status: "delivered",
            delivered_at: new Date().toISOString(),
          })
          .in(
            "id",
            undeliveredMessages.map((msg: any) => msg.id),
          )
      }
    } catch (error) {
      console.error("[v0] Error loading messages:", error)
    }
  }

  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false)
  const { sendTypingIndicator, clearTypingIndicator } = useTypingIndicator(null, currentUserId, true, otherUser?.id)

  useOnlineStatus(currentUserId)

  useEffect(() => {
    if (!otherUser || !currentUserId) return

    const checkTyping = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("dm_typing_indicators")
        .select("*")
        .eq("sender_id", otherUser.id)
        .eq("recipient_id", currentUserId)
        .gte("updated_at", new Date(Date.now() - 5000).toISOString())
        .maybeSingle()

      setIsOtherUserTyping(!!data)
    }

    const interval = setInterval(checkTyping, 1000)
    return () => clearInterval(interval)
  }, [otherUser, currentUserId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !otherUser || !currentUserId || !canMessage) return

    setIsSending(true)
    try {
      const supabase = createClient()

      const { error } = await supabase.from("direct_messages").insert({
        sender_id: currentUserId,
        recipient_id: otherUser.id,
        content: newMessage.trim(),
        status: "sent",
      })

      if (error) throw error

      await supabase.from("notifications").insert({
        user_id: otherUser.id,
        type: "message",
        actor_id: currentUserId,
      })

      setNewMessage("")
      await loadMessages()
    } catch (error) {
      console.error("[v0] Error sending message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    if (e.target.value.trim()) {
      sendTypingIndicator()
    } else {
      clearTypingIndicator()
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
  }

  const handleGifSelect = async (gifUrl: string) => {
    if (!otherUser || !currentUserId || !canMessage) return

    setIsSending(true)
    try {
      const supabase = createClient()

      const { error } = await supabase.from("direct_messages").insert({
        sender_id: currentUserId,
        recipient_id: otherUser.id,
        content: gifUrl,
        media_url: gifUrl,
        status: "sent",
      })

      if (error) throw error

      await supabase.from("notifications").insert({
        user_id: otherUser.id,
        type: "message",
        actor_id: currentUserId,
      })

      await loadMessages()
    } catch (error) {
      console.error("[v0] Error sending GIF:", error)
    } finally {
      setIsSending(false)
    }
  }

  if (!username || isLoading) {
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

  if (!otherUser) {
    return null
  }

  if (!canMessage) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 md:pt-0">
          <div className="max-w-2xl mx-auto">
            <div className="border-b border-border p-4 bg-background sticky top-16 md:top-0 z-40">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold">Cannot Message</h1>
              </div>
            </div>
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                You can only message people who follow you and you follow back, or who have accepted your message
                request.
              </p>
              {hasPendingRequest ? (
                <p className="text-sm text-muted-foreground">You have a pending message request to this user.</p>
              ) : (
                <div className="flex flex-col gap-2 items-center">
                  <Button onClick={() => setShowRequestDialog(true)}>Send Message Request</Button>
                  <Link href={`/profile/${otherUser.username}`}>
                    <Button variant="outline">View Profile</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
        <MobileBottomNav />
        <SendMessageRequestDialog
          open={showRequestDialog}
          onOpenChange={setShowRequestDialog}
          recipientId={otherUser.id}
          recipientName={otherUser.display_name}
        />
      </>
    )
  }

  const initials = otherUser.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 md:pt-0 flex flex-col">
        <div className="max-w-2xl mx-auto w-full flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-1.5rem)]">
          <div className="border-b border-border p-4 bg-background sticky top-16 md:top-0 z-40">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <Link href={`/profile/${otherUser.username}`} className="flex items-center gap-3 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherUser.avatar_url || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{otherUser.display_name}</p>
                  <OnlineStatusIndicator
                    isOnline={otherUser.is_online || false}
                    showOnlineStatus={otherUser.show_online_status !== false}
                    lastSeen={otherUser.last_seen}
                  />
                </div>
              </Link>

              <Button variant="ghost" size="icon" onClick={() => setShowSearchDialog(true)}>
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">No messages yet. Start the conversation!</div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.sender_id === currentUserId
                const hasSharedPost = message.shared_post_id != null && message.shared_post_id !== undefined

                return (
                  <div key={message.id}>
                    {hasSharedPost ? (
                      <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-md w-full">
                          <SharedPostMessage postId={message.shared_post_id} />
                          <p
                            className={`text-xs mt-2 ${isOwnMessage ? "text-right text-muted-foreground" : "text-left text-muted-foreground"}`}
                          >
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <MessageBubble
                        message={message}
                        isOwnMessage={isOwnMessage}
                        currentUserId={currentUserId || ""}
                        onMessageUpdated={loadMessages}
                        isDM={true}
                      />
                    )}
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
            {isOtherUserTyping && <TypingIndicator displayName={otherUser.display_name} />}
          </div>

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
                  onChange={handleInputChange}
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

      <MessageSearchDialog
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
        otherUserId={otherUser?.id}
        isDM={true}
      />
    </>
  )
}
