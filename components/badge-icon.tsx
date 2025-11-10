"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface BadgeIconProps {
  iconUrl: string
  name: string
  description?: string
  size?: "sm" | "md" | "lg"
}

export function BadgeIcon({ iconUrl, name, description, size = "md" }: BadgeIconProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }

  const strokeColor = mounted && resolvedTheme === "dark" ? "#E5E7EB" : "#000000"

  const processedSvg = mounted
    ? iconUrl
        .replace(/stroke="[^"]*"/g, "") // Remove all inline stroke attributes
        .replace(/stroke:[^;"]*/g, "") // Remove stroke from inline styles
        .replace(/<svg/, `<svg style="stroke: ${strokeColor} !important; color: ${strokeColor};"`)
        .replace(/<path/g, `<path style="stroke: ${strokeColor} !important;"`)
    : iconUrl

  return (
    <div
      className={`inline-flex items-center justify-center flex-shrink-0 ${sizeClasses[size]} transition-transform hover:scale-110 cursor-help`}
      style={{
        color: strokeColor,
      }}
      title={description ? `${name} - ${description}` : name}
    >
      <div
        className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain [&_*]:!stroke-current"
        style={{
          color: strokeColor,
        }}
        dangerouslySetInnerHTML={{ __html: processedSvg }}
      />
    </div>
  )
}
