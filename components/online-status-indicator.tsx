interface OnlineStatusIndicatorProps {
  isOnline: boolean
  showOnlineStatus: boolean
  lastSeen?: string | null
  className?: string
}

export function OnlineStatusIndicator({
  isOnline,
  showOnlineStatus,
  lastSeen,
  className = "",
}: OnlineStatusIndicatorProps) {
  if (!showOnlineStatus) return null

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
      {!isOnline && lastSeen && (
        <span className="text-xs text-muted-foreground">Last seen {new Date(lastSeen).toLocaleString()}</span>
      )}
    </div>
  )
}
