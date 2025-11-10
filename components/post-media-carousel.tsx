"use client"

import { useState, useEffect } from "react"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PostMediaCarouselProps {
  mediaUrls: string[]
  mediaTypes: string[]
  onMediaClick: (index: number) => void
}

export function PostMediaCarousel({ mediaUrls, mediaTypes, onMediaClick }: PostMediaCarouselProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  useEffect(() => {
    if (!api) return

    const updateState = () => {
      setCurrent(api.selectedScrollSnap())
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }

    updateState()
    api.on("select", updateState)
    api.on("reInit", updateState)

    return () => {
      api.off("select", updateState)
      api.off("reInit", updateState)
    }
  }, [api])

  // Helper function to get file name from URL
  const getFileName = (url: string) => {
    return url.split("/").pop()?.split("-").slice(1).join("-") || "Download"
  }

  // Helper function to get file extension
  const getFileExtension = (url: string) => {
    return url.split(".").pop()?.toLowerCase() || "file"
  }

  const isPDF = (url: string) => {
    return getFileExtension(url) === "pdf"
  }

  const getFileIcon = (url: string) => {
    const ext = getFileExtension(url)
    if (ext === "pdf") return "📕"
    if (["doc", "docx"].includes(ext)) return "📘"
    if (["xls", "xlsx", "csv"].includes(ext)) return "📊"
    if (["ppt", "pptx"].includes(ext)) return "📙"
    if (["txt"].includes(ext)) return "📝"
    return "📄"
  }

  if (mediaUrls.length === 0) return null

  // Single media item - no carousel needed
  if (mediaUrls.length === 1) {
    const mediaType = mediaTypes[0]
    return (
      <div className="relative w-full rounded-lg overflow-hidden bg-muted">
        {mediaType === "video" ? (
          <video
            src={mediaUrls[0]}
            className="w-full object-cover cursor-pointer"
            controls
            playsInline
            preload="metadata"
          />
        ) : mediaType === "file" ? (
          <a
            href={mediaUrls[0]}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-6 bg-muted hover:bg-muted/80 transition-colors rounded-lg border border-border group"
          >
            <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <span className="text-3xl">{getFileIcon(mediaUrls[0])}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{getFileName(mediaUrls[0])}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {getFileExtension(mediaUrls[0]).toUpperCase()} File • Click to download
              </div>
            </div>
            <Download className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </a>
        ) : (
          <img
            src={mediaUrls[0] || "/placeholder.svg"}
            alt=""
            className="w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => onMediaClick(0)}
          />
        )}
      </div>
    )
  }

  // Multiple media items - use carousel
  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-muted group">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent className="-ml-0">
          {mediaUrls.map((url, index) => {
            const mediaType = mediaTypes[index]
            return (
              <CarouselItem key={index} className="pl-0">
                <div className="relative w-full aspect-square">
                  {mediaType === "video" ? (
                    <video src={url} className="w-full h-full object-cover" controls playsInline preload="metadata" />
                  ) : mediaType === "file" ? (
                    <a
                      href={url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-6 bg-muted hover:bg-muted/80 transition-colors h-full hover-group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center hover-group-hover:bg-primary/20 transition-colors">
                        <span className="text-3xl">{getFileIcon(url)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{getFileName(url)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {getFileExtension(url).toUpperCase()} File • Click to download
                        </div>
                      </div>
                      <Download className="h-5 w-5 text-muted-foreground hover-group-hover:text-foreground transition-colors flex-shrink-0" />
                    </a>
                  ) : (
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`Media ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => onMediaClick(index)}
                    />
                  )}
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>

        {/* Navigation arrows - only show on hover and when scrollable */}
        {canScrollPrev && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => {
              e.stopPropagation()
              api?.scrollPrev()
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        {canScrollNext && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => {
              e.stopPropagation()
              api?.scrollNext()
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </Carousel>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {mediaUrls.map((_, index) => (
          <button
            key={index}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === current ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80",
            )}
            onClick={(e) => {
              e.stopPropagation()
              api?.scrollTo(index)
            }}
            aria-label={`Go to media ${index + 1}`}
          />
        ))}
      </div>

      {/* Media counter */}
      <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded-full z-10">
        {current + 1} / {mediaUrls.length}
      </div>
    </div>
  )
}
