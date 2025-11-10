"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Profile } from "@/lib/types"

interface MentionAutocompleteProps {
  searchQuery: string
  onSelect: (username: string) => void
  position: { top: number; left: number }
}

export function MentionAutocomplete({ searchQuery, onSelect, position }: MentionAutocompleteProps) {
  const [users, setUsers] = useState<Profile[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery) {
        setUsers([])
        return
      }

      setIsLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(5)

      if (!error && data) {
        setUsers(data)
        setSelectedIndex(0)
      }

      setIsLoading(false)
    }

    const debounce = setTimeout(searchUsers, 150)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (users.length === 0) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % users.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + users.length) % users.length)
      } else if (e.key === "Enter" && users[selectedIndex]) {
        e.preventDefault()
        onSelect(users[selectedIndex].username)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [users, selectedIndex, onSelect])

  if (users.length === 0 && !isLoading) return null

  return (
    <div
      ref={containerRef}
      className="fixed z-50 w-64 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {isLoading ? (
        <div className="p-3 text-sm text-muted-foreground text-center">Searching...</div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          {users.map((user, index) => (
            <button
              key={user.id}
              onClick={() => onSelect(user.username)}
              className={`w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors ${
                index === selectedIndex ? "bg-accent" : ""
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
                <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <div className="font-medium text-sm truncate">{user.display_name || user.username}</div>
                <div className="text-xs text-muted-foreground truncate">@{user.username}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
