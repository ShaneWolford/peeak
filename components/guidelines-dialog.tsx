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
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import Link from "next/link"

interface GuidelinesDialogProps {
  open: boolean
  onAccept: () => Promise<void>
}

export function GuidelinesDialog({ open, onAccept }: GuidelinesDialogProps) {
  const [hasRead, setHasRead] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      await onAccept()
    } finally {
      setIsAccepting(false)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Community Guidelines</DialogTitle>
          <DialogDescription>Please read and accept our community guidelines before posting</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <p className="text-muted-foreground">
                Welcome to Peeak - a community built for connection, creativity, and respectful conversation. These
                guidelines outline what's expected of every user to ensure Peeak remains a safe, welcoming and thriving
                environment for everyone.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Values we Believe</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>
                  <strong>Respect:</strong> Treat everyone with basic human decency.
                </li>
                <li>
                  <strong>Safety:</strong> Keep the platform free from harm, hate, and exploitation.
                </li>
                <li>
                  <strong>Creativity:</strong> Express yourself, share ideas, and engage meaningfully.
                </li>
                <li>
                  <strong>Integrity:</strong> Be honest and authentic in your interactions.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Prohibited Content</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Hate speech or harassment</li>
                <li>Violence or self-harm content</li>
                <li>Sexual or explicit content</li>
                <li>Spam and scams</li>
                <li>Illegal activities</li>
                <li>Doxxing or sharing private information</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Your Responsibilities</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Keep posts respectful and relevant</li>
                <li>Respect others' privacy and safety</li>
                <li>Report violations instead of engaging</li>
                <li>Accept accountability for your actions</li>
              </ul>
            </section>

            <section className="pt-2">
              <p className="text-xs text-muted-foreground">
                Violations may result in content removal, warnings, suspension, or permanent ban.{" "}
                <Link href="/guidelines" className="text-primary hover:underline">
                  Read full guidelines
                </Link>
              </p>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-col gap-4">
          <div className="flex items-start space-x-2">
            <Checkbox id="guidelines-read" checked={hasRead} onCheckedChange={(checked) => setHasRead(!!checked)} />
            <label
              htmlFor="guidelines-read"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I have read and agree to follow the Peeak Community Guidelines
            </label>
          </div>
          <Button onClick={handleAccept} disabled={!hasRead || isAccepting} className="w-full">
            {isAccepting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Accepting...
              </>
            ) : (
              "Accept and Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
