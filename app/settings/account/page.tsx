"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, ArrowLeft, Mail, AtSign, User, AlertCircle, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

export default function AccountSettingsPage() {
  const [email, setEmail] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [username, setUsername] = useState("")
  const [newUsername, setNewUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [newDisplayName, setNewDisplayName] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [userId, setUserId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [isSavingUsername, setIsSavingUsername] = useState(false)
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadAccountData()
  }, [])

  const loadAccountData = async () => {
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
      setEmail(user.email || "")
      setNewEmail(user.email || "")

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", user.id)
        .single()

      if (profile) {
        setUsername(profile.username)
        setNewUsername(profile.username)
        setDisplayName(profile.display_name || "")
        setNewDisplayName(profile.display_name || "")
      }
    } catch (err) {
      console.error("Error loading account data:", err)
      toast({
        title: "Error",
        description: "Failed to load account data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newEmail === email) {
      toast({
        title: "No changes",
        description: "Email is the same as current email.",
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    setIsSavingEmail(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { error } = await supabase.auth.updateUser({ email: newEmail })

      if (error) throw error

      toast({
        title: "Confirmation emails sent",
        description:
          "Please check both your current and new email addresses for confirmation links. Your email will change after you confirm both.",
      })
      // Reset the input to show current email since change isn't complete yet
      setNewEmail(email)
    } catch (err) {
      console.error("Error updating email:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update email.",
        variant: "destructive",
      })
      setNewEmail(email)
    } finally {
      setIsSavingEmail(false)
    }
  }

  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newUsername === username) {
      toast({
        title: "No changes",
        description: "Username is the same as current username.",
      })
      return
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(newUsername)) {
      toast({
        title: "Invalid username",
        description: "Username must be 3-20 characters and contain only letters, numbers, and underscores.",
        variant: "destructive",
      })
      return
    }

    setIsSavingUsername(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      // Check if username is already taken
      const { data: existingUser } = await supabase.from("profiles").select("id").eq("username", newUsername).single()

      if (existingUser) {
        toast({
          title: "Username taken",
          description: "This username is already in use. Please choose another.",
          variant: "destructive",
        })
        return
      }

      // Update username
      const { error } = await supabase
        .from("profiles")
        .update({ username: newUsername, updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (error) throw error

      toast({
        title: "Username updated",
        description: "Your username has been successfully changed.",
      })
      setUsername(newUsername)
    } catch (err) {
      console.error("Error updating username:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update username.",
        variant: "destructive",
      })
    } finally {
      setIsSavingUsername(false)
    }
  }

  const handleDisplayNameChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newDisplayName === displayName) {
      toast({
        title: "No changes",
        description: "Display name is the same as current display name.",
      })
      return
    }

    if (!newDisplayName.trim()) {
      toast({
        title: "Invalid display name",
        description: "Display name cannot be empty.",
        variant: "destructive",
      })
      return
    }

    setIsSavingDisplayName(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { error } = await supabase
        .from("profiles")
        .update({ display_name: newDisplayName.trim(), updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (error) throw error

      toast({
        title: "Display name updated",
        description: "Your display name has been successfully changed.",
      })
      setDisplayName(newDisplayName)
    } catch (err) {
      console.error("Error updating display name:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update display name.",
        variant: "destructive",
      })
    } finally {
      setIsSavingDisplayName(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate password length
    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      })
      return
    }

    setIsSavingPassword(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) throw error

      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      })

      // Clear password fields
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      console.error("Error updating password:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update password.",
        variant: "destructive",
      })
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate account deletion")
      }

      toast({
        title: "Confirmation email sent",
        description: "Please check your email and click the confirmation link to permanently delete your account.",
      })
      setDeleteDialogOpen(false)
    } catch (err) {
      console.error("Error initiating account deletion:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to initiate account deletion.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
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
          <Button variant="ghost" size="sm" onClick={() => router.push("/settings")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
            <p className="text-muted-foreground">Manage your account information</p>
          </div>

          {/* Email Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Address
              </CardTitle>
              <CardDescription>Change your email address</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You'll receive confirmation emails at both your old and new email addresses.
                </AlertDescription>
              </Alert>
              <form onSubmit={handleEmailChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentEmail">Current Email</Label>
                  <Input id="currentEmail" type="email" value={email} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newEmail">New Email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new@example.com"
                    required
                  />
                </div>
                <Button type="submit" disabled={isSavingEmail || newEmail === email}>
                  {isSavingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...
                    </>
                  ) : (
                    "Update Email"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Username Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AtSign className="h-5 w-5" />
                Username
              </CardTitle>
              <CardDescription>Change your unique username</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Username must be 3-20 characters and contain only letters, numbers, and underscores.
                </AlertDescription>
              </Alert>
              <form onSubmit={handleUsernameChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentUsername">Current Username</Label>
                  <Input id="currentUsername" type="text" value={username} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newUsername">New Username</Label>
                  <Input
                    id="newUsername"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                    placeholder="new_username"
                    required
                    pattern="[a-zA-Z0-9_]{3,20}"
                  />
                </div>
                <Button type="submit" disabled={isSavingUsername || newUsername === username}>
                  {isSavingUsername ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...
                    </>
                  ) : (
                    "Update Username"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Display Name Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Display Name
              </CardTitle>
              <CardDescription>Change your public display name</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDisplayNameChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentDisplayName">Current Display Name</Label>
                  <Input id="currentDisplayName" type="text" value={displayName} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newDisplayName">New Display Name</Label>
                  <Input
                    id="newDisplayName"
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="Your Name"
                    required
                  />
                </div>
                <Button type="submit" disabled={isSavingDisplayName || newDisplayName === displayName}>
                  {isSavingDisplayName ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...
                    </>
                  ) : (
                    "Update Display Name"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password
              </CardTitle>
              <CardDescription>Change your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Password must be at least 8 characters long. Use a strong, unique password.
                </AlertDescription>
              </Alert>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                  />
                </div>
                <Button type="submit" disabled={isSavingPassword || !newPassword || !confirmPassword}>
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Lock className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription>Permanently delete your account and all associated data</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This action cannot be undone. All your posts, comments, messages, and other data will be permanently
                  deleted.
                </AlertDescription>
              </Alert>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                Delete My Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <MobileBottomNav />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This action cannot be undone. This will permanently delete your account and remove all your data from
                our servers, including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All your posts and comments</li>
                <li>All your messages and conversations</li>
                <li>All your likes, bookmarks, and follows</li>
                <li>Your profile information and settings</li>
                <li>All other associated data</li>
              </ul>
              <p className="font-semibold pt-2">
                We'll send you a confirmation email. You must click the link in that email to complete the deletion.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending email...
                </>
              ) : (
                "Yes, delete my account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
