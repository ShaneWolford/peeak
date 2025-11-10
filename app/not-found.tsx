import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-6 bg-background">
      <div className="flex flex-col items-center space-y-6 text-center max-w-md">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-foreground">404</h1>
          <h2 className="text-3xl font-semibold text-foreground">Page not found</h2>
          <p className="text-muted-foreground text-lg">
            Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button asChild size="lg" className="gap-2">
            <Link href="/feed">
              <Home className="h-4 w-4" />
              Go to Feed
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 bg-transparent">
            <Link href="/search">
              <Search className="h-4 w-4" />
              Search
            </Link>
          </Button>
        </div>

        <div className="pt-6 text-sm text-muted-foreground">
          <Link href="/" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Return to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
