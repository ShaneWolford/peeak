"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, Edit, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { DeleteDraftDialog } from "./delete-draft-dialog"
import { EditDraftDialog } from "./edit-draft-dialog"

interface Draft {
  id: string
  author_id: string
  content: string | null
  media_urls: string[] | null
  media_types: string[] | null
  created_at: string
  updated_at: string
}

interface DraftCardProps {
  draft: Draft
}

export function DraftCard({ draft }: DraftCardProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  return (
    <>
      <Card className="p-4 m-4 hover:shadow-md transition-shadow">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Saved {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditDialogOpen(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {draft.content && <p className="text-sm whitespace-pre-wrap break-words line-clamp-3">{draft.content}</p>}

          {draft.media_urls && draft.media_urls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {draft.media_urls.slice(0, 4).map((url, index) => {
                const mediaType = draft.media_types?.[index] || "image"
                return (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    {mediaType === "video" ? (
                      <video src={url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      <DeleteDraftDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        draftId={draft.id}
        onSuccess={() => router.refresh()}
      />
      <EditDraftDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        draft={draft}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}
