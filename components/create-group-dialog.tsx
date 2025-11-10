"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, Loader2, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [friends, setFriends] = useState<Profile[]>([])
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && friends.length === 0) {
      await loadFriends()
    }
  }

  const loadFriends = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Get users that the current user follows
      const { data: following } = await supabase.from("follows").select("following_id").eq("follower_id", user.id)

      const followingIds = following?.map((f) => f.following_id) || []

      if (followingIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", followingIds)
          .order("display_name")

        setFriends(profiles || [])
      }
    } catch (error) {
      console.error("Error loading friends:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMember = (userId: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedMembers(newSelected)
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.size === 0) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/conversations/create-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName.trim(),
          memberIds: Array.from(selectedMembers),
        }),
      })

      if (!response.ok) throw new Error("Failed to create group")

      const { conversation } = await response.json()

      setOpen(false)
      setGroupName("")
      setSelectedMembers(new Set())
      router.push(`/messages/group/${conversation.id}`)
      router.refresh()
    } catch (error) {
      console.error("Error creating group:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const filteredFriends = friends.filter(
    (friend) =>
      friend.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10 bg-transparent">
          <Users className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Group Chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label>Add Members ({selectedMembers.size} selected)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {searchQuery ? "No friends found" : "Follow people to add them to groups"}
              </div>
            ) : (
              filteredFriends.map((friend) => {
                const initials = friend.display_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => toggleMember(friend.id)}
                  >
                    <Checkbox
                      checked={selectedMembers.has(friend.id)}
                      onCheckedChange={() => toggleMember(friend.id)}
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
              })
            )}
          </div>

          <Button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedMembers.size === 0 || isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Group"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
