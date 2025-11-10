export function TypingIndicator({ displayName }: { displayName: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2">
      <span>{displayName} is typing</span>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  )
}
