"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/utils/supabase-client"
import { Input } from "@/components/ui/input"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles } from "lucide-react"

interface UsernameAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (username: string, userId: string) => void
  placeholder?: string
  className?: string
}

interface UserResult {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  is_pro: boolean
  is_admin: boolean
  is_banned: boolean
  is_shadow_banned: boolean
}

export function UsernameAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search username...",
  className = "",
}: UsernameAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<UserResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const searchUsers = async () => {
      if (!value || value.length < 2) {
        setUsers([])
        setOpen(false)
        return
      }

      setLoading(true)
      setOpen(true)

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, is_pro, is_admin, is_banned, is_shadow_banned")
          .ilike("username", `%${value}%`)
          .limit(8)
          .order("username")

        if (!error && data) {
          setUsers(data)
        }
      } catch (error) {
        console.error("Error searching users:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [value])

  const handleSelect = (user: UserResult) => {
    onChange(user.username)
    onSelect?.(user.username, user.id)
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.length >= 2 && setOpen(true)}
          placeholder={placeholder}
          className="pr-8"
        />
        {loading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {open && users.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
          <Command>
            <CommandList>
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => handleSelect(user)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">@{user.username}</span>
                        {user.is_admin && (
                          <Badge variant="default" className="text-xs">
                            Admin
                          </Badge>
                        )}
                        {user.is_pro && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Pro
                          </Badge>
                        )}
                        {user.is_banned && (
                          <Badge variant="destructive" className="text-xs">
                            Banned
                          </Badge>
                        )}
                        {user.is_shadow_banned && (
                          <Badge variant="outline" className="text-xs">
                            Shadow
                          </Badge>
                        )}
                      </div>
                      {user.display_name && (
                        <p className="text-xs text-muted-foreground truncate">{user.display_name}</p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}

      {open && !loading && users.length === 0 && value.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md p-3">
          <p className="text-sm text-muted-foreground text-center">No users found</p>
        </div>
      )}
    </div>
  )
}
