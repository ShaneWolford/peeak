import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { PostCard } from "@/components/post-card"
import { CommentSection } from "@/components/comment-section"
import type { Post, Profile } from "@/lib/types"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postId: string }>
}): Promise<Metadata> {
  const supabase = await createClient()
  const { postId } = await params

  const { data: post } = await supabase
    .from("posts")
    .select(`
      *,
      profiles!posts_author_id_fkey (*)
    `)
    .eq("id", postId)
    .eq("is_deleted", false)
    .single()

  if (!post) {
    return {
      title: "Post Not Found - Peeak",
      description: "Share the Peeak moments of life",
    }
  }

  const author = post.profiles as Profile

  let description = post.content?.trim() || ""
  if (description.length > 160) {
    description = description.slice(0, 157) + "..."
  }
  if (!description) {
    description = "Share the Peeak moments of life"
  }

  const getAbsoluteUrl = (url: string | null | undefined) => {
    if (!url) return "https://app.peeak.org/placeholder.svg?height=630&width=1200"
    if (url.startsWith("http")) return url
    return `https://app.peeak.org${url}`
  }

  const imageUrl = getAbsoluteUrl(post.media_urls?.[0] || author.avatar_url)
  const postUrl = `https://app.peeak.org/post/${postId}`

  return {
    title: `${author.display_name} (@${author.username}) on Peeak - Social`,
    description,
    openGraph: {
      title: `${author.display_name} on Peeak - Social`,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Post by ${author.display_name}`,
        },
      ],
      type: "article",
      authors: [author.display_name],
      publishedTime: post.created_at,
      url: postUrl,
      siteName: "Peeak - Social",
    },
    twitter: {
      card: "summary_large_image",
      title: `${author.display_name} on Peeak - Social`,
      description,
      images: [imageUrl],
      creator: `@${author.username}`,
      site: "@peeak",
    },
    alternates: {
      canonical: postUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  const { postId } = await params

  // Fetch post with author profile
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select(`
      *,
      profiles!posts_author_id_fkey (*)
    `)
    .eq("id", postId)
    .eq("is_deleted", false)
    .single()

  if (postError || !post) {
    notFound()
  }

  // Fetch engagement counts
  const [likesResult, commentsResult, sharesResult, repostsResult, userLikeResult, userRepostResult, followResult] =
    await Promise.all([
      supabase.from("likes").select("id", { count: "exact", head: true }).eq("post_id", post.id),
      supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("post_id", post.id)
        .eq("is_deleted", false),
      supabase.from("shares").select("id", { count: "exact", head: true }).eq("post_id", post.id),
      supabase.from("reposts").select("id", { count: "exact", head: true }).eq("post_id", post.id),
      supabase.from("likes").select("id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle(),
      supabase.from("reposts").select("id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle(),
      supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", post.author_id).maybeSingle(),
    ])

  const postWithEngagement = {
    ...post,
    likes_count: likesResult.count || 0,
    comments_count: commentsResult.count || 0,
    shares_count: sharesResult.count || 0,
    reposts_count: repostsResult.count || 0,
    is_liked: !!userLikeResult.data,
    is_reposted: !!userRepostResult.data,
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-16 pb-20 md:pb-6 md:pl-60 md:pt-0">
        <div className="max-w-2xl mx-auto">
          <div className="border-b border-border">
            <PostCard
              post={postWithEngagement as Post & { profiles: Profile }}
              currentUserId={user.id}
              isFollowing={!!followResult.data}
            />
          </div>
          <CommentSection postId={postId} currentUserId={user.id} />
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
