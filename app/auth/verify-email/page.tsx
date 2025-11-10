"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Mail } from "lucide-react"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [canResend, setCanResend] = useState(true)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && !canResend) {
      setCanResend(true)
    }
  }, [countdown, canResend])

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("Email address not found. Please sign up again.")
      return
    }

    setIsResending(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      })

      if (error) throw error

      toast.success("Verification email sent! Check your inbox.")
      setCanResend(false)
      setCountdown(60)
    } catch (error) {
      console.error("[v0] Error resending verification email:", error)
      toast.error("Failed to resend email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="border-border">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Check your email</CardTitle>
            <CardDescription className="text-base">We've sent you a verification link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {email && (
              <p className="text-sm text-muted-foreground">
                We sent a verification link to <span className="font-medium text-foreground">{email}</span>
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Please check your email and click the verification link to activate your account. Once verified, you'll be
              able to sign in and start using Peeak.
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                variant="outline"
                className="w-full h-11 bg-transparent"
                disabled={!canResend || isResending || !email}
              >
                {isResending ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend verification email"}
              </Button>

              <Button asChild variant="ghost" className="w-full h-11">
                <Link href="/auth/login">Back to Sign In</Link>
              </Button>
            </div>

            {!email && (
              <p className="text-xs text-muted-foreground text-center">
                If you need to resend the verification email, please{" "}
                <Link href="/auth/sign-up" className="underline underline-offset-2">
                  sign up again
                </Link>
                .
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
