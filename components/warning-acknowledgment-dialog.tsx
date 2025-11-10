"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Warning {
  id: string
  reason: string
  details: string | null
  created_at: string
  issuer: {
    username: string
  } | null
}

export function WarningAcknowledgmentDialog() {
  const [warnings, setWarnings] = useState<Warning[]>([])
  const [currentWarningIndex, setCurrentWarningIndex] = useState(0)
  const [isAcknowledging, setIsAcknowledging] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    checkForUnacknowledgedWarnings()
  }, [])

  const checkForUnacknowledgedWarnings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Fetch unacknowledged warnings
      const { data, error } = await supabase
        .from("user_warnings")
        .select(
          `
          id,
          reason,
          details,
          created_at,
          issuer:issued_by (
            username
          )
        `,
        )
        .eq("user_id", user.id)
        .eq("acknowledged", false)
        .order("created_at", { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        setWarnings(data)
        setIsOpen(true)
      }
    } catch (error) {
      console.error("[v0] Error checking warnings:", error)
    }
  }

  const handleAcknowledge = async () => {
    if (warnings.length === 0) return

    const currentWarning = warnings[currentWarningIndex]
    setIsAcknowledging(true)

    try {
      const response = await fetch("/api/warnings/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warningId: currentWarning.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to acknowledge warning")
      }

      if (currentWarningIndex < warnings.length - 1) {
        setCurrentWarningIndex(currentWarningIndex + 1)
      } else {
        // Close the dialog and clear warnings so it won't show again
        setIsOpen(false)
        setWarnings([])
        setCurrentWarningIndex(0)
        toast({
          title: "Warnings acknowledged",
          description: "All warnings have been acknowledged.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to acknowledge warning",
        variant: "destructive",
      })
    } finally {
      setIsAcknowledging(false)
    }
  }

  if (warnings.length === 0) return null

  const currentWarning = warnings[currentWarningIndex]
  const warningCount = warnings.length

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>Warning Received</DialogTitle>
              {warningCount > 1 && (
                <p className="text-sm text-muted-foreground">
                  Warning {currentWarningIndex + 1} of {warningCount}
                </p>
              )}
            </div>
          </div>
          <DialogDescription>
            You have received a warning from the moderation team. Please read and acknowledge this warning before
            continuing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="font-semibold text-sm text-muted-foreground">Reason:</div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">{currentWarning.reason}</p>
            </div>
          </div>

          {currentWarning.details && (
            <div className="space-y-2">
              <div className="font-semibold text-sm text-muted-foreground">Details:</div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{currentWarning.details}</p>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Issued by @{currentWarning.issuer?.username || "System"} on{" "}
            {new Date(currentWarning.created_at).toLocaleDateString()}
          </div>

          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium">Important Notice</p>
            <p className="text-xs text-muted-foreground mt-1">
              Accumulating 3 warnings will result in an automatic 24-hour ban. Please review our community guidelines to
              avoid future warnings.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleAcknowledge} disabled={isAcknowledging} className="w-full">
            {isAcknowledging ? "Acknowledging..." : "I Understand and Acknowledge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
