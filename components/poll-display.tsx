"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Clock, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface PollOption {
  id: string
  option_text: string
  position: number
  vote_count: number
}

interface Poll {
  id: string
  question: string
  ends_at: string | null
  allow_multiple_answers: boolean
  total_votes: number
  options: PollOption[]
  user_votes: string[]
}

interface PollDisplayProps {
  postId: string
  currentUserId?: string
}

export function PollDisplay({ postId, currentUserId }: PollDisplayProps) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchPoll()
  }, [postId])

  const fetchPoll = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/posts/${postId}/poll`)

      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          setPoll(data)
          setHasVoted(data.user_votes.length > 0)
          setSelectedOptions(data.user_votes)
        }
      } else if (response.status === 404) {
        // No poll exists for this post, which is normal - don't log error
        setPoll(null)
      } else {
        // Only log actual errors (500, etc.)
        console.error("Error fetching poll:", response.statusText)
        setPoll(null)
      }
    } catch (error) {
      // Network errors or parsing errors
      console.error("Error fetching poll:", error)
      setPoll(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVote = async () => {
    if (!currentUserId) {
      toast({
        title: "Login required",
        description: "You must be logged in to vote",
        variant: "destructive",
      })
      return
    }

    if (selectedOptions.length === 0) {
      toast({
        title: "No selection",
        description: "Please select at least one option",
        variant: "destructive",
      })
      return
    }

    setIsVoting(true)
    try {
      const response = await fetch(`/api/posts/${postId}/poll/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIds: selectedOptions }),
      })

      if (response.ok) {
        const data = await response.json()
        setPoll(data)
        setHasVoted(true)
        toast({
          title: "Vote recorded",
          description: "Your vote has been recorded successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to vote")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record vote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVoting(false)
    }
  }

  const handleRemoveVote = async () => {
    if (!currentUserId) {
      toast({
        title: "Login required",
        description: "You must be logged in to remove your vote",
        variant: "destructive",
      })
      return
    }

    setIsVoting(true)
    try {
      const response = await fetch(`/api/posts/${postId}/poll/vote`, {
        method: "DELETE",
      })

      if (response.ok) {
        const data = await response.json()
        setPoll(data)
        setHasVoted(false)
        setSelectedOptions([])
        toast({
          title: "Vote removed",
          description: "Your vote has been removed. You can vote again.",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove vote")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove vote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVoting(false)
    }
  }

  const handleOptionToggle = (optionId: string) => {
    if (hasVoted || isExpired) return

    if (poll?.allow_multiple_answers) {
      setSelectedOptions((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
      )
    } else {
      setSelectedOptions([optionId])
    }
  }

  if (isLoading || !poll) return null

  const isExpired = poll.ends_at ? new Date(poll.ends_at) < new Date() : false
  const showResults = hasVoted || isExpired

  return (
    <Card className="p-4 space-y-4 bg-muted/30">
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{poll.question}</h3>
        {poll.ends_at && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {isExpired ? (
              <span>Poll ended</span>
            ) : (
              <span>Ends {formatDistanceToNow(new Date(poll.ends_at), { addSuffix: true })}</span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {poll.options
          .sort((a, b) => a.position - b.position)
          .map((option) => {
            const percentage = poll.total_votes > 0 ? (option.vote_count / poll.total_votes) * 100 : 0
            const isSelected = selectedOptions.includes(option.id)
            const isUserVote = poll.user_votes.includes(option.id)

            return (
              <div key={option.id}>
                {showResults ? (
                  <div className="relative overflow-hidden rounded-lg border border-border">
                    <div className="absolute inset-0 bg-primary/10" style={{ width: `${percentage}%` }} />
                    <div
                      className={`relative z-10 flex items-start justify-between gap-3 p-3 ${
                        isUserVote ? "font-semibold" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {isUserVote && <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />}
                        <span className="text-sm leading-relaxed break-words">{option.option_text}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-sm font-semibold tabular-nums">{percentage.toFixed(0)}%</span>
                        <span className="text-xs text-muted-foreground tabular-nums">({option.vote_count})</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className="w-full justify-start text-left min-h-[48px] h-auto py-3 px-4 whitespace-normal"
                    onClick={() => handleOptionToggle(option.id)}
                    disabled={isVoting || isExpired}
                  >
                    <span className="flex items-start gap-3 w-full">
                      {isSelected && <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                      <span className="text-sm leading-relaxed break-words flex-1">{option.option_text}</span>
                    </span>
                  </Button>
                )}
              </div>
            )
          })}
      </div>

      {!showResults && !isExpired && (
        <Button onClick={handleVote} disabled={isVoting || selectedOptions.length === 0} className="w-full">
          {isVoting ? "Voting..." : "Vote"}
        </Button>
      )}

      {hasVoted && !isExpired && currentUserId && (
        <Button onClick={handleRemoveVote} disabled={isVoting} variant="outline" className="w-full bg-transparent">
          <X className="h-4 w-4 mr-2" />
          {isVoting ? "Removing..." : "Remove Vote"}
        </Button>
      )}

      {showResults && (
        <div className="text-sm text-muted-foreground text-center">
          {poll.total_votes} {poll.total_votes === 1 ? "vote" : "votes"}
          {poll.allow_multiple_answers && " • Multiple answers allowed"}
        </div>
      )}
    </Card>
  )
}
