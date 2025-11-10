import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Inbox } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default async function MessagesPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  const { data: requestsCount } = await supabase
    .from("message_requests")
    .select("id", { count: "exact" })
    .eq("recipient_id", user.id)
    .eq("status", "pending")

  const pendingRequestsCount = requestsCount?.length || 0

  let conversationsData: any[] = []

  try {
    // Fetch direct messages
    const { data: messages, error: messagesError } = await supabase
      .from("direct_messages")
      .select(`
        *,
        sender:profiles!direct_messages_sender_id_fkey(id, username, display_name, avatar_url),
        recipient:profiles!direct_messages_recipient_id_fkey(id, username, display_name, avatar_url)
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false })

    if (!messagesError && messages) {
      const conversationMap = new Map<string, any>()

      messages.forEach((msg: any) => {
        const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id
        const partner = msg.sender_id === user.id ? msg.recipient : msg.sender

        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            id: partnerId,
            type: "dm",
            name: partner.display_name || partner.username,
            username: partner.username,
            avatar_url: partner.avatar_url,
            last_message: msg.content,
            last_message_at: msg.created_at,
            other_user: partner,
            unread_count: 0,
          })
        }
      })

      conversationsData = Array.from(conversationMap.values())
    }

    const { data: groupMemberships } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id)

    if (groupMemberships && groupMemberships.length > 0) {
      const conversationIds = groupMemberships.map((m: any) => m.conversation_id)

      const { data: groups } = await supabase
        .from("conversations")
        .select("*")
        .in("id", conversationIds)
        .eq("type", "group")

      if (groups) {
        for (const group of groups) {
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("conversation_id", group.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()

          conversationsData.push({
            id: group.id,
            type: "group",
            name: group.name,
            avatar_url: group.avatar_url,
            last_message: lastMessage?.content || null,
            last_message_at: lastMessage?.created_at || group.created_at,
            unread_count: 0,
          })
        }
      }
    }

    conversationsData.sort((a, b) => {
      const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
      const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
      return timeB - timeA
    })
  } catch (error) {
    console.error("[v0] Error fetching conversations:", error)
  }

  return (
    <>
      <Navigation />
      <main className="mobile-screen md:min-h-screen pt-14 pb-14 md:pb-6 md:pl-64 md:pt-0 bg-background md:flex md:justify-center">
        <div className="mobile-content flex-1 max-w-[680px] md:border-x border-border overflow-y-auto">
          <div className="border-b border-border p-4 bg-background md:sticky top-14 md:top-0 z-40">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Direct Message"
                className="w-full h-11 px-4 pr-10 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {pendingRequestsCount > 0 && (
            <Link
              href="/message-requests"
              className="flex items-center gap-3 p-4 border-b border-border hover:bg-muted/30 transition-colors"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Inbox className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Message Requests</p>
                <p className="text-sm text-muted-foreground">
                  {pendingRequestsCount} pending {pendingRequestsCount === 1 ? "request" : "requests"}
                </p>
              </div>
              <Badge variant="secondary">{pendingRequestsCount}</Badge>
            </Link>
          )}

          {conversationsData.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No messages yet</div>
          ) : (
            <div className="divide-y divide-border">
              {conversationsData.map((conversation) => {
                const initials = conversation.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)

                const href =
                  conversation.type === "dm"
                    ? `/messages/${conversation.username}`
                    : `/messages/group/${conversation.id}`

                return (
                  <Link
                    key={conversation.id}
                    href={href}
                    className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.avatar_url || undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{conversation.name}</p>
                        {conversation.last_message_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: false }).replace(
                              "about ",
                              "",
                            )}
                          </span>
                        )}
                      </div>
                      {conversation.last_message && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{conversation.last_message}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
