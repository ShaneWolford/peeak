"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Check } from "lucide-react"

interface Badge {
  id: string
  name: string
  description: string
  icon_url: string
  color: string
}

interface BadgeSelectorProps {
  badges: Badge[]
  activeBadgeId: string | null
}

export function BadgeSelector({ badges, activeBadgeId }: BadgeSelectorProps) {
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(activeBadgeId)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/profile/active-badge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeId: selectedBadgeId }),
      })

      if (response.ok) {
        toast({
          title: "Badge updated",
          description: selectedBadgeId ? "Your active badge has been updated" : "Your badge has been removed",
        })
      } else {
        throw new Error("Failed to update badge")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your badge. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (badges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Badges Yet</CardTitle>
          <CardDescription>
            You haven't been assigned any badges yet. Badges are awarded by admins for special achievements and
            contributions.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Badges</CardTitle>
          <CardDescription>Select a badge to display on your profile, or choose "No Badge" to hide it</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* No Badge Option */}
          <button
            onClick={() => setSelectedBadgeId(null)}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              selectedBadgeId === null ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">No Badge</div>
                <div className="text-sm text-muted-foreground">Don't display a badge</div>
              </div>
              {selectedBadgeId === null && <Check className="h-5 w-5 text-primary" />}
            </div>
          </button>

          {/* Badge Options */}
          {badges.map((badge) => (
            <button
              key={badge.id}
              onClick={() => setSelectedBadgeId(badge.id)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedBadgeId === badge.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0" dangerouslySetInnerHTML={{ __html: badge.icon_url }} />
                  <div>
                    <div className="font-semibold">{badge.name}</div>
                    <div className="text-sm text-muted-foreground">{badge.description}</div>
                  </div>
                </div>
                {selectedBadgeId === badge.id && <Check className="h-5 w-5 text-primary" />}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isLoading || selectedBadgeId === activeBadgeId} className="w-full">
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}
