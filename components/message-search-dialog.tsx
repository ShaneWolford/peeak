"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"

interface MessageSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId?: string
  otherUserId?: string
  isDM: boolean
}

export function MessageSearchDialog({
  open,
  onOpenChange,
  conversationId,
  otherUserId,
  isDM,
}: MessageSearchDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    try {
      if (isDM && otherUserId) {
        const { data } = await supabase
          .from("direct_messages")
          .select("*, sender:profiles!direct_messages_sender_id_fkey(*)")
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .or(`sender_id.eq.${otherUserId},recipient_id.eq.${otherUserId}`)
          .ilike("content", `%${query}%`)
          .order("created_at", { ascending: false })
          .limit(20)

        setResults(data || [])
      } else if (conversationId) {
        const { data } = await supabase
          .from("messages")
          .select("*, sender:profiles!messages_sender_id_fkey(*)")
          .eq("conversation_id", conversationId)
          .ilike("content", `%${query}%`)
          .order("created_at", { ascending: false })
          .limit(20)

        setResults(data || [])
      }
    } catch (error) {
      console.error("[v0] Error searching messages:", error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Search messages</DialogTitle>
          <DialogDescription>Search for messages in this conversation</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            placeholder="Search messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
            <Search className="h-4 w-4" />
          </Button>
          {query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setQuery("")
                setResults([])
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 mt-4">
          {results.length === 0 && query && !isSearching && (
            <p className="text-center text-muted-foreground py-8">No messages found</p>
          )}
          {results.map((message) => (
            <div key={message.id} className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-sm">{message.sender?.display_name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </p>
              </div>
              <p className="text-sm text-foreground">{message.content}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
