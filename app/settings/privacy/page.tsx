"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Loader2, Lock, MessageSquare, Eye, Users } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function PrivacySettingsPage() {
  const [isPrivate, setIsPrivate] = useState(false)
  const [allowMessagesFrom, setAllowMessagesFrom] = useState<"everyone" | "following" | "none">("everyone")
  const [showActivity, setShowActivity] = useState(true)
  const [showFollowersList, setShowFollowersList] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
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
        .from("profiles")
        .select("is_private, allow_messages_from, show_activity, show_followers_list")
        .eq("id", user.id)
        .single()

      if (error) throw error

      if (data) {
        setIsPrivate(data.is_private ?? false)
        setAllowMessagesFrom(data.allow_messages_from ?? "everyone")
        setShowActivity(data.show_activity ?? true)
        setShowFollowersList(data.show_followers_list ?? true)
      }
    } catch (error) {
      console.error("Error loading privacy settings:", error)
      toast({
        title: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("You must be logged in")

      const { error } = await supabase
        .from("profiles")
        .update({
          is_private: isPrivate,
          allow_messages_from: allowMessagesFrom,
          show_activity: showActivity,
          show_followers_list: showFollowersList,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Privacy settings updated",
        description: "Your changes have been saved.",
      })
    } catch (error) {
      console.error("Error saving privacy settings:", error)
      toast({
        title: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <MobileBottomNav />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="mobile-screen md:min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 bg-background">
        <div className="mobile-content max-w-2xl mx-auto p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>Control who can see your content and interact with you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Private Account */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <Label htmlFor="private-account" className="text-base font-semibold">
                        Private Account
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      When your account is private, only people you approve can see your posts and follow you.
                    </p>
                  </div>
                  <Switch id="private-account" checked={isPrivate} onCheckedChange={setIsPrivate} />
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Message Permissions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <Label className="text-base font-semibold">Who can message you</Label>
                </div>
                <RadioGroup value={allowMessagesFrom} onValueChange={(v) => setAllowMessagesFrom(v as any)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="everyone" id="msg-everyone" />
                    <Label htmlFor="msg-everyone" className="font-normal cursor-pointer">
                      Everyone
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="following" id="msg-following" />
                    <Label htmlFor="msg-following" className="font-normal cursor-pointer">
                      People you follow
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="msg-none" />
                    <Label htmlFor="msg-none" className="font-normal cursor-pointer">
                      No one
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="h-px bg-border" />

              {/* Activity Status */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <Label htmlFor="show-activity" className="text-base font-semibold">
                        Show Activity Status
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">Let others see when you're active on the platform.</p>
                  </div>
                  <Switch id="show-activity" checked={showActivity} onCheckedChange={setShowActivity} />
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Show Followers/Following Lists */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <Label htmlFor="show-followers-list" className="text-base font-semibold">
                        Show Followers/Following Lists
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see who follows you and who you follow.
                    </p>
                  </div>
                  <Switch id="show-followers-list" checked={showFollowersList} onCheckedChange={setShowFollowersList} />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={isSaving} size="lg">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
