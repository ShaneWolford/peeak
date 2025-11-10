"use client"

import type React from "react"
import { useToast } from "@/hooks/use-toast"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, User, MapPin, Globe, Calendar, Check } from "lucide-react"
import { AvatarUpload } from "@/components/avatar-upload"
import { BannerUpload } from "@/components/banner-upload"
import { Progress } from "@/components/ui/progress"

export default function EditProfilePage() {
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [location, setLocation] = useState("")
  const [website, setWebsite] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [profileCompletion, setProfileCompletion] = useState(0)
  const router = useRouter()
  const { toast } = useToast()

  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const initialValuesRef = useRef<any>({})

  // Load profile on mount
  useEffect(() => {
    loadProfile()
  }, [])

  // Calculate completion dynamically
  useEffect(() => {
    const fields = [displayName, bio, location, website, birthDate, avatarUrl, bannerUrl]
    const filledFields = fields.filter((f) => Boolean(f && f.trim())).length
    setProfileCompletion(Math.round((filledFields / fields.length) * 100))
  }, [displayName, bio, location, website, birthDate, avatarUrl, bannerUrl])

  useEffect(() => {
    if (!initialValuesRef.current.displayName) return // Wait for initial load

    const hasChanges =
      displayName !== initialValuesRef.current.displayName ||
      bio !== initialValuesRef.current.bio ||
      location !== initialValuesRef.current.location ||
      website !== initialValuesRef.current.website ||
      birthDate !== initialValuesRef.current.birthDate

    setHasUnsavedChanges(hasChanges)
  }, [displayName, bio, location, website, birthDate])

  useEffect(() => {
    if (!hasUnsavedChanges || !userId) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      handleAutoSave()
    }, 2000) // Save 2 seconds after user stops typing

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [displayName, bio, location, website, birthDate, hasUnsavedChanges, userId])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  const loadProfile = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUserId(user.id)

      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) throw error

      if (profile) {
        const values = {
          displayName: profile.display_name ?? "",
          bio: profile.bio ?? "",
          location: profile.location ?? "",
          website: profile.website ?? "",
          birthDate: profile.birth_date ?? "",
          avatarUrl: profile.avatar_url ?? null,
          bannerUrl: profile.banner_url ?? null,
        }

        setDisplayName(values.displayName)
        setBio(values.bio)
        setLocation(values.location)
        setWebsite(values.website)
        setBirthDate(values.birthDate)
        setAvatarUrl(values.avatarUrl)
        setBannerUrl(values.bannerUrl)

        initialValuesRef.current = values
      }
    } catch (err) {
      console.error("Error loading profile:", err)
      setError("Failed to load profile. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAutoSave = async () => {
    if (!userId || isSaving) return

    setIsSaving(true)
    setError(null)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          location: location.trim() || null,
          website: website.trim() || null,
          birth_date: birthDate || null,
          profile_completion_percentage: profileCompletion,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (updateError) throw updateError

      initialValuesRef.current = {
        displayName,
        bio,
        location,
        website,
        birthDate,
        avatarUrl,
        bannerUrl,
      }

      setHasUnsavedChanges(false)
      setLastSaved(new Date())

      toast({
        title: "Saved",
        description: "Your changes have been saved automatically.",
      })
    } catch (err) {
      console.error("Auto-save error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to save changes."
      setError(errorMessage)
      toast({
        title: "Error saving",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear auto-save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    await handleAutoSave()
  }

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url)
    // Avatar upload already saves to database, just update local state
    initialValuesRef.current.avatarUrl = url
    setLastSaved(new Date())
  }

  const handleBannerUpload = (url: string) => {
    setBannerUrl(url || null)
    // Banner upload already saves to database, just update local state
    initialValuesRef.current.bannerUrl = url || null
    setLastSaved(new Date())
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
      <main className="min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 bg-muted/30">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Profile Completion */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Profile Completion</CardTitle>
                <CardDescription>Complete your profile to get discovered</CardDescription>
              </div>
              <div className="text-3xl font-bold">{profileCompletion}%</div>
            </CardHeader>
            <CardContent>
              <Progress value={profileCompletion} className="h-2" />
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Edit Profile</CardTitle>
                  <CardDescription>
                    {isSaving ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving...
                      </span>
                    ) : hasUnsavedChanges ? (
                      <span className="text-amber-600">Unsaved changes</span>
                    ) : lastSaved ? (
                      <span className="flex items-center gap-2 text-green-600">
                        <Check className="h-3 w-3" />
                        Saved {new Date(lastSaved).toLocaleTimeString()}
                      </span>
                    ) : (
                      "Update your public information"
                    )}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/profile")}
                  disabled={isSaving}
                >
                  View Profile
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSave} className="space-y-8">
                {/* Banner */}
                <div className="space-y-2">
                  <Label className="font-semibold">Banner Image</Label>
                  <BannerUpload currentBannerUrl={bannerUrl} userId={userId} onUploadComplete={handleBannerUpload} />
                </div>

                {/* Avatar */}
                <div className="space-y-2">
                  <Label className="font-semibold">Profile Picture</Label>
                  <AvatarUpload
                    currentAvatarUrl={avatarUrl}
                    userId={userId}
                    displayName={displayName}
                    onUploadComplete={handleAvatarUpload}
                  />
                </div>

                <div className="h-px bg-border" />

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Display Name *
                  </Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    placeholder="Your name"
                    className="h-11"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="min-h-[120px] resize-none"
                    maxLength={500}
                  />
                  <p className="text-sm text-muted-foreground text-right">{bio.length} / 500</p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Location
                  </Label>
                  <Input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                    className="h-11"
                  />
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="h-11"
                  />
                </div>

                {/* Birth Date */}
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Birth Date
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-sm text-muted-foreground">This will not be shown publicly</p>
                </div>

                {error && (
                  <div className="p-4 text-sm bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>
                    Back
                  </Button>
                  <Button type="submit" disabled={isSaving || !hasUnsavedChanges} size="lg">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                      </>
                    ) : hasUnsavedChanges ? (
                      "Save Now"
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" /> Saved
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
