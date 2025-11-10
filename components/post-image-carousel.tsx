"use client"

import { useState, useEffect } from "react"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PostImageCarouselProps {
  images: string[]
  onImageClick: (index: number) => void
}

export function PostImageCarousel({ images, onImageClick }: PostImageCarouselProps) {
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

  if (images.length === 0) return null

  // Single image - no carousel needed
  if (images.length === 1) {
    return (
      <div className="relative w-full rounded-lg overflow-hidden bg-muted">
        <img
          src={images[0] || "/placeholder.svg"}
          alt=""
          className="w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => onImageClick(0)}
        />
      </div>
    )
  }

  // Multiple images - use carousel
  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-muted group">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent className="-ml-0">
          {images.map((image, index) => (
            <CarouselItem key={index} className="pl-0">
              <div className="relative w-full aspect-square">
                <img
                  src={image || "/placeholder.svg"}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => onImageClick(index)}
                />
              </div>
            </CarouselItem>
          ))}
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
        {images.map((_, index) => (
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
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
