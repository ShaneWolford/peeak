"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Ban, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface BlockUserDialogProps {
  userId: string
  username: string
  trigger?: React.ReactNode
  onBlockComplete?: () => void
}

export function BlockUserDialog({ userId, username, trigger, onBlockComplete }: BlockUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [isBlocking, setIsBlocking] = useState(false)
  const router = useRouter()

  const handleBlock = async () => {
    setIsBlocking(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("You must be logged in")

      // Block the user
      const { error: blockError } = await supabase.from("blocked_users").insert({
        user_id: user.id,
        blocked_user_id: userId,
      })

      if (blockError) throw blockError

      // Unfollow if following
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId)

      // Remove follower if they follow you
      await supabase.from("follows").delete().eq("follower_id", userId).eq("following_id", user.id)

      toast({
        title: "User blocked",
        description: `You won't see posts from @${username} anymore.`,
      })

      setOpen(false)
      onBlockComplete?.()
      router.refresh()
    } catch (error) {
      console.error("Error blocking user:", error)
      toast({
        title: "Failed to block user",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsBlocking(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Ban className="h-4 w-4 mr-2" />
            Block
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block @{username}?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>They will not be able to:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Follow you or see your posts</li>
              <li>Send you messages</li>
              <li>See your profile or activity</li>
            </ul>
            <p className="pt-2">You will automatically unfollow each other.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBlocking}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBlock}
            disabled={isBlocking}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isBlocking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Blocking...
              </>
            ) : (
              "Block User"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
