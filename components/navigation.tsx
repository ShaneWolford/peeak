"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { HomeIcon } from "./icons/home-icon"
import { SearchIcon } from "./icons/search-icon"
import { MessagesIcon } from "./icons/messages-icon"
import { NotificationIcon } from "./icons/notification-icon"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { useEffect, useState } from "react"
import { Settings, LogOut, Moon, Sun } from "lucide-react"
import Image from "next/image"
import type { Profile } from "@/lib/types"
import { LiveNotifications } from "./live-notifications"
import { Video } from "./icons/video-icon"
import { LiveMessageNotifications } from "./live-message-notifications"
import { useTheme } from "next-themes"

let userCache: { user: any; profile: Profile | null; timestamp: number } | null = null
const CACHE_DURATION = 60000

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      try {
        const now = Date.now()
        if (userCache && now - userCache.timestamp < CACHE_DURATION) {
          setUser(userCache.user)
          setProfile(userCache.profile)
          return
        }

        const supabase = createClient()
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          // Ignore session missing errors on initial load
          if (authError.message?.includes("Auth session missing")) {
            return
          }

          if (authError.message?.includes("Too Many Requests") || authError.status === 429) {
            if (userCache) {
              setUser(userCache.user)
              setProfile(userCache.profile)
            }
            return
          }

          // Only log unexpected errors
          if (!authError.message?.includes("session")) {
            console.error("Auth error:", authError.message)
          }
          return
        }

        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()

          if (profileError) {
            console.error("Profile fetch error:", profileError.message)
            setUser(user)
            userCache = { user, profile: null, timestamp: now }
            return
          }

          const userData = { ...user, ...profileData }
          setUser(userData)
          setProfile(profileData)

          userCache = { user: userData, profile: profileData, timestamp: now }
        }
      } catch (error: any) {
        if (error?.message?.includes("is not valid JSON")) {
          if (userCache) {
            setUser(userCache.user)
            setProfile(userCache.profile)
          }
          return
        }
        // Only log unexpected errors
        if (!error?.message?.includes("session")) {
          console.error("Navigation user fetch error:", error?.message || error)
        }
      }
    }
    getUser()
  }, [])

  const toggleDarkMode = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    userCache = null
    router.push("/auth/login")
  }

  const navItems = [
    { href: "/feed", icon: HomeIcon, label: "Your Feed" },
    { href: "/search", icon: SearchIcon, label: "Search" },
    { href: "/messages", icon: MessagesIcon, label: "Messages" },
    { href: "/peaks", icon: Video, label: "Peaks" },
  ]

  const isDark = mounted ? resolvedTheme === "dark" : false

  return (
    <>
      <LiveMessageNotifications />

      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 border-r border-border bg-background flex-col z-50">
        <div className="p-6 pb-8">
          <div className="flex items-center gap-2">
            <Link href="/feed" className="block hover:opacity-70 transition-opacity">
              <div className="flex items-center gap-2">
                <Image
                  src={isDark ? "/logo-dark.png" : "/logo-light.png"}
                  alt="peeeak"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
                <span className="px-2 py-0.5 text-xs font-medium bg-foreground text-background rounded">Beta</span>
              </div>
            </Link>
            <div className="ml-auto">
              <LiveNotifications compact />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2 px-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg text-base transition-colors ${
                  isActive ? "font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-6 w-6" />
                <span>{item.label}</span>
              </Link>
            )
          })}

          {user && (
            <Link
              href={`/profile/${user.username}`}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg text-base transition-colors ${
                pathname === `/profile/${user.username}`
                  ? "font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.username} />
                <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>User Profile</span>
            </Link>
          )}
        </div>

        <div className="border-t border-border p-4 space-y-2">
          <Link
            href="/settings"
            className="flex items-center gap-4 px-4 py-3 rounded-lg text-base text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Settings className="h-6 w-6" />
            <span>Settings</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-base text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <LogOut className="h-6 w-6" />
            <span>Log out</span>
          </button>

          <div className="flex items-center justify-end pt-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full border border-border hover:bg-muted/50 transition-colors"
              aria-label="Toggle dark mode"
            >
              {mounted && isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/feed" className="block">
            <div className="flex items-center gap-2">
              <Image
                src={isDark ? "/logo-dark.png" : "/logo-light.png"}
                alt="peeeak"
                width={90}
                height={30}
                className="h-6 w-auto"
                priority
              />
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-foreground text-background rounded">Beta</span>
            </div>
          </Link>
          <LiveNotifications compact />
        </div>
      </nav>
    </>
  )
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false)

      setUnreadCount(count || 0)
    }

    fetchUnreadCount()

    const setupRealtimeSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const channel = supabase
        .channel("mobile-notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            setUnreadCount((prev) => prev + 1)
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchUnreadCount()
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    setupRealtimeSubscription()
  }, [])

  useEffect(() => {
    if (pathname === "/notifications") {
      setUnreadCount(0)
    }
  }, [pathname])

  const navItems = [
    { href: "/feed", icon: HomeIcon, label: "Home" },
    { href: "/search", icon: SearchIcon, label: "Search" },
    { href: "/notifications", icon: NotificationIcon, label: "Notifications", badge: unreadCount },
    { href: "/messages", icon: MessagesIcon, label: "Messages" },
    { href: "/peaks", icon: Video, label: "Peaks" },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href === "/messages" && pathname.startsWith("/messages"))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center flex-1 h-full relative transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? "fill-current" : ""}`} />
              {item.badge && item.badge > 0 && (
                <span className="absolute top-2 right-1/4 h-4 min-w-[16px] px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
              <span className="sr-only">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
