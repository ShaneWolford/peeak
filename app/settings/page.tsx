"use client"

import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Ban, Lightbulb, User, Award, Settings, Gift, Sparkles, Bell, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const settingsCategories = [
    {
      title: "Account Settings",
      description: "Change your email, username, and display name",
      icon: Settings,
      href: "/settings/account",
    },
    {
      title: "Edit Profile",
      description: "Update your profile information and appearance",
      icon: User,
      href: "/settings/profile",
    },
    {
      title: "Badge Settings",
      description: "Manage your profile badges",
      icon: Award,
      href: "/settings/badges",
    },
    {
      title: "Peeak Pro",
      description: "Upgrade to unlock exclusive features",
      icon: Sparkles,
      href: "/settings/pro",
    },
    {
      title: "Referral Program",
      description: "Invite friends and earn rewards",
      icon: Gift,
      href: "/settings/referrals",
    },
    {
      title: "Notifications",
      description: "Manage your notification preferences",
      icon: Bell,
      href: "/settings/notifications",
    },
    {
      title: "Privacy",
      description: "Control who can see your content",
      icon: Lock,
      href: "/settings/privacy",
    },
    {
      title: "Blocked Users",
      description: "Manage blocked accounts",
      icon: Ban,
      href: "/settings/blocked-users",
    },
    {
      title: "Suggest a Feature",
      description: "Share your ideas to improve Peeak",
      icon: Lightbulb,
      href: "/settings/suggest-feature",
    },
  ]

  return (
    <>
      <Navigation />
      <main className="mobile-screen md:min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 bg-background">
        <div className="mobile-content max-w-3xl mx-auto p-6 space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Settings</h1>
            <p className="text-lg text-muted-foreground">Manage your account and preferences</p>
          </div>

          <div className="grid gap-3">
            {settingsCategories.map((category) => (
              <Link key={category.href} href={category.href} className="group">
                <Card className="border hover:border-primary/50 transition-all duration-200 hover:shadow-md">
                  <CardHeader className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <category.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-semibold mb-1">{category.title}</CardTitle>
                          <CardDescription className="text-sm">{category.description}</CardDescription>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
