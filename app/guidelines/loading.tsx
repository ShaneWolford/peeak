import { Skeleton } from "@/components/ui/skeleton"

export default function GuidelinesLoading() {
  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-5/6" />
      <div className="space-y-4 pt-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
