"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, ArrowLeft, CheckCircle, Palette, TrendingUp, Zap, ExternalLink, Crown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function ProSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isPro, setIsPro] = useState(false)
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadProStatus()
  }, [])

  const loadProStatus = async () => {
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro, pro_expires_at")
        .eq("id", user.id)
        .single()

      if (profile) {
        setIsPro(profile.is_pro || false)
        setProExpiresAt(profile.pro_expires_at)
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
      <main className="min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 bg-background">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Button variant="ghost" size="sm" onClick={() => router.push("/settings")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-foreground" />
              <h1 className="text-3xl font-bold">Peeak Pro</h1>
            </div>
            <p className="text-muted-foreground">
              {isPro
                ? "You have access to all premium features"
                : "Upgrade to unlock premium features and support the platform"}
            </p>
          </div>

          {isPro && (
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="h-5 w-5" />
                    <div>
                      <CardTitle>Pro Member</CardTitle>
                      <CardDescription>
                        {proExpiresAt ? `Expires ${new Date(proExpiresAt).toLocaleDateString()}` : "Lifetime access"}
                      </CardDescription>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5" />
                </div>
              </CardHeader>
            </Card>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-4">Pro Features</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="hover:border-foreground/20 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 mt-0.5" />
                    <div className="space-y-1">
                      <CardTitle className="text-base">Verified Badge</CardTitle>
                      <CardDescription className="text-sm">
                        Get the exclusive verified checkmark on your profile
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="hover:border-foreground/20 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Palette className="h-5 w-5 mt-0.5" />
                    <div className="space-y-1">
                      <CardTitle className="text-base">Custom Profile Themes</CardTitle>
                      <CardDescription className="text-sm">Personalize your profile with custom themes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {isPro && (
                  <CardContent className="pt-0">
                    <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                      <Link href="/settings/pro/theme">Customize Theme</Link>
                    </Button>
                  </CardContent>
                )}
              </Card>

              <Card className="hover:border-foreground/20 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 mt-0.5" />
                    <div className="space-y-1">
                      <CardTitle className="text-base">Boosted Visibility</CardTitle>
                      <CardDescription className="text-sm">Priority placement in feeds and discovery</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="hover:border-foreground/20 transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 mt-0.5" />
                    <div className="space-y-1">
                      <CardTitle className="text-base">Early Access</CardTitle>
                      <CardDescription className="text-sm">Try new features before everyone else</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>

          {!isPro && (
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Ready to Upgrade?</CardTitle>
                <CardDescription>Support Peeak and unlock premium features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild size="lg" className="w-full gap-2">
                  <Link href="https://www.patreon.com/15085349/join" target="_blank" rel="noopener noreferrer">
                    Upgrade to Pro
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  After subscribing, contact an admin to activate your features
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
