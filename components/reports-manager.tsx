"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Flag, CheckCircle, XCircle, Eye, Loader2 } from "lucide-react"
import Link from "next/link"

interface Report {
  id: string
  reason: string
  status: string
  created_at: string
  resolved_at: string | null
  admin_notes: string | null
  reporter: {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
  }
  reported_user: {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
  } | null
  reported_post: {
    id: string
    content: string
    created_at: string
  } | null
  reported_comment: {
    id: string
    content: string
    created_at: string
  } | null
  resolved_by_user: {
    id: string
    username: string
    display_name: string
  } | null
}

interface ReportsManagerProps {
  reports: Report[]
  currentUserId: string
}

export function ReportsManager({ reports: initialReports, currentUserId }: ReportsManagerProps) {
  const [reports, setReports] = useState(initialReports)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const pendingReports = reports.filter((r) => r.status === "pending")
  const resolvedReports = reports.filter((r) => r.status === "resolved")
  const dismissedReports = reports.filter((r) => r.status === "dismissed")

  const handleResolve = async (reportId: string, status: "resolved" | "dismissed") => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          admin_notes: adminNotes || null,
          resolved_by: currentUserId,
        }),
      })

      if (!response.ok) throw new Error("Failed to update report")

      const updatedReport = await response.json()

      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, ...updatedReport } : r)))

      toast({
        title: status === "resolved" ? "Report resolved" : "Report dismissed",
        description: `The report has been ${status}`,
      })

      setSelectedReport(null)
      setAdminNotes("")
    } catch (error) {
      console.error("Error updating report:", error)
      toast({
        title: "Error",
        description: "Failed to update report",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getReportType = (report: Report) => {
    if (report.reported_post) return "Post"
    if (report.reported_comment) return "Comment"
    if (report.reported_user) return "User"
    return "Unknown"
  }

  const getReportContent = (report: Report) => {
    if (report.reported_post) return report.reported_post.content
    if (report.reported_comment) return report.reported_comment.content
    return "User profile"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "resolved":
        return "bg-green-500"
      case "dismissed":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const ReportCard = ({ report }: { report: Report }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
              <Badge variant="outline">{getReportType(report)}</Badge>
            </div>
            <CardTitle className="text-lg">Report #{report.id.slice(0, 8)}</CardTitle>
            <CardDescription>
              Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-semibold">Reason</Label>
          <p className="text-sm text-muted-foreground mt-1">{report.reason}</p>
        </div>

        <div>
          <Label className="text-sm font-semibold">Reported by</Label>
          <div className="flex items-center gap-2 mt-1">
            <Avatar className="h-6 w-6">
              <AvatarImage src={report.reporter.avatar_url || undefined} />
              <AvatarFallback>{report.reporter.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <Link href={`/profile/${report.reporter.username}`} className="text-sm hover:underline">
              @{report.reporter.username}
            </Link>
          </div>
        </div>

        {report.reported_user && (
          <div>
            <Label className="text-sm font-semibold">Reported user</Label>
            <div className="flex items-center gap-2 mt-1">
              <Avatar className="h-6 w-6">
                <AvatarImage src={report.reported_user.avatar_url || undefined} />
                <AvatarFallback>{report.reported_user.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <Link href={`/profile/${report.reported_user.username}`} className="text-sm hover:underline">
                @{report.reported_user.username}
              </Link>
            </div>
          </div>
        )}

        <div>
          <Label className="text-sm font-semibold">Content</Label>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{getReportContent(report)}</p>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <>
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending <Badge className="ml-2">{pendingReports.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved <Badge className="ml-2">{resolvedReports.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="dismissed">
            Dismissed <Badge className="ml-2">{dismissedReports.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingReports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending reports</p>
              </CardContent>
            </Card>
          ) : (
            pendingReports.map((report) => <ReportCard key={report.id} report={report} />)
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedReports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No resolved reports</p>
              </CardContent>
            </Card>
          ) : (
            resolvedReports.map((report) => <ReportCard key={report.id} report={report} />)
          )}
        </TabsContent>

        <TabsContent value="dismissed" className="space-y-4">
          {dismissedReports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No dismissed reports</p>
              </CardContent>
            </Card>
          ) : (
            dismissedReports.map((report) => <ReportCard key={report.id} report={report} />)
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>Review and take action on this report</DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(selectedReport.status)}>{selectedReport.status}</Badge>
                <Badge variant="outline">{getReportType(selectedReport)}</Badge>
              </div>

              <div>
                <Label className="font-semibold">Reason</Label>
                <p className="text-sm mt-1">{selectedReport.reason}</p>
              </div>

              <div>
                <Label className="font-semibold">Reported Content</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{getReportContent(selectedReport)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Reported by</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedReport.reporter.avatar_url || undefined} />
                      <AvatarFallback>{selectedReport.reporter.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedReport.reporter.display_name}</p>
                      <Link
                        href={`/profile/${selectedReport.reporter.username}`}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        @{selectedReport.reporter.username}
                      </Link>
                    </div>
                  </div>
                </div>

                {selectedReport.reported_user && (
                  <div>
                    <Label className="font-semibold">Reported user</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedReport.reported_user.avatar_url || undefined} />
                        <AvatarFallback>{selectedReport.reported_user.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{selectedReport.reported_user.display_name}</p>
                        <Link
                          href={`/profile/${selectedReport.reported_user.username}`}
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          @{selectedReport.reported_user.username}
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedReport.status === "pending" && (
                <div>
                  <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                  <Textarea
                    id="admin-notes"
                    placeholder="Add notes about your decision..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="mt-2"
                  />
                </div>
              )}

              {selectedReport.admin_notes && (
                <div>
                  <Label className="font-semibold">Admin Notes</Label>
                  <p className="text-sm mt-1 text-muted-foreground">{selectedReport.admin_notes}</p>
                </div>
              )}

              {selectedReport.resolved_by_user && (
                <div>
                  <Label className="font-semibold">Resolved by</Label>
                  <p className="text-sm mt-1">
                    @{selectedReport.resolved_by_user.username} on{" "}
                    {selectedReport.resolved_at && new Date(selectedReport.resolved_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedReport?.status === "pending" && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReport(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleResolve(selectedReport.id, "dismissed")}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                Dismiss
              </Button>
              <Button onClick={() => handleResolve(selectedReport.id, "resolved")} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Resolve
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
