"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Loader2, ImageIcon } from "lucide-react"

interface GifPickerProps {
  onGifSelect: (gifUrl: string) => void
}

interface TenorGif {
  id: string
  media_formats: {
    gif: { url: string }
    tinygif: { url: string }
  }
}

export function GifPicker({ onGifSelect }: GifPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [gifs, setGifs] = useState<TenorGif[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Tenor API key - using a demo key, replace with your own
  const TENOR_API_KEY = "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ"

  useEffect(() => {
    if (open) {
      loadTrendingGifs()
    }
  }, [open])

  const loadTrendingGifs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=20&media_filter=gif,tinygif`,
      )
      const data = await response.json()
      setGifs(data.results || [])
    } catch (error) {
      console.error("Error loading trending GIFs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      loadTrendingGifs()
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=20&media_filter=gif,tinygif`,
      )
      const data = await response.json()
      setGifs(data.results || [])
    } catch (error) {
      console.error("Error searching GIFs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    const timeoutId = setTimeout(() => {
      searchGifs(value)
    }, 500)
    return () => clearTimeout(timeoutId)
  }

  const handleGifClick = (gifUrl: string) => {
    onGifSelect(gifUrl)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" title="Add GIF">
          <ImageIcon className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" align="start">
        <div className="space-y-3">
          <Input
            placeholder="Search GIFs..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
          />

          <div className="h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => handleGifClick(gif.media_formats.gif.url)}
                    className="relative aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity bg-muted"
                  >
                    <img
                      src={gif.media_formats.tinygif.url || "/placeholder.svg"}
                      alt="GIF"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">Powered by Tenor</p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
