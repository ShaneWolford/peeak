"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface SendMessageRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipientId: string
  recipientName: string
}

export function SendMessageRequestDialog({
  open,
  onOpenChange,
  recipientId,
  recipientName,
}: SendMessageRequestDialogProps) {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSend = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/message-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: recipientId,
          message: message.trim() || null,
        }),
      })

      if (response.ok) {
        onOpenChange(false)
        setMessage("")
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to send request")
      }
    } catch (error) {
      console.error("[v0] Error sending message request:", error)
      alert("Failed to send request")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Message Request</DialogTitle>
          <DialogDescription>
            Send a message request to {recipientName}. They'll be able to see your message and decide whether to accept
            or decline.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            placeholder="Add a message (optional)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">{message.length}/500</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
