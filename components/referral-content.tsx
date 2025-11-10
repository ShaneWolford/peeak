"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, Copy, Gift, Users, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BadgeIcon } from "@/components/badge-icon"
import Link from "next/link"

interface ReferredUser {
  id: string
  created_at: string
  referred_user: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface ReferralContentProps {
  referralCode: string
  referralCount: number
  hasBadge: boolean
  badgeIcon: string
  badgeName: string
  badgeDescription: string
  referredUsers: ReferredUser[]
}

export function ReferralContent({
  referralCode,
  referralCount,
  hasBadge,
  badgeIcon,
  badgeName,
  badgeDescription,
  referredUsers,
}: ReferralContentProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/sign-up?ref=${referralCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const progress = Math.min((referralCount / 5) * 100, 100)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-foreground" />
          <h1 className="text-3xl font-bold">Referral Program</h1>
        </div>
        <p className="text-muted-foreground">Invite friends and earn exclusive rewards</p>
      </div>

      <Card className={hasBadge ? "border-2" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Referral Master Badge</CardTitle>
              <CardDescription>
                {hasBadge ? "You've unlocked this badge!" : "Refer 5 friends to unlock"}
              </CardDescription>
            </div>
            {hasBadge && (
              <Badge variant="outline" className="gap-1">
                <Check className="h-3 w-3" />
                Unlocked
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border">
            <div className="relative">
              {badgeIcon && <BadgeIcon iconUrl={badgeIcon} name={badgeName} description={badgeDescription} size="lg" />}
              {!hasBadge && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full backdrop-blur-sm">
                  <Lock className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{badgeName}</p>
              <p className="text-sm text-muted-foreground">{badgeDescription}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{referralCount} / 5</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-foreground transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              {hasBadge
                ? "Badge unlocked!"
                : `${5 - referralCount} more referral${5 - referralCount !== 1 ? "s" : ""} needed`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>Share this link with friends</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="font-mono text-sm" />
            <Button onClick={handleCopy} variant="outline" className="shrink-0 bg-transparent">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            When someone signs up using your link, you get credit automatically
          </p>
        </CardContent>
      </Card>

      {referredUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Referred Users ({referredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referredUsers.map((referral) => (
                <Link
                  key={referral.id}
                  href={`/profile/${referral.referred_user.username}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={referral.referred_user.avatar_url || undefined} />
                    <AvatarFallback>
                      {referral.referred_user.display_name?.[0] || referral.referred_user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">
                      {referral.referred_user.display_name || referral.referred_user.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">@{referral.referred_user.username}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(referral.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
              1
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">Share Your Link</p>
              <p className="text-sm text-muted-foreground">Copy and share your unique referral link</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
              2
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">Friends Sign Up</p>
              <p className="text-sm text-muted-foreground">They create an account using your link</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
              3
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">Earn Rewards</p>
              <p className="text-sm text-muted-foreground">Unlock exclusive badges after 5 referrals</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
