"use client"

import type React from "react"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface GroupBackgroundSelectorProps {
  conversationId: string
  currentBackground?: string | null
  onBackgroundChange: (url: string | null) => void
}

const PRESET_BACKGROUNDS = [
  { id: "none", name: "None", value: null, preview: "bg-background" },
  {
    id: "gradient-1",
    name: "Ocean",
    value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    preview: "bg-gradient-to-br from-blue-500 to-purple-600",
  },
  {
    id: "gradient-2",
    name: "Sunset",
    value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    preview: "bg-gradient-to-br from-pink-400 to-red-500",
  },
  {
    id: "gradient-3",
    name: "Forest",
    value: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    preview: "bg-gradient-to-br from-blue-400 to-cyan-400",
  },
  {
    id: "gradient-4",
    name: "Lavender",
    value: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    preview: "bg-gradient-to-br from-teal-200 to-pink-200",
  },
  { id: "solid-1", name: "Dark", value: "#1a1a1a", preview: "bg-zinc-900" },
  { id: "solid-2", name: "Navy", value: "#0f172a", preview: "bg-slate-900" },
]

export function GroupBackgroundSelector({
  conversationId,
  currentBackground,
  onBackgroundChange,
}: GroupBackgroundSelectorProps) {
  const [selectedBackground, setSelectedBackground] = useState(currentBackground || null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handlePresetSelect = async (value: string | null) => {
    setSelectedBackground(value)
    await saveBackground(value)
  }

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB")
      return
    }

    setIsUploading(true)
    try {
      const supabase = createClient()

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${conversationId}-${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from("conversation-backgrounds")
        .upload(fileName, file, { upsert: true })

      if (error) throw error

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("conversation-backgrounds").getPublicUrl(data.path)

      setSelectedBackground(publicUrl)
      await saveBackground(publicUrl)
    } catch (error) {
      console.error("Error uploading background:", error)
      alert("Failed to upload background")
    } finally {
      setIsUploading(false)
    }
  }

  const saveBackground = async (backgroundValue: string | null) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/conversations/${conversationId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ background_url: backgroundValue }),
      })

      if (!response.ok) throw new Error("Failed to update background")

      onBackgroundChange(backgroundValue)
    } catch (error) {
      console.error("Error saving background:", error)
      alert("Failed to save background")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Label>Chat Background</Label>

      {/* Preset Backgrounds */}
      <div className="grid grid-cols-3 gap-3">
        {PRESET_BACKGROUNDS.map((bg) => (
          <button
            key={bg.id}
            onClick={() => handlePresetSelect(bg.value)}
            disabled={isSaving}
            className={cn(
              "relative h-20 rounded-lg border-2 transition-all overflow-hidden",
              selectedBackground === bg.value
                ? "border-primary ring-2 ring-primary ring-offset-2"
                : "border-border hover:border-muted-foreground",
              bg.preview,
            )}
          >
            {selectedBackground === bg.value && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Check className="h-6 w-6 text-white" />
              </div>
            )}
            <span className="absolute bottom-1 left-1 right-1 text-xs font-medium text-white bg-black/50 rounded px-1 py-0.5 text-center">
              {bg.name}
            </span>
          </button>
        ))}
      </div>

      {/* Custom Upload */}
      <div>
        <Label htmlFor="custom-background" className="cursor-pointer">
          <div className="flex items-center justify-center gap-2 h-20 rounded-lg border-2 border-dashed border-border hover:border-muted-foreground transition-colors">
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span className="text-sm">Upload Custom Image</span>
              </>
            )}
          </div>
        </Label>
        <input
          id="custom-background"
          type="file"
          accept="image/*"
          onChange={handleCustomUpload}
          disabled={isUploading || isSaving}
          className="hidden"
        />
      </div>

      {isSaving && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving background...
        </p>
      )}
    </div>
  )
}
