"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, ArrowLeft, Palette } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const PRESET_THEMES = [
  { name: "Ocean Blue", primaryColor: "#0ea5e9", accentColor: "#06b6d4" },
  { name: "Sunset Orange", primaryColor: "#f97316", accentColor: "#fb923c" },
  { name: "Forest Green", primaryColor: "#10b981", accentColor: "#34d399" },
  { name: "Royal Purple", primaryColor: "#8b5cf6", accentColor: "#a78bfa" },
  { name: "Rose Pink", primaryColor: "#ec4899", accentColor: "#f472b6" },
  { name: "Midnight Dark", primaryColor: "#1e293b", accentColor: "#334155" },
]

export default function ProThemePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isPro, setIsPro] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [primaryColor, setPrimaryColor] = useState("#3b82f6")
  const [accentColor, setAccentColor] = useState("#60a5fa")
  const [currentTheme, setCurrentTheme] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadProStatus()
  }, [])

  const loadProStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: proData } = await supabase.from("pro_features").select("*").eq("user_id", user.id).single()

      if (!proData || !proData.is_pro) {
        router.push("/settings/pro")
        return
      }

      setIsPro(true)

      // Load current theme
      if (proData.profile_theme && typeof proData.profile_theme === "object") {
        const theme = proData.profile_theme as any
        setPrimaryColor(theme.primaryColor || "#3b82f6")
        setAccentColor(theme.accentColor || "#60a5fa")
        setCurrentTheme(theme)
      }
    } catch (err) {
      console.error("Error loading Pro status:", err)
      toast({
        title: "Error",
        description: "Failed to load Pro status.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTheme = async () => {
    setIsSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const theme = {
        primaryColor,
        accentColor,
        updatedAt: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("pro_features")
        .update({
          profile_theme: theme,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (error) throw error

      toast({
        title: "Theme saved",
        description: "Your profile theme has been updated successfully.",
      })

      setCurrentTheme(theme)
    } catch (err) {
      console.error("Error saving theme:", err)
      toast({
        title: "Error",
        description: "Failed to save theme.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const applyPreset = (preset: (typeof PRESET_THEMES)[0]) => {
    setPrimaryColor(preset.primaryColor)
    setAccentColor(preset.accentColor)
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

  if (!isPro) {
    return null
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 bg-background">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <Button variant="ghost" size="sm" onClick={() => router.push("/settings/pro")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Pro Settings
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Palette className="h-8 w-8" />
              Profile Theme
            </h1>
            <p className="text-muted-foreground">Customize your profile colors (Pro feature)</p>
          </div>

          {/* Preset Themes */}
          <Card>
            <CardHeader>
              <CardTitle>Preset Themes</CardTitle>
              <CardDescription>Choose a preset or customize your own</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {PRESET_THEMES.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:border-foreground transition-colors text-left"
                  >
                    <div className="flex gap-1">
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.primaryColor }} />
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.accentColor }} />
                    </div>
                    <span className="text-sm font-medium">{preset.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Colors</CardTitle>
              <CardDescription>Fine-tune your theme colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#60a5fa"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>See how your theme will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 rounded-lg border" style={{ backgroundColor: primaryColor + "10" }}>
                <div className="space-y-3">
                  <div
                    className="h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Primary Color
                  </div>
                  <div
                    className="h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: accentColor }}
                  >
                    Accent Color
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSaveTheme} disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Theme"
            )}
          </Button>
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
