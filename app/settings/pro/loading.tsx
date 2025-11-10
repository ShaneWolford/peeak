import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
      <MobileBottomNav />
    </>
  )
}
