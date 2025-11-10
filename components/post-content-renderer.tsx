"use client"

import Link from "next/link"

interface PostContentRendererProps {
  content: string
}

export function PostContentRenderer({ content }: PostContentRendererProps) {
  const renderContent = () => {
    const parts = content.split(/(@\w+|#\w+)/g)

    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        const username = part.substring(1)
        return (
          <Link
            key={index}
            href={`/profile/${username}`}
            className="text-primary hover:underline font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        )
      } else if (part.startsWith("#")) {
        const hashtag = part.substring(1)
        return (
          <Link
            key={index}
            href={`/search?q=${encodeURIComponent("#" + hashtag)}`}
            className="text-primary hover:underline font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap break-words">{renderContent()}</p>
}
