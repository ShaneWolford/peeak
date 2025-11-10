"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

interface BadgeType {
  id: string
  name: string
  description: string
  icon_url: string
  color: string
}

interface UserProfile {
  id: string
  username: string
  display_name: string
  avatar_url: string
  badges: BadgeType[]
}

export default function AdminBadgesPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [badges, setBadges] = useState<BadgeType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAdminAndLoadBadges()
  }, [])

  const checkAdminAndLoadBadges = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

      if (!profile?.is_admin) {
        router.push("/feed")
        toast.error("Access denied")
        return
      }

      setIsAdmin(true)

      // Load all badges
      const { data: badgesData } = await supabase.from("badges").select("*").order("name")

      setBadges(badgesData || [])
    } catch (error) {
      console.error("Error checking admin status:", error)
      router.push("/feed")
    } finally {
      setIsLoading(false)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const supabase = createClient()

      const { data: users } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(10)

      if (users) {
        const usersWithBadges = await Promise.all(
          users.map(async (user) => {
            const { data: userBadges } = await supabase
              .from("user_badges")
              .select(
                `
                badges (*)
              `,
              )
              .eq("user_id", user.id)

            return {
              ...user,
              badges: userBadges?.map((ub: any) => ub.badges).filter(Boolean) || [],
            }
          }),
        )

        setSearchResults(usersWithBadges)
      }
    } catch (error) {
      console.error("Error searching users:", error)
      toast.error("Failed to search users")
    } finally {
      setIsSearching(false)
    }
  }

  const toggleBadge = async (userId: string, badgeId: string, hasBadge: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/badges`, {
        method: hasBadge ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeId }),
      })

      if (response.ok) {
        toast.success(hasBadge ? "Badge removed" : "Badge assigned")
        searchUsers() // Refresh results
      } else {
        toast.error("Failed to update badge")
      }
    } catch (error) {
      console.error("Error toggling badge:", error)
      toast.error("Failed to update badge")
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

  if (!isAdmin) {
    return null
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-14 pb-14 md:pb-6 md:pl-64 md:pt-0 flex justify-center bg-background">
        <div className="flex-1 max-w-[680px] border-x border-border">
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6" />
              <h1 className="text-xl font-bold">Badge Management</h1>
            </div>
          </div>

          <div className="p-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Badges</CardTitle>
                <CardDescription>Badges that can be assigned to users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <Badge key={badge.id} variant="secondary" style={{ backgroundColor: badge.color + "20" }}>
                      <span className="mr-1 inline-flex" dangerouslySetInnerHTML={{ __html: badge.icon_url }} />
                      {badge.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assign Badges to Users</CardTitle>
                <CardDescription>Search for users and manage their badges</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Search users by username or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                    />
                  </div>
                  <Button onClick={searchUsers} disabled={isSearching}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    {searchResults.map((user) => (
                      <div key={user.id} className="border border-border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {user.display_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.display_name}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Badges</Label>
                          <div className="flex flex-wrap gap-2">
                            {badges.map((badge) => {
                              const hasBadge = user.badges.some((b) => b.id === badge.id)
                              return (
                                <Button
                                  key={badge.id}
                                  variant={hasBadge ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => toggleBadge(user.id, badge.id, hasBadge)}
                                  style={
                                    hasBadge
                                      ? {
                                          backgroundColor: badge.color,
                                          borderColor: badge.color,
                                        }
                                      : undefined
                                  }
                                >
                                  <span
                                    className="mr-1 inline-flex"
                                    dangerouslySetInnerHTML={{ __html: badge.icon_url }}
                                  />
                                  {badge.name}
                                </Button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
