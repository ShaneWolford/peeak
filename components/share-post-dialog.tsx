"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Profile } from "@/lib/types"

interface SharePostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: string
  onShareComplete?: () => void
}

interface Conversation {
  id: string
  name: string
  avatar_url: string | null
  type: string
}

export function SharePostDialog({ open, onOpenChange, postId, onShareComplete }: SharePostDialogProps) {
  const [friends, setFriends] = useState<Profile[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set())
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("friends")

  useEffect(() => {
    if (open) {
      fetchFriends()
      fetchConversations()
      setSelectedFriends(new Set())
      setSelectedConversations(new Set())
      setSearchQuery("")
    }
  }, [open])

  const fetchFriends = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/friends")
      if (response.ok) {
        const data = await response.json()
        setFriends(data.friends || [])
      }
    } catch (error) {
      console.error("Error fetching friends:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversations/list")
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    }
  }

  const toggleFriend = (userId: string) => {
    const newSelected = new Set(selectedFriends)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedFriends(newSelected)
  }

  const toggleConversation = (conversationId: string) => {
    const newSelected = new Set(selectedConversations)
    if (newSelected.has(conversationId)) {
      newSelected.delete(conversationId)
    } else {
      newSelected.add(conversationId)
    }
    setSelectedConversations(newSelected)
  }

  const handleShare = async () => {
    if (selectedFriends.size === 0 && selectedConversations.size === 0) return

    setIsSharing(true)
    try {
      // Share with friends
      if (selectedFriends.size > 0) {
        await fetch(`/api/posts/${postId}/share-with-friends`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendIds: Array.from(selectedFriends) }),
        })
      }

      // Share with group chats
      if (selectedConversations.size > 0) {
        await fetch(`/api/posts/${postId}/share-with-groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationIds: Array.from(selectedConversations) }),
        })
      }

      onShareComplete?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error sharing post:", error)
    } finally {
      setIsSharing(false)
    }
  }

  const filteredFriends = friends.filter(
    (friend) =>
      friend.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredConversations = conversations.filter((conversation) =>
    conversation.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalSelected = selectedFriends.size + selectedConversations.size

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share post</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="groups">Group Chats</TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === "friends" ? "Search friends..." : "Search group chats..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <TabsContent value="friends" className="mt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No friends found" : "No friends to share with"}
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {filteredFriends.map((friend) => {
                      const initials = friend.display_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)

                      return (
                        <div
                          key={friend.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => toggleFriend(friend.id)}
                        >
                          <Checkbox
                            checked={selectedFriends.has(friend.id)}
                            onCheckedChange={() => toggleFriend(friend.id)}
                          />
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={friend.avatar_url || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{friend.display_name}</p>
                            <p className="text-sm text-muted-foreground truncate">@{friend.username}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="groups" className="mt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No group chats found" : "No group chats to share with"}
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => toggleConversation(conversation.id)}
                      >
                        <Checkbox
                          checked={selectedConversations.has(conversation.id)}
                          onCheckedChange={() => toggleConversation(conversation.id)}
                        />
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.avatar_url || undefined} />
                          <AvatarFallback>
                            <Users className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{conversation.name}</p>
                          <p className="text-sm text-muted-foreground">Group chat</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleShare} disabled={totalSelected === 0 || isSharing} className="flex-1">
                {isSharing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sharing...
                  </>
                ) : (
                  `Share ${totalSelected > 0 ? `(${totalSelected})` : ""}`
                )}
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
