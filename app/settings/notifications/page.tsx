"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Loader2, Heart, MessageCircle, UserPlus, AtSign, Repeat2, Mail } from "lucide-react"
import { NotificationIcon } from "@/components/icons/notification-icon"
import { toast } from "@/hooks/use-toast"

interface NotificationPreferences {
  likes: boolean
  comments: boolean
  follows: boolean
  mentions: boolean
  reposts: boolean
  messages: boolean
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    reposts: true,
    messages: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
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
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (error && error.code !== "PGRST116") throw error

      if (data) {
        setPreferences({
          likes: data.likes ?? true,
          comments: data.comments ?? true,
          follows: data.follows ?? true,
          mentions: data.mentions ?? true,
          reposts: data.reposts ?? true,
          messages: data.messages ?? true,
        })
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error)
      toast({
        title: "Failed to load preferences",
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

      const { error } = await supabase.from("notification_preferences").upsert(
        {
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )

      if (error) throw error

      toast({
        title: "Notification preferences updated",
        description: "Your changes have been saved.",
      })
    } catch (error) {
      console.error("Error saving notification preferences:", error)
      toast({
        title: "Failed to save preferences",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
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

  const notificationTypes = [
    {
      key: "likes" as const,
      icon: Heart,
      label: "Likes",
      description: "When someone likes your post",
    },
    {
      key: "comments" as const,
      icon: MessageCircle,
      label: "Comments",
      description: "When someone comments on your post",
    },
    {
      key: "follows" as const,
      icon: UserPlus,
      label: "Follows",
      description: "When someone follows you",
    },
    {
      key: "mentions" as const,
      icon: AtSign,
      label: "Mentions",
      description: "When someone mentions you in a post",
    },
    {
      key: "reposts" as const,
      icon: Repeat2,
      label: "Reposts",
      description: "When someone shares your post",
    },
    {
      key: "messages" as const,
      icon: Mail,
      label: "Messages",
      description: "When you receive a new message",
    },
  ]

  return (
    <>
      <Navigation />
      <main className="mobile-screen md:min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 bg-background">
        <div className="mobile-content max-w-2xl mx-auto p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <NotificationIcon className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Choose which notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {notificationTypes.map((type, index) => (
                <div key={type.key}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        <Label htmlFor={type.key} className="text-base font-semibold">
                          {type.label}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    <Switch
                      id={type.key}
                      checked={preferences[type.key]}
                      onCheckedChange={(checked) => updatePreference(type.key, checked)}
                    />
                  </div>
                  {index < notificationTypes.length - 1 && <div className="h-px bg-border mt-6" />}
                </div>
              ))}

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
