"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { X, Plus, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"

export interface PollData {
  question: string
  options: string[]
  duration: number | null // in hours, null for no expiration
  allowMultipleAnswers: boolean
}

interface PollCreatorProps {
  onPollChange: (poll: PollData | null) => void
}

export function PollCreator({ onPollChange }: PollCreatorProps) {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [duration, setDuration] = useState<number>(24)
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false)

  const updatePoll = (updates: Partial<PollData>) => {
    const newQuestion = updates.question ?? question
    const newOptions = updates.options ?? options
    const newDuration = updates.duration !== undefined ? updates.duration : duration
    const newAllowMultiple = updates.allowMultipleAnswers ?? allowMultipleAnswers

    const validOptions = newOptions.filter((opt) => opt.trim().length > 0)

    if (newQuestion.trim().length > 0 && validOptions.length >= 2) {
      onPollChange({
        question: newQuestion,
        options: validOptions,
        duration: newDuration,
        allowMultipleAnswers: newAllowMultiple,
      })
    } else {
      onPollChange(null)
    }
  }

  const handleQuestionChange = (value: string) => {
    setQuestion(value)
    updatePoll({ question: value })
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
    updatePoll({ options: newOptions })
  }

  const addOption = () => {
    if (options.length < 4) {
      const newOptions = [...options, ""]
      setOptions(newOptions)
      updatePoll({ options: newOptions })
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index)
      setOptions(newOptions)
      updatePoll({ options: newOptions })
    }
  }

  const handleDurationChange = (value: string) => {
    const numValue = Number.parseInt(value)
    setDuration(numValue)
    updatePoll({ duration: numValue })
  }

  const handleMultipleAnswersChange = (checked: boolean) => {
    setAllowMultipleAnswers(checked)
    updatePoll({ allowMultipleAnswers: checked })
  }

  return (
    <Card className="p-4 space-y-4 bg-muted/30">
      <div className="space-y-2">
        <Label htmlFor="poll-question" className="text-sm font-medium">
          Poll Question
        </Label>
        <Input
          id="poll-question"
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          maxLength={200}
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Options</Label>
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              maxLength={100}
              className="bg-background"
            />
            {options.length > 2 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {options.length < 4 && (
          <Button type="button" variant="outline" size="sm" onClick={addOption} className="w-full bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="poll-duration" className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Poll Duration
          </Label>
          <select
            id="poll-duration"
            value={duration}
            onChange={(e) => handleDurationChange(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="1">1 hour</option>
            <option value="6">6 hours</option>
            <option value="12">12 hours</option>
            <option value="24">1 day</option>
            <option value="72">3 days</option>
            <option value="168">1 week</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="multiple-answers" className="text-sm font-medium cursor-pointer">
            Allow multiple answers
          </Label>
          <Switch id="multiple-answers" checked={allowMultipleAnswers} onCheckedChange={handleMultipleAnswersChange} />
        </div>
      </div>
    </Card>
  )
}
