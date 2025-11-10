"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Ban, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface BannedContentProps {
  banExpiresAt: string | null
  existingAppeal: any
}

export function BannedContent({ banExpiresAt, existingAppeal }: BannedContentProps) {
  const [appealReason, setAppealReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmitAppeal = async () => {
    if (!appealReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for your appeal",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: appealReason.trim() }),
      })

      if (!response.ok) throw new Error("Failed to submit appeal")

      toast({
        title: "Appeal submitted",
        description: "Your appeal has been submitted and will be reviewed by an admin",
      })

      setAppealReason("")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit appeal",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-full">
              <Ban className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle>Account Suspended</CardTitle>
              <CardDescription>Your account has been temporarily suspended</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {banExpiresAt && (
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">Ban expires on</p>
                <p className="text-sm text-muted-foreground">{new Date(banExpiresAt).toLocaleString()}</p>
              </div>
            </div>
          )}

          {existingAppeal ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium text-sm mb-2">Your appeal is pending review</p>
                <p className="text-sm text-muted-foreground">{existingAppeal.reason}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Submitted on {new Date(existingAppeal.created_at).toLocaleString()}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                An admin will review your appeal shortly. You will be notified once a decision has been made.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Submit an Appeal</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  If you believe this ban was issued in error, you can submit an appeal explaining your situation. An
                  admin will review your case.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appeal-reason">Why should your ban be lifted?</Label>
                <Textarea
                  id="appeal-reason"
                  placeholder="Explain why you believe this ban should be lifted..."
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>

              <Button onClick={handleSubmitAppeal} disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Appeal"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
