"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ImageIcon, Video, X, Loader2 } from "lucide-react"
import { compressImage } from "@/lib/image-compression"

interface MediaUploadProps {
  onMediaUploaded: (urls: string[], types: string[]) => void
  maxFiles?: number
  allowVideos?: boolean
  allowFiles?: boolean
}

export function MediaUpload({
  onMediaUploaded,
  maxFiles = 4,
  allowVideos = true,
  allowFiles = true,
}: MediaUploadProps) {
  const [previews, setPreviews] = useState<{ url: string; type: string }[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (previews.length + files.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files`)
      return
    }

    setIsUploading(true)
    try {
      const uploadedMedia: { url: string; type: string }[] = []

      for (const file of files) {
        const isImage = file.type.startsWith("image/")
        const isVideo = file.type.startsWith("video/")
        const isDocument = !isImage && !isVideo

        if (!isImage && !isVideo && !isDocument) {
          alert("Only image, video, and document files are supported")
          continue
        }

        if (!allowVideos && isVideo) {
          alert("Video uploads are not allowed")
          continue
        }

        if (!allowFiles && isDocument) {
          alert("File uploads are not allowed")
          continue
        }

        if (isVideo) {
          const duration = await getVideoDuration(file)
          if (duration > 60) {
            alert(`Video "${file.name}" is too long. Maximum duration is 60 seconds (1 minute).`)
            continue
          }
        }

        const maxSize = 10 * 1024 * 1024 // 10MB for all media types
        if (file.size > maxSize) {
          alert(`File "${file.name}" is too large. Maximum size is 10MB.`)
          continue
        }

        let fileToUpload: File | Blob = file

        if (isImage) {
          try {
            const compressedBlob = await compressImage(file, 1, 1920)
            fileToUpload = new File([compressedBlob], file.name, { type: compressedBlob.type })
          } catch (error) {
            console.error("[v0] Error compressing image:", error)
          }
        }

        console.log("[v0] Uploading file:", file.name)

        const formData = new FormData()
        formData.append("file", fileToUpload)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Upload failed")
        }

        const data = await response.json()
        console.log("[v0] Upload successful:", data)

        const mediaType = isVideo ? "video" : isImage ? "image" : "file"

        uploadedMedia.push({
          url: data.url,
          type: mediaType,
        })
      }

      const newPreviews = [...previews, ...uploadedMedia]
      setPreviews(newPreviews)
      onMediaUploaded(
        newPreviews.map((m) => m.url),
        newPreviews.map((m) => m.type),
      )
    } catch (error) {
      console.error("[v0] Error uploading media:", error)
      alert(`Failed to upload media: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsUploading(false)
    }
  }

  const removeMedia = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index)
    setPreviews(newPreviews)
    onMediaUploaded(
      newPreviews.map((m) => m.url),
      newPreviews.map((m) => m.type),
    )
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={
            allowFiles
              ? "image/*,video/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.ppt,.pptx"
              : allowVideos
                ? "image/*,video/*"
                : "image/*"
          }
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || previews.length >= maxFiles}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4 mr-2" />
              {allowVideos && <Video className="h-4 w-4 mr-2" />}
              Add Media ({previews.length}/{maxFiles})
            </>
          )}
        </Button>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {previews.map((media, index) => (
            <div key={index} className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
              {media.type === "video" ? (
                <video src={media.url} className="w-full h-full object-cover" controls />
              ) : media.type === "file" ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-muted">
                  <div className="text-4xl mb-2">
                    {media.url.endsWith(".pdf")
                      ? "📕"
                      : media.url.match(/\.(doc|docx)$/i)
                        ? "📘"
                        : media.url.match(/\.(xls|xlsx|csv)$/i)
                          ? "📊"
                          : media.url.match(/\.(ppt|pptx)$/i)
                            ? "📙"
                            : media.url.match(/\.txt$/i)
                              ? "📝"
                              : "📄"}
                  </div>
                  <div className="text-xs text-center text-muted-foreground truncate w-full px-2">
                    {media.url.split("/").pop()?.split("-").slice(1).join("-") || "File"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {media.url.split(".").pop()?.toUpperCase() || "FILE"}
                  </div>
                </div>
              ) : (
                <img
                  src={media.url || "/placeholder.svg"}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeMedia(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
