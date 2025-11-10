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
import { ArrowLeft, Lightbulb, ThumbsUp, CheckCircle, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

interface FeatureSuggestion {
  id: string
  title: string
  description: string
  category: string
  status: string
  votes: number
  voteCount: number
  hasVoted: boolean
  created_at: string
  completed_at: string | null
  user_id: string
  profiles: {
    username: string
    display_name: string
    avatar_url: string
  }
}

export default function SuggestFeaturePage() {
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suggestions, setSuggestions] = useState<FeatureSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [suggestionToDelete, setSuggestionToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadSuggestions()
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

  const loadSuggestions = async () => {
    try {
      const response = await fetch("/api/feature-suggestions")
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data)
      }
    } catch (error) {
      console.error("Error loading suggestions:", error)
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
      const response = await fetch("/api/feature-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category }),
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Your feature suggestion has been submitted",
        })
        setTitle("")
        setDescription("")
        setCategory("")
        loadSuggestions()
      } else {
        throw new Error("Failed to submit")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feature suggestion",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = async (suggestionId: string) => {
    try {
      const response = await fetch(`/api/feature-suggestions/${suggestionId}/vote`, {
        method: "POST",
      })

      if (response.ok) {
        loadSuggestions()
      }
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "Failed to vote",
        variant: "destructive",
      })
    }
  }

  const handleApprove = async (suggestionId: string) => {
    try {
      const response = await fetch(`/api/feature-suggestions/${suggestionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Feature approved. It will be deleted in 24 hours.",
        })
        loadSuggestions()
      } else {
        throw new Error("Failed to update")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve suggestion",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (suggestionId: string) => {
    setSuggestionToDelete(suggestionId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!suggestionToDelete) return

    try {
      const response = await fetch(`/api/feature-suggestions/${suggestionToDelete}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Feature suggestion deleted",
        })
        loadSuggestions()
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feature suggestion",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setSuggestionToDelete(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500"
      case "approved":
        return "bg-green-500/10 text-green-500"
      case "in-progress":
        return "bg-blue-500/10 text-blue-500"
      case "completed":
        return "bg-purple-500/10 text-purple-500"
      case "rejected":
        return "bg-red-500/10 text-red-500"
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
              <h1 className="text-3xl font-bold mb-2">Suggest a Feature</h1>
              <p className="text-muted-foreground">Help us improve by sharing your ideas</p>
            </div>
          </div>

          {/* Submit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Submit Your Idea
              </CardTitle>
              <CardDescription>Tell us about the feature you'd like to see</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Feature Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Dark mode for messages"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ui-ux">UI/UX</SelectItem>
                      <SelectItem value="messaging">Messaging</SelectItem>
                      <SelectItem value="posts">Posts & Feed</SelectItem>
                      <SelectItem value="profile">Profile</SelectItem>
                      <SelectItem value="notifications">Notifications</SelectItem>
                      <SelectItem value="privacy">Privacy & Security</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your feature idea in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">{description.length}/1000 characters</p>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Submitting..." : "Submit Feature Suggestion"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Suggestions */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Community Suggestions</h2>
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">Loading suggestions...</CardContent>
              </Card>
            ) : suggestions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No suggestions yet. Be the first to suggest a feature!
                </CardContent>
              </Card>
            ) : (
              suggestions.map((suggestion) => (
                <Card key={suggestion.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                          <Badge className={getStatusColor(suggestion.status)}>{suggestion.status}</Badge>
                          {suggestion.completed_at && (
                            <Badge variant="outline" className="text-xs">
                              Deletes in{" "}
                              {Math.max(
                                0,
                                24 -
                                  Math.floor(
                                    (Date.now() - new Date(suggestion.completed_at).getTime()) / (1000 * 60 * 60),
                                  ),
                              )}
                              h
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{suggestion.description}</CardDescription>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={suggestion.profiles.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>{suggestion.profiles.username[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span>{suggestion.profiles.display_name || suggestion.profiles.username}</span>
                          </div>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.category}
                          </Badge>
                          <span>•</span>
                          <span>{new Date(suggestion.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={suggestion.hasVoted ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleVote(suggestion.id)}
                          className="flex items-center gap-2"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span>{suggestion.voteCount}</span>
                        </Button>
                        {isAdmin && suggestion.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(suggestion.id)}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </Button>
                        )}
                        {(isAdmin || suggestion.user_id === currentUserId) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(suggestion.id)}
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
            <AlertDialogTitle>Delete feature suggestion?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the feature suggestion.
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
