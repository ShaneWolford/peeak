"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  Ban,
  Shield,
  FileText,
  Sparkles,
  Bug,
  TrendingUp,
  Megaphone,
  Loader2,
  Scale,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  UserX,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UsernameAutocomplete } from "@/components/username-autocomplete"

interface AdminPanelContentProps {
  initialSettings: any[]
  initialWarnings: any[]
  initialBannedUsers: any[]
  initialAppeals: any[]
}

export function AdminPanelContent({
  initialSettings,
  initialWarnings,
  initialBannedUsers,
  initialAppeals,
}: AdminPanelContentProps) {
  const [postingEnabled, setPostingEnabled] = useState(
    initialSettings.find((s) => s.key === "posting_enabled")?.value === true,
  )
  const [isUpdating, setIsUpdating] = useState(false)
  const [warningUsername, setWarningUsername] = useState("")
  const [warningReason, setWarningReason] = useState("")
  const [warningDetails, setWarningDetails] = useState("")
  const [isIssuingWarning, setIsIssuingWarning] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [patchNoteVersion, setPatchNoteVersion] = useState("")
  const [patchNoteTitle, setPatchNoteTitle] = useState("")
  const [patchNoteDescription, setPatchNoteDescription] = useState("")
  const [patchNoteType, setPatchNoteType] = useState<"feature" | "bugfix" | "improvement" | "announcement">("feature")
  const [isCreatingPatchNote, setIsCreatingPatchNote] = useState(false)
  const [appealDialogOpen, setAppealDialogOpen] = useState(false)
  const [selectedAppeal, setSelectedAppeal] = useState<any>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [isProcessingAppeal, setIsProcessingAppeal] = useState(false)
  const [proUsername, setProUsername] = useState("")
  const [proDuration, setProDuration] = useState("")
  const [isUpgradingPro, setIsUpgradingPro] = useState(false)
  const [proUsers, setProUsers] = useState<any[]>([])
  const [isLoadingProUsers, setIsLoadingProUsers] = useState(false)

  const [shadowBanUsername, setShadowBanUsername] = useState("")
  const [shadowBanUserId, setShadowBanUserId] = useState("")
  const [isShadowBanning, setIsShadowBanning] = useState(false)
  const [shadowBannedUsers, setShadowBannedUsers] = useState<any[]>([])
  const [isLoadingShadowBanned, setIsLoadingShadowBanned] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadProUsers()
    loadShadowBannedUsers()
  }, [])

  const handleTogglePosting = async (enabled: boolean) => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "posting_enabled", value: enabled }),
      })

      if (!response.ok) throw new Error("Failed to update setting")

      setPostingEnabled(enabled)
      toast({
        title: enabled ? "Posting enabled" : "Posting disabled",
        description: enabled ? "Users can now create posts" : "Post creation has been disabled",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update posting setting",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleIssueWarning = async () => {
    if (!warningUsername || !warningReason) {
      toast({
        title: "Error",
        description: "Username and reason are required",
        variant: "destructive",
      })
      return
    }

    setIsIssuingWarning(true)
    try {
      const response = await fetch("/api/admin/warnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: warningUsername,
          reason: warningReason,
          details: warningDetails,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to issue warning")
      }

      toast({
        title: "Warning issued",
        description: `Warning has been issued to @${warningUsername}`,
      })
      setWarningUsername("")
      setWarningReason("")
      setWarningDetails("")
      setDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to issue warning",
        variant: "destructive",
      })
    } finally {
      setIsIssuingWarning(false)
    }
  }

  const handleUnbanUser = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/unban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) throw new Error("Failed to unban user")

      toast({
        title: "User unbanned",
        description: "The user has been unbanned successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive",
      })
    }
  }

  const handleCreatePatchNote = async () => {
    if (!patchNoteVersion.trim() || !patchNoteTitle.trim() || !patchNoteDescription.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsCreatingPatchNote(true)

    try {
      const response = await fetch("/api/admin/patch-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: patchNoteVersion.trim(),
          title: patchNoteTitle.trim(),
          description: patchNoteDescription.trim(),
          type: patchNoteType,
        }),
      })

      if (!response.ok) throw new Error("Failed to create patch note")

      toast({
        title: "Success",
        description: "Patch note created successfully",
      })

      setPatchNoteVersion("")
      setPatchNoteTitle("")
      setPatchNoteDescription("")
      setPatchNoteType("feature")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create patch note",
        variant: "destructive",
      })
    } finally {
      setIsCreatingPatchNote(false)
    }
  }

  const handleApproveAppeal = async (appealId: string) => {
    setIsProcessingAppeal(true)
    try {
      const response = await fetch(`/api/admin/appeals/${appealId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      })

      if (!response.ok) throw new Error("Failed to approve appeal")

      toast({
        title: "Appeal approved",
        description: "The user has been unbanned",
      })
      setAppealDialogOpen(false)
      setSelectedAppeal(null)
      setAdminNotes("")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve appeal",
        variant: "destructive",
      })
    } finally {
      setIsProcessingAppeal(false)
    }
  }

  const handleDenyAppeal = async (appealId: string) => {
    setIsProcessingAppeal(true)
    try {
      const response = await fetch(`/api/admin/appeals/${appealId}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      })

      if (!response.ok) throw new Error("Failed to deny appeal")

      toast({
        title: "Appeal denied",
        description: "The appeal has been denied",
      })
      setAppealDialogOpen(false)
      setSelectedAppeal(null)
      setAdminNotes("")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deny appeal",
        variant: "destructive",
      })
    } finally {
      setIsProcessingAppeal(false)
    }
  }

  const loadProUsers = async () => {
    setIsLoadingProUsers(true)
    try {
      const response = await fetch("/api/admin/pro/list")
      if (response.ok) {
        const data = await response.json()
        setProUsers(data.proUsers || [])
      }
    } catch (error) {
      console.error("Error loading pro users:", error)
    } finally {
      setIsLoadingProUsers(false)
    }
  }

  const loadShadowBannedUsers = async () => {
    setIsLoadingShadowBanned(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, is_shadow_banned")
        .eq("is_shadow_banned", true)
        .order("username")

      if (!error && data) {
        setShadowBannedUsers(data)
      }
    } catch (error) {
      console.error("Error loading shadow banned users:", error)
    } finally {
      setIsLoadingShadowBanned(false)
    }
  }

  const handleShadowBan = async () => {
    if (!shadowBanUserId) {
      toast({
        title: "Error",
        description: "Please select a user",
        variant: "destructive",
      })
      return
    }

    setIsShadowBanning(true)
    try {
      const response = await fetch("/api/admin/shadow-ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: shadowBanUserId }),
      })

      if (!response.ok) throw new Error("Failed to shadow ban user")

      toast({
        title: "User shadow banned",
        description: `@${shadowBanUsername} has been shadow banned. Their content is now hidden from other users.`,
      })

      setShadowBanUsername("")
      setShadowBanUserId("")
      await loadShadowBannedUsers()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to shadow ban user",
        variant: "destructive",
      })
    } finally {
      setIsShadowBanning(false)
    }
  }

  const handleRemoveShadowBan = async (userId: string, username: string) => {
    try {
      const response = await fetch("/api/admin/shadow-ban/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) throw new Error("Failed to remove shadow ban")

      toast({
        title: "Shadow ban removed",
        description: `@${username} is no longer shadow banned`,
      })

      await loadShadowBannedUsers()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove shadow ban",
        variant: "destructive",
      })
    }
  }

  const handleUpgradeToPro = async () => {
    if (!proUsername.trim()) {
      toast({
        title: "Error",
        description: "Username is required",
        variant: "destructive",
      })
      return
    }

    setIsUpgradingPro(true)
    try {
      console.log("[v0] Starting Pro upgrade for:", proUsername)

      const supabase = createClient()
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, is_pro")
        .eq("username", proUsername.trim())
        .single()

      console.log("[v0] Profile lookup result:", { profile, profileError })

      if (profileError || !profile) {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive",
        })
        setIsUpgradingPro(false)
        return
      }

      if (profile.is_pro) {
        toast({
          title: "Info",
          description: "User is already a Pro member",
        })
        setIsUpgradingPro(false)
        return
      }

      console.log("[v0] Calling upgrade API with userId:", profile.id)

      const response = await fetch("/api/admin/pro/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          duration: proDuration ? Number.parseInt(proDuration) : null,
        }),
      })

      const responseData = await response.json()
      console.log("[v0] Upgrade API response:", { status: response.status, data: responseData })

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to upgrade user")
      }

      toast({
        title: "Success",
        description: `@${proUsername} has been upgraded to Pro`,
      })

      setProUsername("")
      setProDuration("")
      await loadProUsers()
      router.refresh()
    } catch (error) {
      console.error("[v0] Error upgrading to Pro:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upgrade user to Pro",
        variant: "destructive",
      })
    } finally {
      setIsUpgradingPro(false)
    }
  }

  const handleDowngradeFromPro = async (userId: string, username: string) => {
    try {
      const response = await fetch("/api/admin/pro/downgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) throw new Error("Failed to downgrade user")

      toast({
        title: "Success",
        description: `@${username} has been downgraded from Pro`,
      })

      loadProUsers()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to downgrade user from Pro",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 gap-2">
          <TabsTrigger value="settings" className="text-xs sm:text-sm">
            Settings
          </TabsTrigger>
          {/* New Moderation tab */}
          <TabsTrigger value="moderation" className="text-xs sm:text-sm">
            Moderation
          </TabsTrigger>
          <TabsTrigger value="warnings" className="text-xs sm:text-sm">
            Warnings
          </TabsTrigger>
          <TabsTrigger value="banned" className="text-xs sm:text-sm">
            Banned
          </TabsTrigger>
          <TabsTrigger value="appeals" className="text-xs sm:text-sm">
            Appeals
          </TabsTrigger>
          <TabsTrigger value="patch-notes" className="text-xs sm:text-sm">
            Updates
          </TabsTrigger>
          <TabsTrigger value="pro" className="text-xs sm:text-sm">
            Pro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {/* Site Settings */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="h-5 w-5 text-primary" />
                Site Settings
              </CardTitle>
              <CardDescription>Control global site functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <Label htmlFor="posting-toggle" className="text-base font-medium">
                    Post Creation
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {postingEnabled ? "Users can create posts" : "Post creation is disabled"}
                  </p>
                </div>
                <Switch
                  id="posting-toggle"
                  checked={postingEnabled}
                  onCheckedChange={handleTogglePosting}
                  disabled={isUpdating}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <EyeOff className="h-5 w-5 text-primary" />
                Shadow Ban System
              </CardTitle>
              <CardDescription>
                Shadow banned users can post, but their content is hidden from other users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Shadow Ban Form */}
              <div className="space-y-4 p-4 border-2 border-dashed rounded-lg">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <UserX className="h-4 w-4" />
                  Shadow Ban User
                </h3>
                <div>
                  <Label htmlFor="shadow-ban-username">Username</Label>
                  <UsernameAutocomplete
                    value={shadowBanUsername}
                    onChange={setShadowBanUsername}
                    onSelect={(username, userId) => {
                      setShadowBanUsername(username)
                      setShadowBanUserId(userId)
                    }}
                    placeholder="Search and select user..."
                    className="mt-2"
                  />
                </div>
                <Button
                  onClick={handleShadowBan}
                  disabled={isShadowBanning || !shadowBanUserId}
                  variant="destructive"
                  className="w-full"
                >
                  {isShadowBanning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Shadow Banning...
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Shadow Ban User
                    </>
                  )}
                </Button>
              </div>

              {/* Shadow Banned Users List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base">Shadow Banned Users</h3>
                  <Button variant="outline" size="sm" onClick={loadShadowBannedUsers} disabled={isLoadingShadowBanned}>
                    {isLoadingShadowBanned ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                  </Button>
                </div>

                {shadowBannedUsers.length === 0 ? (
                  <div className="text-center p-8 border-2 border-dashed rounded-lg">
                    <EyeOff className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No shadow banned users</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {shadowBannedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border-2 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2">
                            <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">@{user.username}</p>
                              <Badge variant="outline" className="text-xs">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Shadow Banned
                              </Badge>
                            </div>
                            {user.display_name && <p className="text-sm text-muted-foreground">{user.display_name}</p>}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveShadowBan(user.id, user.username)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warnings" className="space-y-6">
          {/* Warning System */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertCircle className="h-5 w-5 text-primary" />
                Warning System
              </CardTitle>
              <CardDescription>Issue warnings to users (3 warnings = 24-hour ban)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Issue Warning
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Issue User Warning</DialogTitle>
                    <DialogDescription>
                      Issue a warning to a user. Users with 3 warnings will be automatically banned for 24 hours.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <UsernameAutocomplete
                        value={warningUsername}
                        onChange={setWarningUsername}
                        placeholder="Search and select user..."
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reason">Reason</Label>
                      <Input
                        id="reason"
                        placeholder="e.g., Spam, Harassment, Inappropriate content"
                        value={warningReason}
                        onChange={(e) => setWarningReason(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="details">Details (Optional)</Label>
                      <Textarea
                        id="details"
                        placeholder="Additional details about the warning"
                        value={warningDetails}
                        onChange={(e) => setWarningDetails(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleIssueWarning} disabled={isIssuingWarning} className="w-full">
                      {isIssuingWarning ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Issuing...
                        </>
                      ) : (
                        "Issue Warning"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Recent Warnings */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Recent Warnings</h3>
                {initialWarnings.length === 0 ? (
                  <div className="text-center p-8 border-2 border-dashed rounded-lg">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No warnings issued yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {initialWarnings.map((warning: any) => (
                      <div key={warning.id} className="flex items-start gap-3 p-4 border-2 rounded-lg bg-muted/30">
                        <Avatar className="h-10 w-10 border-2">
                          <AvatarImage src={warning.user?.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{warning.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">@{warning.user?.username}</span>
                            <Badge variant="destructive" className="text-xs">
                              Warning
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground">{warning.reason}</p>
                          {warning.details && <p className="text-xs text-muted-foreground mt-1">{warning.details}</p>}
                          <p className="text-xs text-muted-foreground mt-2">
                            By @{warning.issuer?.username} • {new Date(warning.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banned" className="space-y-6">
          {/* Banned Users */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Ban className="h-5 w-5 text-primary" />
                Banned Users
              </CardTitle>
              <CardDescription>Users currently banned from the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {initialBannedUsers.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <Ban className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No users are currently banned</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {initialBannedUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border-2 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2">
                          <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">@{user.username}</p>
                          <p className="text-xs text-muted-foreground">
                            Ban expires: {new Date(user.ban_expires_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleUnbanUser(user.id)}>
                        Unban
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appeals" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Scale className="h-5 w-5 text-primary" />
                Ban Appeals
              </CardTitle>
              <CardDescription>Review and manage user ban appeals</CardDescription>
            </CardHeader>
            <CardContent>
              {initialAppeals.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <Scale className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No appeals to review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {initialAppeals.map((appeal: any) => (
                    <div key={appeal.id} className="border-2 rounded-lg p-4 space-y-3 bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2">
                            <AvatarImage src={appeal.user?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>{appeal.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">@{appeal.user?.username}</p>
                            <p className="text-xs text-muted-foreground">
                              Submitted {new Date(appeal.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            appeal.status === "pending"
                              ? "secondary"
                              : appeal.status === "approved"
                                ? "default"
                                : "destructive"
                          }
                        >
                          {appeal.status}
                        </Badge>
                      </div>

                      {appeal.user?.ban_expires_at && (
                        <div className="text-sm text-muted-foreground">
                          Ban expires: {new Date(appeal.user.ban_expires_at).toLocaleString()}
                        </div>
                      )}

                      <div className="bg-background p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Appeal Reason:</p>
                        <p className="text-sm text-muted-foreground">{appeal.reason}</p>
                      </div>

                      {appeal.admin_notes && (
                        <div className="bg-background p-3 rounded-md">
                          <p className="text-sm font-medium mb-1">Admin Notes:</p>
                          <p className="text-sm text-muted-foreground">{appeal.admin_notes}</p>
                        </div>
                      )}

                      {appeal.status === "pending" && (
                        <div className="flex gap-2">
                          <Dialog
                            open={appealDialogOpen && selectedAppeal?.id === appeal.id}
                            onOpenChange={(open) => {
                              setAppealDialogOpen(open)
                              if (!open) {
                                setSelectedAppeal(null)
                                setAdminNotes("")
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => setSelectedAppeal(appeal)}
                                className="flex-1"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Appeal</DialogTitle>
                                <DialogDescription>
                                  This will unban @{appeal.user?.username} and mark the appeal as approved.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                                  <Textarea
                                    id="admin-notes"
                                    placeholder="Add any notes about this decision..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleApproveAppeal(appeal.id)}
                                    disabled={isProcessingAppeal}
                                    className="flex-1"
                                  >
                                    {isProcessingAppeal ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Processing...
                                      </>
                                    ) : (
                                      "Confirm Approval"
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setAppealDialogOpen(false)
                                      setSelectedAppeal(null)
                                      setAdminNotes("")
                                    }}
                                    disabled={isProcessingAppeal}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog
                            open={
                              appealDialogOpen && selectedAppeal?.id === appeal.id && selectedAppeal?.action === "deny"
                            }
                            onOpenChange={(open) => {
                              setAppealDialogOpen(open)
                              if (!open) {
                                setSelectedAppeal(null)
                                setAdminNotes("")
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setSelectedAppeal({ ...appeal, action: "deny" })}
                                className="flex-1"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Deny
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Deny Appeal</DialogTitle>
                                <DialogDescription>
                                  This will deny the appeal from @{appeal.user?.username}. The user will remain banned.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="deny-notes">Admin Notes (Optional)</Label>
                                  <Textarea
                                    id="deny-notes"
                                    placeholder="Explain why the appeal was denied..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDenyAppeal(appeal.id)}
                                    disabled={isProcessingAppeal}
                                    className="flex-1"
                                  >
                                    {isProcessingAppeal ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Processing...
                                      </>
                                    ) : (
                                      "Confirm Denial"
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setAppealDialogOpen(false)
                                      setSelectedAppeal(null)
                                      setAdminNotes("")
                                    }}
                                    disabled={isProcessingAppeal}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patch-notes" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-primary" />
                Create Patch Note
              </CardTitle>
              <CardDescription>Add a new update to inform users about changes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    placeholder="1.0.0"
                    value={patchNoteVersion}
                    onChange={(e) => setPatchNoteVersion(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={patchNoteType} onValueChange={(value: any) => setPatchNoteType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feature">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          New Feature
                        </div>
                      </SelectItem>
                      <SelectItem value="bugfix">
                        <div className="flex items-center gap-2">
                          <Bug className="h-4 w-4" />
                          Bug Fix
                        </div>
                      </SelectItem>
                      <SelectItem value="improvement">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Improvement
                        </div>
                      </SelectItem>
                      <SelectItem value="announcement">
                        <div className="flex items-center gap-2">
                          <Megaphone className="h-4 w-4" />
                          Announcement
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="What's new in this update?"
                  value={patchNoteTitle}
                  onChange={(e) => setPatchNoteTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the changes in detail..."
                  value={patchNoteDescription}
                  onChange={(e) => setPatchNoteDescription(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <Button onClick={handleCreatePatchNote} disabled={isCreatingPatchNote} className="w-full">
                {isCreatingPatchNote ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Patch Note"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pro" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-primary" />
                Pro Member Management
              </CardTitle>
              <CardDescription>Upgrade users to Pro or manage existing Pro members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upgrade Form */}
              <div className="space-y-4 p-4 border-2 border-dashed rounded-lg">
                <h3 className="font-semibold text-base">Upgrade User to Pro</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pro-username">Username</Label>
                    <UsernameAutocomplete
                      value={proUsername}
                      onChange={setProUsername}
                      placeholder="Search and select user..."
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pro-duration">Duration (days, optional)</Label>
                    <Input
                      id="pro-duration"
                      type="number"
                      placeholder="Leave empty for permanent"
                      value={proDuration}
                      onChange={(e) => setProDuration(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
                <Button onClick={handleUpgradeToPro} disabled={isUpgradingPro} className="w-full">
                  {isUpgradingPro ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Upgrading...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Upgrade to Pro
                    </>
                  )}
                </Button>
              </div>

              {/* Pro Users List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base">Current Pro Members</h3>
                  <Button variant="outline" size="sm" onClick={loadProUsers} disabled={isLoadingProUsers}>
                    {isLoadingProUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                  </Button>
                </div>

                {proUsers.length === 0 ? (
                  <div className="text-center p-8 border-2 border-dashed rounded-lg">
                    <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No Pro members yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {proUsers.map((user: any) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border-2 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2">
                            <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">@{user.username}</p>
                              <Badge variant="secondary" className="text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Pro
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {user.pro_expires_at
                                ? `Expires: ${new Date(user.pro_expires_at).toLocaleDateString()}`
                                : "Permanent"}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDowngradeFromPro(user.id, user.username)}
                        >
                          Remove Pro
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
