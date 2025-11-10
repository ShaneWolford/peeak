"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Users } from "lucide-react"

interface Conversation {
  id: string
  type: "dm" | "group"
  name: string
  username?: string
  avatar_url: string | null
  last_message: string | null
  last_message_at: string | null
  other_user?: {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
  }
  unread_count: number
}

interface ConversationsListProps {
  conversations: Conversation[]
  currentUserId: string
}

export function ConversationsList({ conversations, currentUserId }: ConversationsListProps) {
  if (conversations.length === 0) {
    return <div className="p-12 text-center text-muted-foreground">No messages yet</div>
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conversation) => {
        const displayName = conversation.name
        const displayUsername = conversation.username ? `@${conversation.username}` : null
        const avatarUrl = conversation.avatar_url
        const initials = displayName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)

        const href =
          conversation.type === "group" ? `/messages/group/${conversation.id}` : `/messages/${conversation.username}`

        return (
          <Link key={conversation.id} href={href} className="flex gap-4 p-6 hover:bg-muted/30 transition-colors">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              {conversation.type === "group" && (
                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                  <Users className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex flex-col">
                  <span className="font-semibold">{displayName}</span>
                  {displayUsername && <span className="text-sm text-muted-foreground">{displayUsername}</span>}
                </div>
                {conversation.last_message_at && (
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(conversation.last_message_at), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>

              {conversation.last_message ? (
                <p
                  className={`text-sm truncate ${conversation.unread_count > 0 ? "font-semibold" : "text-muted-foreground"}`}
                >
                  {conversation.last_message}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {conversation.type === "group" ? "No messages yet" : "Start a conversation"}
                </p>
              )}

              {conversation.unread_count > 0 && (
                <div className="mt-2">
                  <span className="inline-flex items-center justify-center h-5 px-2 text-xs font-semibold bg-foreground text-background rounded-full">
                    {conversation.unread_count}
                  </span>
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
