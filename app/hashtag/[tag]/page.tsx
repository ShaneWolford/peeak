import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { PostCard } from "@/components/post-card"
import { Hash } from "lucide-react"

export default async function HashtagPage({ params }: { params: { tag: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const tag = decodeURIComponent(params.tag)

  // Get hashtag info
  const { data: hashtag } = await supabase.from("hashtags").select("*").eq("tag", tag).single()

  if (!hashtag) {
    notFound()
  }

  // Get posts with this hashtag
  const { data: postHashtags } = await supabase
    .from("post_hashtags")
    .select(
      `
      post_id,
      posts (
        *,
        profiles:author_id (*)
      )
    `,
    )
    .eq("hashtag_id", hashtag.id)
    .order("created_at", { ascending: false })

  const posts = postHashtags?.map((ph: any) => ph.posts).filter(Boolean) || []

  // Get current user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="container max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Hash className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">#{tag}</h1>
            <p className="text-sm text-muted-foreground">
              {hashtag.usage_count} {hashtag.usage_count === 1 ? "post" : "posts"}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border">
        {posts.length > 0 ? (
          posts.map((post: any) => <PostCard key={post.id} post={post} currentUserId={user.id} isFollowing={false} />)
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Hash className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>No posts found with this hashtag</p>
          </div>
        )}
      </div>
    </div>
  )
}
