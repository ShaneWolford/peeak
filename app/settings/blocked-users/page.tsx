"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Ban } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

interface BlockedUser {
  id: string
  blocked_user_id: string
  profiles: {
    username: string
    display_name: string
    avatar_url: string | null
  }
}

export default function BlockedUsersPage() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unblockingId, setUnblockingId] = useState<string | null>(null)

  useEffect(() => {
    loadBlockedUsers()
  }, [])

  const loadBlockedUsers = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("blocked_users")
        .select(
          `
          id,
          blocked_user_id,
          profiles:blocked_user_id (
            username,
            display_name,
            avatar_url
          )
        `,
        )
        .eq("user_id", user.id)

      if (error) throw error

      setBlockedUsers(data || [])
    } catch (error) {
      console.error("Error loading blocked users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnblock = async (blockId: string, username: string) => {
    setUnblockingId(blockId)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { error } = await supabase.from("blocked_users").delete().eq("id", blockId)

      if (error) throw error

      setBlockedUsers((prev) => prev.filter((u) => u.id !== blockId))

      toast({
        title: "User unblocked",
        description: `@${username} has been unblocked.`,
      })
    } catch (error) {
      console.error("Error unblocking user:", error)
      toast({
        title: "Failed to unblock user",
        variant: "destructive",
      })
    } finally {
      setUnblockingId(null)
    }
  }

  return (
    <>
      <Navigation />
      <main className="mobile-screen md:min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 bg-background">
        <div className="mobile-content max-w-2xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Blocked Users
              </CardTitle>
              <CardDescription>Manage users you've blocked</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : blockedUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Ban className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>You haven't blocked anyone</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {blockedUsers.map((blocked) => (
                    <div key={blocked.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <Link href={`/profile/${blocked.profiles.username}`} className="flex items-center gap-3 flex-1">
                        <Avatar>
                          <AvatarImage src={blocked.profiles.avatar_url || undefined} />
                          <AvatarFallback>{blocked.profiles.display_name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{blocked.profiles.display_name}</p>
                          <p className="text-sm text-muted-foreground">@{blocked.profiles.username}</p>
                        </div>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblock(blocked.id, blocked.profiles.username)}
                        disabled={unblockingId === blocked.id}
                      >
                        {unblockingId === blocked.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Unblocking...
                          </>
                        ) : (
                          "Unblock"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
