"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, X } from "lucide-react"
import { compressImage } from "@/lib/image-compression"
import { cn } from "@/lib/utils"
import { ImageCropDialog } from "@/components/image-crop-dialog"
import { checkIsAdmin } from "@/lib/check-admin"

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  userId: string
  displayName: string
  onUploadComplete: (url: string) => void
}

export function AvatarUpload({ currentAvatarUrl, userId, displayName, onUploadComplete }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  useEffect(() => {
    checkIsAdmin(userId).then(setIsAdmin)
  }, [userId])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === "image/gif") {
        await processFile(file)
      } else {
        await prepareForCrop(file)
      }
    }
  }

  const prepareForCrop = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    const maxSize = isAdmin ? 100 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`Image must be less than ${isAdmin ? "100MB" : "10MB"}`)
      return
    }

    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setImageToCrop(objectUrl)
    setCropDialogOpen(true)
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!selectedFile) return

    const croppedFile = new File([croppedBlob], selectedFile.name, {
      type: selectedFile.type,
    })

    await processFile(croppedFile)

    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop)
    }
    setImageToCrop(null)
    setSelectedFile(null)
  }

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    const maxSize = isAdmin ? 100 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`Image must be less than ${isAdmin ? "100MB" : "10MB"}`)
      return
    }

    setIsUploading(true)
    try {
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      const supabase = createClient()
      let uploadBlob: Blob
      let contentType: string
      let extension: string

      if (file.type === "image/gif") {
        uploadBlob = file
        contentType = "image/gif"
        extension = "gif"
      } else {
        uploadBlob = await compressImage(file, 0.5, 800)
        const isPNG = file.type === "image/png"
        contentType = isPNG ? "image/png" : "image/jpeg"
        extension = isPNG ? "png" : "jpg"
      }

      const fileName = `${userId}/avatar-${Date.now()}.${extension}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, uploadBlob, {
        upsert: true,
        contentType,
      })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName)

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlWithCacheBust })
        .eq("id", userId)

      if (updateError) throw updateError

      onUploadComplete(urlWithCacheBust)
      setPreviewUrl(urlWithCacheBust)

      URL.revokeObjectURL(objectUrl)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error uploading avatar:", error)
      alert("Failed to upload avatar. Please try again.")
      setPreviewUrl(currentAvatarUrl || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId)

      if (error) throw error

      onUploadComplete("")
      setPreviewUrl(null)
    } catch (error) {
      console.error("Error removing avatar:", error)
      alert("Failed to remove avatar")
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex items-center justify-center gap-4 p-6 rounded-lg border-2 border-dashed transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-border",
            isUploading && "opacity-50 pointer-events-none",
          )}
        >
          <Avatar className="h-24 w-24 overflow-hidden rounded-full border-2 border-border">
            <AvatarImage src={previewUrl || undefined} className="object-cover w-full h-full" />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <p className="font-medium mb-1">Profile Picture</p>
            <p className="text-sm text-muted-foreground mb-3">
              {isDragging ? "Drop image here" : "Drag and drop or click to upload"}
            </p>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                size="sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </>
                )}
              </Button>
              {previewUrl && (
                <Button type="button" variant="outline" size="sm" onClick={handleRemove} disabled={isUploading}>
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Supported formats: JPG, PNG, GIF (animated GIFs supported). Maximum size: {isAdmin ? "100MB" : "10MB"}.
          {isAdmin && <span className="text-primary font-medium"> (Admin: Extended limit)</span>}
        </p>
      </div>

      {imageToCrop && (
        <ImageCropDialog
          open={cropDialogOpen}
          imageSrc={imageToCrop}
          onClose={() => {
            setCropDialogOpen(false)
            if (imageToCrop) {
              URL.revokeObjectURL(imageToCrop)
            }
            setImageToCrop(null)
            setSelectedFile(null)
            if (fileInputRef.current) {
              fileInputRef.current.value = ""
            }
          }}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
          cropShape="round"
          title="Crop Profile Picture"
        />
      )}
    </>
  )
}
