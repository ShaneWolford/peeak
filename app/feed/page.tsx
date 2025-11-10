import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { FeedComposer } from "@/components/feed-composer"
import { InfiniteFeed } from "@/components/infinite-feed"
import type { Post, Profile } from "@/lib/types"

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  const isAdmin = profile?.is_admin || false

  const postsQuery = supabase
    .from("posts")
    .select(
      `
      *,
      profiles!posts_author_id_fkey (
        *,
        active_badge:badges!profiles_active_badge_id_fkey (
          id,
          name,
          description,
          icon_url,
          color
        )
      )
    `,
    )
    .eq("is_deleted", false)

  const { data: posts, error: postsError } = await postsQuery.order("created_at", { ascending: false }).limit(10)

  if (postsError) {
    console.error("Error fetching posts:", postsError)
  }

  const sortedPosts = (posts || []).sort((a, b) => {
    const aIsPro = a.profiles?.is_pro || false
    const bIsPro = b.profiles?.is_pro || false
    const aTime = new Date(a.created_at).getTime() + (aIsPro ? 5 * 60 * 1000 : 0)
    const bTime = new Date(b.created_at).getTime() + (bIsPro ? 5 * 60 * 1000 : 0)
    return bTime - aTime
  })

  const postIds = sortedPosts.map((p) => p.id)
  const authorIds = sortedPosts.map((p) => p.author_id)

  const [likesData, commentsData, sharesData, repostsData, userLikesData, userRepostsData, followData] =
    await Promise.all([
      supabase.from("likes").select("post_id").in("post_id", postIds),
      supabase.from("comments").select("post_id").eq("is_deleted", false).in("post_id", postIds),
      supabase.from("shares").select("post_id").in("post_id", postIds),
      supabase.from("reposts").select("post_id").in("post_id", postIds),
      supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds),
      supabase.from("reposts").select("post_id").eq("user_id", user.id).in("post_id", postIds),
      supabase.from("follows").select("following_id").eq("follower_id", user.id).in("following_id", authorIds),
    ])

  const likesMap = new Map<string, number>()
  const commentsMap = new Map<string, number>()
  const sharesMap = new Map<string, number>()
  const repostsMap = new Map<string, number>()
  const userLikesSet = new Set(userLikesData.data?.map((l) => l.post_id) || [])
  const userRepostsSet = new Set(userRepostsData.data?.map((r) => r.post_id) || [])
  const followingSet = new Set(followData.data?.map((f) => f.following_id) || [])

  likesData.data?.forEach((like) => {
    likesMap.set(like.post_id, (likesMap.get(like.post_id) || 0) + 1)
  })
  commentsData.data?.forEach((comment) => {
    commentsMap.set(comment.post_id, (commentsMap.get(comment.post_id) || 0) + 1)
  })
  sharesData.data?.forEach((share) => {
    sharesMap.set(share.post_id, (sharesMap.get(share.post_id) || 0) + 1)
  })
  repostsData.data?.forEach((repost) => {
    repostsMap.set(repost.post_id, (repostsMap.get(repost.post_id) || 0) + 1)
  })

  const postsWithEngagement = sortedPosts.map((post) => ({
    ...post,
    likes_count: likesMap.get(post.id) || 0,
    comments_count: commentsMap.get(post.id) || 0,
    shares_count: sharesMap.get(post.id) || 0,
    reposts_count: repostsMap.get(post.id) || 0,
    is_liked: userLikesSet.has(post.id),
    is_reposted: userRepostsSet.has(post.id),
    is_following: followingSet.has(post.author_id),
  }))

  return (
    <>
      <Navigation />
      <main className="mobile-screen md:min-h-screen pt-14 pb-14 md:pb-6 md:pl-64 md:pt-0 flex justify-center bg-background">
        <div className="mobile-content flex-1 max-w-[680px] h-full border-x border-border">
          {profile && <FeedComposer profile={profile} />}

          <InfiniteFeed
            initialPosts={postsWithEngagement as (Post & { profiles: Profile })[]}
            currentUserId={user.id}
            isAdmin={isAdmin}
            filter="all"
          />
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
