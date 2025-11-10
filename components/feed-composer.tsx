"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, X, BarChart3 } from "lucide-react"
import { MediaUpload } from "@/components/media-upload"
import { EmojiPicker } from "@/components/emoji-picker"
import { GifPicker } from "@/components/gif-picker"
import type { Profile } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { GuidelinesDialog } from "@/components/guidelines-dialog"
import { PollCreator, type PollData } from "@/components/poll-creator"

interface FeedComposerProps {
  profile: Profile
}

export function FeedComposer({ profile }: FeedComposerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [content, setContent] = useState("")
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [mediaTypes, setMediaTypes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [postingEnabled, setPostingEnabled] = useState(true)
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false)
  const [showGuidelinesDialog, setShowGuidelinesDialog] = useState(false)
  const [hasAcceptedGuidelines, setHasAcceptedGuidelines] = useState(false)
  const [showPollCreator, setShowPollCreator] = useState(false)
  const [pollData, setPollData] = useState<PollData | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkGuidelinesAcceptance = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("profiles").select("accepted_guidelines").eq("id", user.id).single()
        if (data) {
          setHasAcceptedGuidelines(data.accepted_guidelines !== false)
        } else {
          setHasAcceptedGuidelines(true)
        }
      }
    }
    checkGuidelinesAcceptance()
  }, [])

  useEffect(() => {
    const checkPostingStatus = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("site_settings").select("value").eq("key", "posting_enabled").single()
      if (data) {
        setPostingEnabled(data.value === true || data.value?.enabled === true)
      } else {
        setPostingEnabled(true)
      }
    }
    checkPostingStatus()
  }, [])

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.substring(0, start) + emoji + content.substring(end)
    setContent(newContent)

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length
      textarea.focus()
    }, 0)
  }

  const handleGifSelect = (gifUrl: string) => {
    const newMediaUrls = [...mediaUrls, gifUrl]
    const newMediaTypes = [...mediaTypes, "gif"]
    setMediaUrls(newMediaUrls)
    setMediaTypes(newMediaTypes)
  }

  const handleAcceptGuidelines = async () => {
    try {
      const response = await fetch("/api/guidelines/accept", {
        method: "POST",
      })

      if (!response.ok) throw new Error("Failed to accept guidelines")

      setHasAcceptedGuidelines(true)
      setShowGuidelinesDialog(false)
      toast({
        title: "Guidelines accepted",
        description: "You can now create posts on Peeak",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept guidelines. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (hasAcceptedGuidelines === false) {
      setShowGuidelinesDialog(true)
      return
    }

    if (!postingEnabled) {
      toast({
        title: "Posting disabled",
        description: "Post creation is currently disabled by administrators",
        variant: "destructive",
      })
      return
    }

    if (!content.trim() && mediaUrls.length === 0 && !pollData) {
      setError("Post must have content, media, or a poll")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in to create a post")
      }

      console.log("[v0] Creating post for user:", user.id)

      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("is_banned, ban_expires_at")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("[v0] Profile fetch error:", profileError)
      }

      if (userProfile?.is_banned) {
        const banExpires = userProfile.ban_expires_at ? new Date(userProfile.ban_expires_at) : null
        const isBanExpired = banExpires && banExpires < new Date()

        if (!isBanExpired) {
          const banExpiresString = banExpires ? banExpires.toLocaleString() : "indefinitely"
          throw new Error(`You are banned from posting until ${banExpiresString}`)
        } else {
          console.log("[v0] Ban expired, allowing post")
        }
      }

      const postData: {
        author_id: string
        content: string | null
        media_urls?: string[]
        media_types?: string[]
      } = {
        author_id: user.id,
        content: content.trim() || null,
      }

      if (mediaUrls.length > 0 && mediaTypes.length > 0) {
        postData.media_urls = mediaUrls
        postData.media_types = mediaTypes
      }

      console.log("[v0] Inserting post with data:", postData)

      const { data: post, error: insertError } = await supabase.from("posts").insert(postData).select().single()

      if (insertError) {
        console.error("[v0] Post insert error:", insertError)
        console.error("[v0] Error details:", JSON.stringify(insertError, null, 2))
        throw new Error(`Failed to create post: ${insertError.message}`)
      }

      console.log("[v0] Post created successfully:", post.id)

      if (pollData && post) {
        console.log("[v0] Creating poll for post:", post.id)

        const endsAt = pollData.duration
          ? new Date(Date.now() + pollData.duration * 60 * 60 * 1000).toISOString()
          : null

        const { data: pollRecord, error: pollError } = await supabase
          .from("polls")
          .insert({
            post_id: post.id,
            question: pollData.question,
            ends_at: endsAt,
            allow_multiple_answers: pollData.allowMultipleAnswers,
          })
          .select()
          .single()

        if (pollError) {
          console.error("[v0] Poll insert error:", pollError)
          throw new Error(`Post created but poll failed: ${pollError.message}`)
        }

        const optionsToInsert = pollData.options.map((option, index) => ({
          poll_id: pollRecord.id,
          option_text: option,
          position: index,
        }))

        const { error: optionsError } = await supabase.from("poll_options").insert(optionsToInsert)

        if (optionsError) {
          console.error("[v0] Poll options insert error:", optionsError)
          throw new Error(`Poll created but options failed: ${optionsError.message}`)
        }

        console.log("[v0] Poll created successfully")
      }

      setContent("")
      setMediaUrls([])
      setMediaTypes([])
      setPollData(null)
      setShowPollCreator(false)
      setIsExpanded(false)

      toast({
        title: "Post created!",
        description: "Your post has been shared successfully",
      })

      setTimeout(() => {
        router.refresh()
      }, 100)
    } catch (err) {
      console.error("[v0] Post submission error:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to create post. Please try again."
      setError(errorMessage)
      toast({
        title: "Error creating post",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!content.trim() && mediaUrls.length === 0 && !pollData) {
      setError("Draft must have content, media, or a poll")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in to save a draft")
      }

      const { error: insertError } = await supabase.from("post_drafts").insert({
        author_id: user.id,
        content: content.trim() || null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        media_types: mediaTypes.length > 0 ? mediaTypes : null,
      })

      if (insertError) throw insertError

      setContent("")
      setMediaUrls([])
      setMediaTypes([])
      setPollData(null)
      setShowPollCreator(false)
      setIsExpanded(false)
      router.refresh()
      toast({
        title: "Draft saved!",
        description: "Your draft has been saved successfully",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft")
      toast({
        title: "Error creating draft",
        description: err instanceof Error ? err.message : "Failed to save draft",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setContent("")
    setMediaUrls([])
    setMediaTypes([])
    setError(null)
    setIsExpanded(false)
    setShowMentionAutocomplete(false)
    setPollData(null)
    setShowPollCreator(false)
  }

  const removeMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index))
    setMediaTypes(mediaTypes.filter((_, i) => i !== index))
  }

  const getCharacterCountColor = () => {
    const length = content.length
    if (length > 4800) return "text-destructive font-semibold"
    if (length > 4500) return "text-orange-500 font-medium"
    return "text-muted-foreground"
  }

  return (
    <>
      <GuidelinesDialog open={showGuidelinesDialog} onAccept={handleAcceptGuidelines} />

      <div className="bg-card border-b border-border">
        <div className="p-4">
          <div className="flex gap-3 items-start">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
              <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {!isExpanded ? (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="w-full text-left px-4 py-3 rounded-full bg-muted/30 hover:bg-muted/50 transition-all duration-200 text-sm text-muted-foreground border border-transparent hover:border-border"
                >
                  What's on your mind, {profile.username}?
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    ref={textareaRef}
                    placeholder={`What's on your mind, ${profile.username}?`}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[100px] text-base resize-none border-0 focus-visible:ring-0 p-0 placeholder:text-muted-foreground/60"
                    maxLength={5000}
                    autoFocus
                  />

                  {showPollCreator && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Create a Poll</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowPollCreator(false)
                            setPollData(null)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <PollCreator onPollChange={setPollData} />
                    </div>
                  )}

                  {mediaUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {mediaUrls.map((url, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden border border-border">
                          {mediaTypes[index] === "image" || mediaTypes[index] === "gif" ? (
                            <img
                              src={url || "/placeholder.svg"}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-48 object-cover"
                            />
                          ) : mediaTypes[index]?.startsWith("video") ? (
                            <video src={url} className="w-full h-48 object-cover" controls />
                          ) : (
                            <div className="w-full h-48 flex items-center justify-center bg-muted">
                              <span className="text-sm text-muted-foreground">File attached</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {error && (
                    <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1">
                      <MediaUpload
                        onMediaUploaded={(urls, types) => {
                          setMediaUrls(urls)
                          setMediaTypes(types)
                        }}
                      />
                      <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                      <GifPicker onGifSelect={handleGifSelect} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPollCreator(!showPollCreator)}
                        className={showPollCreator ? "bg-primary/10 text-primary" : ""}
                        title="Add poll"
                      >
                        <BarChart3 className="h-5 w-5" />
                      </Button>
                    </div>

                    <span className={`text-xs transition-colors ${getCharacterCountColor()}`}>
                      {content.length} / 5000
                    </span>
                  </div>

                  <div className="flex justify-end items-center gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSaveDraft}
                      disabled={isLoading || (!content.trim() && mediaUrls.length === 0)}
                    >
                      <Save className="h-4 w-4 mr-1.5" />
                      Save Draft
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={
                        isLoading ||
                        (!content.trim() && mediaUrls.length === 0 && !pollData) ||
                        !postingEnabled ||
                        hasAcceptedGuidelines === false
                      }
                      className="min-w-[80px]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        "Post"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
