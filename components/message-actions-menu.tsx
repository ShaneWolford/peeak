"use client"

import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreVertical, Edit, Trash2, Smile } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface MessageActionsMenuProps {
  messageId: string
  content: string
  isOwnMessage: boolean
  isDM: boolean
  onEdit: (messageId: string, content: string) => void
  onDelete: () => void
}

export function MessageActionsMenu({
  messageId,
  content,
  isOwnMessage,
  isDM,
  onEdit,
  onDelete,
}: MessageActionsMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteForEveryone, setDeleteForEveryone] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    const supabase = createClient()
    const table = isDM ? "direct_messages" : "messages"

    try {
      if (deleteForEveryone) {
        await supabase
          .from(table)
          .update({
            is_deleted: true,
            deleted_for_everyone: true,
            content: "This message was deleted",
          })
          .eq("id", messageId)
      } else {
        await supabase.from(table).update({ is_deleted: true }).eq("id", messageId)
      }

      toast({
        title: "Message deleted",
        description: deleteForEveryone ? "Message deleted for everyone" : "Message deleted for you",
      })

      onDelete()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      })
    }

    setShowDeleteDialog(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => {}}>
            <Smile className="h-4 w-4 mr-2" />
            React
          </DropdownMenuItem>
          {isOwnMessage && (
            <>
              <DropdownMenuItem onClick={() => onEdit(messageId, content)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>Choose how you want to delete this message.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
              onClick={() => {
                setDeleteForEveryone(false)
                handleDelete()
              }}
            >
              Delete for me
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
              onClick={() => {
                setDeleteForEveryone(true)
                handleDelete()
              }}
            >
              Delete for everyone
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
