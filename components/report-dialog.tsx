"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client" // Fixed import path to use correct supabase client location
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ReportDialogProps {
  reportedUserId?: string
  reportedPostId?: string
  reportedCommentId?: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam or misleading" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech or symbols" },
  { value: "violence", label: "Violence or dangerous content" },
  { value: "nudity", label: "Nudity or sexual content" },
  { value: "false_info", label: "False information" },
  { value: "other", label: "Something else" },
]

export function ReportDialog({
  reportedUserId,
  reportedPostId,
  reportedCommentId,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ReportDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const [reason, setReason] = useState("")
  const [details, setDetails] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) {
      toast({
        title: "Please select a reason",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient() // Updated supabase client creation

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("You must be logged in to report")

      const reportReason = details ? `${reason}: ${details}` : reason // Updated reason combination

      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId || null,
        reported_post_id: reportedPostId || null,
        reported_comment_id: reportedCommentId || null,
        reason: reportReason,
        status: "pending",
      })

      if (error) throw error

      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe.",
      })

      setOpen(false)
      setReason("")
      setDetails("")
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        title: "Failed to submit report",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>Help us understand what's happening. Your report is anonymous.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>Why are you reporting this?</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide more context..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-sm text-muted-foreground text-right">{details.length} / 500</p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
