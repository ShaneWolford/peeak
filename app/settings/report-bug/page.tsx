"use client"

import type React from "react"
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
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Bug, CheckCircle, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

interface BugReport {
  id: string
  title: string
  description: string
  category: string
  severity: string
  status: string
  created_at: string
  completed_at: string | null
  user_id: string
  profiles: {
    username: string
    display_name: string
    avatar_url: string
  }
}

export default function ReportBugPage() {
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [severity, setSeverity] = useState("medium")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reports, setReports] = useState<BugReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadReports()
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setIsAdmin(user?.email === "shaneswolfords@gmail.com")
    setCurrentUserId(user?.id || null)
  }

  const loadReports = async () => {
    try {
      const response = await fetch("/api/bug-reports")
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (error) {
      console.error("Error loading bug reports:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim() || !category) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, severity }),
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Your bug report has been submitted",
        })
        setTitle("")
        setDescription("")
        setCategory("")
        setSeverity("medium")
        loadReports()
      } else {
        throw new Error("Failed to submit")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit bug report",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkAsFixed = async (reportId: string) => {
    try {
      const response = await fetch(`/api/bug-reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Bug marked as fixed. It will be deleted in 24 hours.",
        })
        loadReports()
      } else {
        throw new Error("Failed to update")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bug report",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (reportId: string) => {
    setReportToDelete(reportId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!reportToDelete) return

    try {
      const response = await fetch(`/api/bug-reports/${reportToDelete}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Bug report deleted",
        })
        loadReports()
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bug report",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setReportToDelete(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500"
      case "investigating":
        return "bg-blue-500/10 text-blue-500"
      case "in-progress":
        return "bg-purple-500/10 text-purple-500"
      case "resolved":
        return "bg-green-500/10 text-green-500"
      case "closed":
        return "bg-gray-500/10 text-gray-500"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-500"
      case "high":
        return "bg-orange-500/10 text-orange-500"
      case "medium":
        return "bg-yellow-500/10 text-yellow-500"
      case "low":
        return "bg-green-500/10 text-green-500"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 bg-background">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold mb-2">Report a Bug</h1>
              <p className="text-muted-foreground">Help us fix issues by reporting bugs</p>
            </div>
          </div>

          {/* Submit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Report an Issue
              </CardTitle>
              <CardDescription>Describe the bug you encountered</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Bug Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Messages not loading on mobile"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ui-ux">UI/UX</SelectItem>
                        <SelectItem value="messaging">Messaging</SelectItem>
                        <SelectItem value="posts">Posts & Feed</SelectItem>
                        <SelectItem value="profile">Profile</SelectItem>
                        <SelectItem value="notifications">Notifications</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity</Label>
                    <Select value={severity} onValueChange={setSeverity}>
                      <SelectTrigger id="severity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the bug, steps to reproduce, and expected behavior..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">{description.length}/1000 characters</p>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Submitting..." : "Submit Bug Report"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Reports */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Recent Bug Reports</h2>
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">Loading reports...</CardContent>
              </Card>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No bug reports yet. Report any issues you find!
                </CardContent>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">{report.title}</CardTitle>
                          <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                          <Badge className={getSeverityColor(report.severity)}>{report.severity}</Badge>
                          {report.completed_at && (
                            <Badge variant="outline" className="text-xs">
                              Deletes in{" "}
                              {Math.max(
                                0,
                                24 -
                                  Math.floor((Date.now() - new Date(report.completed_at).getTime()) / (1000 * 60 * 60)),
                              )}
                              h
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{report.description}</CardDescription>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={report.profiles.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>{report.profiles.username[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{report.profiles.display_name || report.profiles.username}</span>
                          </div>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {report.category}
                          </Badge>
                          <span>•</span>
                          <span>{new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && report.status !== "resolved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsFixed(report.id)}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Mark as Fixed
                          </Button>
                        )}
                        {(isAdmin || report.user_id === currentUserId) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(report.id)}
                            className="flex items-center gap-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
      <MobileBottomNav />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bug report?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the bug report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
