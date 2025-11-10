import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProLoading() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-14 pb-14 md:pb-6 md:pl-64 md:pt-0 flex justify-center bg-background">
        <div className="flex-1 max-w-[800px] p-6 space-y-8">
          <div className="text-center space-y-4 pt-8">
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-12 w-64 mx-auto" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>

          <Skeleton className="h-48 w-full" />
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
