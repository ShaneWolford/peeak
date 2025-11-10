"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"

interface LinkPreviewProps {
  url: string
}

interface PreviewData {
  title?: string
  description?: string
  image?: string
  siteName?: string
}

export function LinkPreview({ url }: LinkPreviewProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        // Use a meta scraping service or API
        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
        if (response.ok) {
          const data = await response.json()
          setPreview(data)
        } else {
          setError(true)
        }
      } catch (err) {
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreview()
  }, [url])

  if (isLoading) {
    return (
      <Card className="p-3 animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
        <div className="h-3 bg-muted rounded w-full" />
      </Card>
    )
  }

  if (error || !preview) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline flex items-center gap-1"
      >
        {url}
        <ExternalLink className="h-3 w-3" />
      </a>
    )
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block">
      <Card className="p-3 hover:bg-muted/50 transition-colors">
        {preview.image && (
          <img
            src={preview.image || "/placeholder.svg"}
            alt={preview.title || "Link preview"}
            className="w-full h-32 object-cover rounded mb-2"
          />
        )}
        <div className="space-y-1">
          {preview.siteName && <p className="text-xs text-muted-foreground">{preview.siteName}</p>}
          {preview.title && <p className="font-medium text-sm line-clamp-1">{preview.title}</p>}
          {preview.description && <p className="text-xs text-muted-foreground line-clamp-2">{preview.description}</p>}
          <p className="text-xs text-blue-500 flex items-center gap-1">
            {new URL(url).hostname}
            <ExternalLink className="h-3 w-3" />
          </p>
        </div>
      </Card>
    </a>
  )
}
