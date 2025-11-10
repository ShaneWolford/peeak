"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Conversation, ConversationMember, Profile } from "@/lib/types"
import { ArrowLeft, Loader2, UserMinus, Shield } from "lucide-react"
import { GroupPhotoUpload } from "@/components/group-photo-upload"
import { GroupBackgroundSelector } from "@/components/group-background-selector"
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

export default function GroupSettingsPage({
  params,
}: {
  params: Promise<{ conversationId: string }> | { conversationId: string }
}) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [members, setMembers] = useState<(ConversationMember & { profile?: Profile })[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [memberToKick, setMemberToKick] = useState<string | null>(null)
  const router = useRouter()

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
    if (conversationId) {
      loadGroupSettings()
    }
  }, [conversationId])

  const loadGroupSettings = async () => {
    if (!conversationId) return

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

      // Fetch conversation
      const { data: conv } = await supabase.from("conversations").select("*").eq("id", conversationId).single()

      if (!conv) {
        router.push("/messages")
        return
      }

      setConversation(conv)
      setGroupName(conv.name || "")

      // Fetch members
      const { data: membersData } = await supabase
        .from("conversation_members")
        .select("*, profile:profiles(*)")
        .eq("conversation_id", conversationId)
        .order("role", { ascending: false })

      setMembers(membersData || [])

      // Check if current user is admin
      const currentMember = membersData?.find((m) => m.user_id === user.id)
      setIsAdmin(currentMember?.role === "admin")
    } catch (error) {
      console.error("Error loading group settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!isAdmin || !groupName.trim() || !conversationId) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/conversations/${conversationId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName.trim() }),
      })

      if (!response.ok) throw new Error("Failed to update group")

      router.refresh()
    } catch (error) {
      console.error("Error updating group:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKickMember = async (userId: string) => {
    if (!isAdmin || !conversationId) return

    try {
      const response = await fetch(`/api/conversations/${conversationId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) throw new Error("Failed to remove member")

      setMembers(members.filter((m) => m.user_id !== userId))
      setMemberToKick(null)
    } catch (error) {
      console.error("Error removing member:", error)
    }
  }

  if (isLoading || !conversationId) {
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
      <main className="min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 md:pt-0">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="border-b border-border p-6 bg-background sticky top-16 md:top-0 z-40">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Group Settings</h1>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Group Info */}
            <div className="space-y-6">
              {isAdmin ? (
                <GroupPhotoUpload
                  currentPhotoUrl={conversation.avatar_url}
                  conversationId={conversationId}
                  groupName={conversation.name || "Group Chat"}
                  onUploadComplete={(url) => {
                    setConversation({ ...conversation, avatar_url: url })
                  }}
                />
              ) : (
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={conversation.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Group Photo</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={!isAdmin}
                  maxLength={50}
                />
              </div>

              {isAdmin && (
                <GroupBackgroundSelector
                  conversationId={conversationId}
                  currentBackground={conversation.background_url}
                  onBackgroundChange={(url) => {
                    setConversation({ ...conversation, background_url: url })
                  }}
                />
              )}

              {isAdmin && (
                <Button onClick={handleSaveSettings} disabled={isSaving || !groupName.trim()}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              )}
            </div>

            {/* Members List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Members ({members.length})</h2>
              <div className="space-y-2">
                {members.map((member) => {
                  const profile = member.profile
                  if (!profile) return null

                  const memberInitials = profile.display_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)

                  const isSelf = member.user_id === currentUserId
                  const isMemberAdmin = member.role === "admin"

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>{memberInitials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{profile.display_name}</p>
                          {isMemberAdmin && (
                            <div className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded">
                              <Shield className="h-3 w-3" />
                              Admin
                            </div>
                          )}
                          {isSelf && <span className="text-xs text-muted-foreground">(You)</span>}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
                      </div>
                      {isAdmin && !isSelf && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMemberToKick(member.user_id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <UserMinus className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
      <MobileBottomNav />

      {/* Kick Member Confirmation Dialog */}
      <AlertDialog open={!!memberToKick} onOpenChange={() => setMemberToKick(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the group? They will no longer be able to see messages or
              participate in the conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToKick && handleKickMember(memberToKick)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
