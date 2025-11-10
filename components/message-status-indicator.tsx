import { CheckCheck, Clock } from "lucide-react"

interface MessageStatusIndicatorProps {
  status: "sent" | "delivered" | "read"
  className?: string
}

export function MessageStatusIndicator({ status, className = "" }: MessageStatusIndicatorProps) {
  if (status === "read") {
    return <CheckCheck className={`h-4 w-4 text-blue-500 ${className}`} />
  }

  if (status === "delivered") {
    return <CheckCheck className={`h-4 w-4 ${className}`} />
  }

  return <Clock className={`h-4 w-4 ${className}`} />
}
