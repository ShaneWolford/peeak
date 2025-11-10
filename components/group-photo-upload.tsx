"use client"

import type React from "react"
import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"
import { compressImage } from "@/lib/image-compression"
import { useToast } from "@/hooks/use-toast"

interface GroupPhotoUploadProps {
  currentPhotoUrl?: string | null
  conversationId: string
  groupName: string
  onUploadComplete: (url: string) => void
}

export function GroupPhotoUpload({
  currentPhotoUrl,
  conversationId,
  groupName,
  onUploadComplete,
}: GroupPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const initials = groupName?.slice(0, 2).toUpperCase() || "GC"

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 10MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      // Compress the image
      const compressedBlob = await compressImage(file, 0.5, 800)

      const supabase = createClient()
      const fileName = `groups/${conversationId}/photo-${Date.now()}.jpg`

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, compressedBlob, {
        upsert: true,
        contentType: "image/jpeg",
      })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName)

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`

      // Update conversation via API
      const response = await fetch(`/api/conversations/${conversationId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: urlWithCacheBust }),
      })

      if (!response.ok) throw new Error("Failed to update group photo")

      onUploadComplete(urlWithCacheBust)

      toast({
        title: "Success",
        description: "Group photo updated successfully",
      })

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error uploading group photo:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload group photo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20 overflow-hidden rounded-full border border-border">
        <AvatarImage src={currentPhotoUrl || undefined} className="object-cover w-full h-full" />
        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <p className="text-sm text-muted-foreground mb-2">Group Photo</p>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-transparent"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Change Photo
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. Max 10MB.</p>
      </div>
    </div>
  )
}
