import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Hash, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function TrendingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch trending hashtags
  const { data: hashtags } = await supabase
    .from("hashtags")
    .select("*")
    .order("usage_count", { ascending: false })
    .limit(50)

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Trending Topics</h1>
          <p className="text-muted-foreground">Discover what's popular right now</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Hashtags</CardTitle>
          <CardDescription>Most used hashtags across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {hashtags && hashtags.length > 0 ? (
            <div className="space-y-3">
              {hashtags.map((hashtag, index) => (
                <Link
                  key={hashtag.id}
                  href={`/hashtag/${encodeURIComponent(hashtag.tag)}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors group"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <Hash className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="flex-1">
                    <div className="font-semibold group-hover:text-primary transition-colors">#{hashtag.tag}</div>
                    <div className="text-sm text-muted-foreground">
                      {hashtag.usage_count} {hashtag.usage_count === 1 ? "post" : "posts"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Hash className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No trending hashtags yet</p>
              <p className="text-sm">Be the first to start a trend!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
