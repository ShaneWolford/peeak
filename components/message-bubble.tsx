"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit, Trash2, Smile } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { MessageStatusIndicator } from "./message-status-indicator"
import { EditMessageDialog } from "./edit-message-dialog"
import { MessageReactionPicker } from "./message-reaction-picker"
import { MessageReactionsDisplay } from "./message-reactions-display"
import { LinkPreview } from "./link-preview"
import { detectUrls } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
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

interface MessageBubbleProps {
  message: any
  isOwnMessage: boolean
  currentUserId: string
  showSender?: boolean
  onMessageUpdated?: () => void
  isDM?: boolean
}

export function MessageBubble({
  message,
  isOwnMessage,
  currentUserId,
  showSender = false,
  onMessageUpdated,
  isDM = true,
}: MessageBubbleProps) {
  const { toast } = useToast()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteForEveryone, setDeleteForEveryone] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  const mediaUrl = message.media_url || (message.content && isImageUrl(message.content) ? message.content : null)
  const hasMedia = !!mediaUrl

  const urls = !hasMedia ? detectUrls(message.content || "") : []

  const handleDelete = async () => {
    try {
      const supabase = createClient()
      const table = isDM ? "direct_messages" : "messages"

      if (deleteForEveryone) {
        const { error } = await supabase
          .from(table)
          .update({
            deleted_for_everyone: true,
            is_deleted: true,
            content: "This message was deleted",
          })
          .eq("id", message.id)
          .eq("sender_id", currentUserId)

        if (error) throw error
      } else {
        const { error } = await supabase.from(table).update({ is_deleted: true }).eq("id", message.id)

        if (error) throw error
      }

      toast({
        title: "Message deleted",
        description: deleteForEveryone ? "Message deleted for everyone" : "Message deleted for you",
      })

      setShowDeleteDialog(false)
      onMessageUpdated?.()
    } catch (error) {
      console.error("[v0] Delete message error:", error)
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      })
    }
  }

  const senderInitials = message.sender
    ? message.sender.display_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  if (message.deleted_for_everyone || message.is_deleted) {
    return null
  }

  return (
    <>
      <div className={`flex gap-3 ${isOwnMessage ? "justify-end" : "justify-start"} group`}>
        {!isOwnMessage && showSender && message.sender && (
          <Avatar className="h-8 w-8 mt-1">
            <AvatarImage src={message.sender.avatar_url || undefined} />
            <AvatarFallback className="text-xs">{senderInitials}</AvatarFallback>
          </Avatar>
        )}
        <div className={`max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"} flex flex-col`}>
          {!isOwnMessage && showSender && message.sender && (
            <p className="text-xs font-medium text-muted-foreground mb-1">{message.sender.display_name}</p>
          )}
          <div className="relative">
            <div
              className={`absolute -top-2 ${isOwnMessage ? "-left-16" : "-right-16"} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10`}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 bg-background border border-border shadow-sm hover:bg-accent"
                onClick={() => setShowReactionPicker(!showReactionPicker)}
              >
                <Smile className="h-3.5 w-3.5" />
              </Button>
              {isOwnMessage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-background border border-border shadow-sm hover:bg-accent"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50">
                    {!hasMedia && (
                      <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit message
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteDialog(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete message
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div
              className={`rounded-2xl ${hasMedia ? "p-1" : "px-4 py-2"} ${
                isOwnMessage ? "bg-foreground text-background" : "bg-muted text-foreground"
              }`}
            >
              {hasMedia ? (
                <div className="relative">
                  <img
                    src={mediaUrl || "/placeholder.svg"}
                    alt="Shared media"
                    className="rounded-xl max-w-full h-auto max-h-[300px] object-contain"
                    loading="lazy"
                  />
                  <div
                    className={`flex items-center gap-1 mt-1 px-2 pb-1 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <p className={`text-xs ${isOwnMessage ? "text-background/70" : "text-muted-foreground"}`}>
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                    {isOwnMessage && message.status && (
                      <MessageStatusIndicator
                        status={message.status}
                        className={isOwnMessage ? "text-background/70" : ""}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-base leading-relaxed break-words">{message.content}</p>
                  {message.edited_at && (
                    <p className={`text-xs mt-1 ${isOwnMessage ? "text-background/50" : "text-muted-foreground/70"}`}>
                      (edited)
                    </p>
                  )}
                  <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                    <p className={`text-xs ${isOwnMessage ? "text-background/70" : "text-muted-foreground"}`}>
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                    {isOwnMessage && message.status && (
                      <MessageStatusIndicator
                        status={message.status}
                        className={isOwnMessage ? "text-background/70" : ""}
                      />
                    )}
                  </div>
                </>
              )}
            </div>

            {showReactionPicker && (
              <div className={`absolute top-full mt-2 ${isOwnMessage ? "right-0" : "left-0"} z-10`}>
                <MessageReactionPicker
                  messageId={message.id}
                  isDM={isDM}
                  currentReactions={message.reactions || []}
                  currentUserId={currentUserId}
                  onReactionAdded={() => {
                    setShowReactionPicker(false)
                    onMessageUpdated?.()
                  }}
                />
              </div>
            )}

            <MessageReactionsDisplay
              messageId={message.id}
              currentUserId={currentUserId}
              reactions={message.reactions || []}
              isDM={isDM}
              onReactionRemoved={() => onMessageUpdated?.()}
            />
          </div>

          {urls.length > 0 && (
            <div className="space-y-2 mt-2">
              {urls.map((url, index) => (
                <LinkPreview key={index} url={url} />
              ))}
            </div>
          )}
        </div>
      </div>

      {!hasMedia && (
        <EditMessageDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          messageId={message.id}
          currentContent={message.content}
          isDM={isDM}
          onMessageEdited={() => {
            toast({
              title: "Message updated",
              description: "Your message has been updated",
            })
            onMessageUpdated?.()
          }}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              Choose how you want to delete this message. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <button
              onClick={() => setDeleteForEveryone(false)}
              className={`w-full text-left p-3 rounded-lg border ${
                !deleteForEveryone ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <p className="font-medium text-sm">Delete for me</p>
              <p className="text-xs text-muted-foreground">Only you won't see this message</p>
            </button>
            <button
              onClick={() => setDeleteForEveryone(true)}
              className={`w-full text-left p-3 rounded-lg border ${
                deleteForEveryone ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <p className="font-medium text-sm">Delete for everyone</p>
              <p className="text-xs text-muted-foreground">This message will be removed for all participants</p>
            </button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

const isImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.toLowerCase()
    return (
      pathname.endsWith(".gif") ||
      pathname.endsWith(".jpg") ||
      pathname.endsWith(".jpeg") ||
      pathname.endsWith(".png") ||
      pathname.endsWith(".webp") ||
      urlObj.hostname.includes("tenor.com") ||
      urlObj.hostname.includes("giphy.com")
    )
  } catch {
    return false
  }
}
