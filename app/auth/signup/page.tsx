"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function SignupRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get("ref")
    const redirectUrl = ref ? `/auth/sign-up?ref=${ref}` : "/auth/sign-up"
    router.replace(redirectUrl)
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  )
}
