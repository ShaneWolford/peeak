"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Card } from "./ui/card"
import { Label } from "./ui/label"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Upload, X, Video } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "./ui/switch"

export function PeaksUpload() {
  const router = useRouter()
  const { toast } = useToast()
  const [content, setContent] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Customization options
  const [allowComments, setAllowComments] = useState(true)

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file",
        description: "Please select a video file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be less than 100MB",
        variant: "destructive",
      })
      return
    }

    // Validate duration (max 60 seconds)
    const duration = await getVideoDuration(file)
    if (duration > 60) {
      toast({
        title: "Video too long",
        description: "Peaks must be 60 seconds or less",
        variant: "destructive",
      })
      return
    }

    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
  }

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video")
      video.preload = "metadata"

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        resolve(video.duration)
      }

      video.onerror = () => {
        reject(new Error("Failed to load video metadata"))
      }

      video.src = URL.createObjectURL(file)
    })
  }

  const handleRemoveVideo = () => {
    setVideoFile(null)
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
      setVideoPreview(null)
    }
  }

  const handleUpload = async () => {
    if (!videoFile) {
      toast({
        title: "No video selected",
        description: "Please select a video to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(10)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      setUploadProgress(30)

      const formData = new FormData()
      formData.append("file", videoFile)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload video")
      }

      const { url: videoUrl } = await uploadResponse.json()

      setUploadProgress(70)

      // Create post
      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
          content: content.trim() || null,
          media_urls: [videoUrl],
          media_types: ["video"],
          allow_comments: allowComments,
        })
        .select()
        .single()

      if (postError) throw postError

      setUploadProgress(100)

      toast({
        title: "Peak created!",
        description: "Your Peak has been published successfully",
      })

      router.push(`/peaks?postId=${post.id}`)
    } catch (error: any) {
      console.error("[v0] Upload error:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload Peak. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create a Peak</h1>
          <p className="text-muted-foreground mt-1">Share a short video moment (max 60 seconds)</p>
        </div>
        <Button variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      <Card className="p-6 space-y-6 border-2">
        {/* Video Upload Area */}
        <div className="space-y-2">
          <Label>Video</Label>
          {!videoPreview ? (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed hover:border-primary transition-colors cursor-pointer bg-muted/30">
              <div className="flex flex-col items-center justify-center p-6">
                <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
                <p className="mb-2 text-sm font-medium">Click to upload video</p>
                <p className="text-xs text-muted-foreground">MP4, MOV, or WebM (max 100MB, 60 sec)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleVideoChange}
                disabled={isUploading}
              />
            </label>
          ) : (
            <div className="relative border-2 overflow-hidden bg-black">
              <video src={videoPreview} controls className="w-full max-h-96 mx-auto" playsInline />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveVideo}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <Label htmlFor="caption">Caption (optional)</Label>
          <Textarea
            id="caption"
            placeholder="Write a caption for your Peak..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={500}
            disabled={isUploading}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{content.length}/500</p>
        </div>

        {/* Customization Options */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold">Peak Settings</h3>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="comments">Allow comments</Label>
              <p className="text-xs text-muted-foreground">Let people comment on your Peak</p>
            </div>
            <Switch id="comments" checked={allowComments} onCheckedChange={setAllowComments} disabled={isUploading} />
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleUpload} disabled={!videoFile || isUploading} className="flex-1" size="lg">
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Video className="h-4 w-4 mr-2" />
                Publish Peak
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
