"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Flag, Ban } from "lucide-react"
import { ReportDialog } from "./report-dialog"
import { BlockUserDialog } from "./block-user-dialog"
import { useState } from "react"

interface UserActionsMenuProps {
  userId: string
  username: string
  isOwnProfile?: boolean
}

export function UserActionsMenu({ userId, username, isOwnProfile }: UserActionsMenuProps) {
  const [reportOpen, setReportOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)

  if (isOwnProfile) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => setReportOpen(true)}>
            <Flag className="h-4 w-4 mr-2" />
            Report @{username}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setBlockOpen(true)} className="text-destructive">
            <Ban className="h-4 w-4 mr-2" />
            Block @{username}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDialog reportedUserId={userId} trigger={<div style={{ display: "none" }} />} />
      <BlockUserDialog userId={userId} username={username} trigger={<div style={{ display: "none" }} />} />
    </>
  )
}
