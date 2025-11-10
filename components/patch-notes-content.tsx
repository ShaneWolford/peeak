"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles, Bug, TrendingUp, Megaphone } from "lucide-react"
import { useRouter } from "next/navigation"

interface PatchNote {
  id: string
  version: string
  title: string
  description: string
  type: "feature" | "bugfix" | "improvement" | "announcement"
  created_at: string
  creator?: {
    username: string
    display_name: string
  }
}

interface PatchNotesContentProps {
  patchNotes: PatchNote[]
}

const typeConfig = {
  feature: {
    label: "New Feature",
    icon: Sparkles,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  bugfix: {
    label: "Bug Fix",
    icon: Bug,
    color: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  improvement: {
    label: "Improvement",
    icon: TrendingUp,
    color: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  announcement: {
    label: "Announcement",
    icon: Megaphone,
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
}

export function PatchNotesContent({ patchNotes }: PatchNotesContentProps) {
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/settings")} className="gap-2 mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Button>

      <div>
        <h1 className="text-3xl font-bold mb-2">Patch Notes</h1>
        <p className="text-muted-foreground">Stay up to date with the latest features and improvements</p>
      </div>

      {patchNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No patch notes yet. Check back soon!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {patchNotes.map((note) => {
            const config = typeConfig[note.type]
            const Icon = config.icon

            return (
              <Card key={note.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono">
                          v{note.version}
                        </Badge>
                        <Badge variant="outline" className={config.color}>
                          <Icon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">{note.title}</CardTitle>
                    </div>
                    <time className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(note.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed whitespace-pre-wrap">
                    {note.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
