"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Loader2, RotateCw, ZoomIn, ZoomOut } from "lucide-react"

interface ImageCropperProps {
  imageUrl: string
  aspectRatio?: number
  outputSize: { width: number; height: number }
  onCropComplete: (blob: Blob) => void
  onCancel: () => void
  isUploading?: boolean
  title?: string
  shape?: "circle" | "rectangle"
}

export function ImageCropper({
  imageUrl,
  aspectRatio = 1,
  outputSize,
  onCropComplete,
  onCancel,
  isUploading = false,
  title = "Crop Image",
  shape = "rectangle",
}: ImageCropperProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [minZoom, setMinZoom] = useState(0.5)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current
      const container = containerRef.current

      const handleImageLoad = () => {
        const containerRect = container.getBoundingClientRect()
        const imgWidth = img.naturalWidth
        const imgHeight = img.naturalHeight

        setImageDimensions({ width: imgWidth, height: imgHeight })

        const minZoomWidth = containerRect.width / imgWidth
        const minZoomHeight = containerRect.height / imgHeight
        const calculatedMinZoom = Math.max(minZoomWidth, minZoomHeight)

        setMinZoom(calculatedMinZoom)

        const initialZoom = calculatedMinZoom * 1.1
        setZoom(initialZoom)

        const scaledWidth = imgWidth * initialZoom
        const scaledHeight = imgHeight * initialZoom
        setPosition({
          x: (containerRect.width - scaledWidth) / 2,
          y: (containerRect.height - scaledHeight) / 2,
        })
      }

      if (img.complete) {
        handleImageLoad()
      } else {
        img.addEventListener("load", handleImageLoad)
        return () => img.removeEventListener("load", handleImageLoad)
      }
    }
  }, [imageUrl, shape])

  const constrainPosition = (newX: number, newY: number, currentZoom: number) => {
    if (!imageRef.current || !containerRef.current) return { x: newX, y: newY }

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const scaledWidth = imageDimensions.width * currentZoom
    const scaledHeight = imageDimensions.height * currentZoom

    const maxX = 0
    const minX = containerRect.width - scaledWidth
    const constrainedX = Math.max(minX, Math.min(maxX, newX))

    const maxY = 0
    const minY = containerRect.height - scaledHeight
    const constrainedY = Math.max(minY, Math.min(maxY, newY))

    return { x: constrainedX, y: constrainedY }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const newPos = constrainPosition(e.clientX - dragStart.x, e.clientY - dragStart.y, zoom)
    setPosition(newPos)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const touch = e.touches[0]
    const newPos = constrainPosition(touch.clientX - dragStart.x, touch.clientY - dragStart.y, zoom)
    setPosition(newPos)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleZoomPreset = (preset: number) => {
    const newZoom = Math.max(minZoom, preset)
    setZoom(newZoom)
    const constrained = constrainPosition(position.x, position.y, newZoom)
    setPosition(constrained)
  }

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.1, 5)
    setZoom(newZoom)
    const constrained = constrainPosition(position.x, position.y, newZoom)
    setPosition(constrained)
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.1, minZoom)
    setZoom(newZoom)
    const constrained = constrainPosition(position.x, position.y, newZoom)
    setPosition(constrained)
  }

  const handleReset = () => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current
      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()

      const initialZoom = minZoom * 1.1
      setZoom(initialZoom)

      const scaledWidth = img.naturalWidth * initialZoom
      const scaledHeight = img.naturalHeight * initialZoom
      setPosition({
        x: (containerRect.width - scaledWidth) / 2,
        y: (containerRect.height - scaledHeight) / 2,
      })
      setRotation(0)
    }
  }

  const handleZoomChange = (value: number[]) => {
    const newZoom = value[0]
    setZoom(newZoom)
    const constrained = constrainPosition(position.x, position.y, newZoom)
    setPosition(constrained)
  }

  const handleCrop = async () => {
    if (!imageRef.current || !containerRef.current) return

    try {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Could not get canvas context")

      canvas.width = outputSize.width
      canvas.height = outputSize.height

      const img = imageRef.current
      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()

      const scale = zoom
      const centerX = containerRect.width / 2
      const centerY = containerRect.height / 2

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.save()

      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.translate(-canvas.width / 2, -canvas.height / 2)

      const sourceX = (centerX - position.x) / scale
      const sourceY = (centerY - position.y) / scale
      const sourceWidth = containerRect.width / scale
      const sourceHeight = containerRect.height / scale

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height)

      ctx.restore()

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.98)
      })

      onCropComplete(blob)
    } catch (error) {
      console.error("Error cropping image:", error)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            {shape === "circle"
              ? "Drag to reposition and use the zoom slider to adjust. The image will fill the entire circle."
              : "Drag to reposition and zoom to frame your image. The entire crop area will be filled."}
          </p>

          <div
            ref={containerRef}
            className="relative w-full bg-muted rounded-lg overflow-hidden cursor-move select-none"
            style={{ aspectRatio }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              ref={imageRef}
              src={imageUrl || "/placeholder.svg"}
              alt="Crop preview"
              className="absolute pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "0 0",
              }}
              draggable={false}
            />
            <div
              className={`absolute inset-0 border-4 border-white pointer-events-none ${shape === "circle" ? "rounded-full" : ""}`}
              style={{
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
              }}
            />
            {/* Grid overlay for alignment */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-white/30" />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Zoom</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleZoomOut}
                    className="h-7 w-7 bg-transparent"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleZoomIn}
                    className="h-7 w-7 bg-transparent"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleZoomPreset(1)}
                    className="h-7 px-2 text-xs"
                  >
                    1x
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleZoomPreset(1.5)}
                    className="h-7 px-2 text-xs"
                  >
                    1.5x
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleZoomPreset(2)}
                    className="h-7 px-2 text-xs"
                  >
                    2x
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[3rem] text-right">{zoom.toFixed(2)}x</span>
                </div>
              </div>
              <Slider value={[zoom]} onValueChange={handleZoomChange} min={minZoom} max={5} step={0.01} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Rotation</label>
                <span className="text-sm text-muted-foreground">{rotation}°</span>
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[rotation]}
                  onValueChange={(v) => setRotation(v[0])}
                  min={0}
                  max={360}
                  step={1}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotate 90°"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-between">
            <Button type="button" variant="ghost" onClick={handleReset} disabled={isUploading}>
              Reset
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} disabled={isUploading}>
                Cancel
              </Button>
              <Button onClick={handleCrop} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
