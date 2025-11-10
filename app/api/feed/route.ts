import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const filter = searchParams.get("filter") || "all"
  const page = Number.parseInt(searchParams.get("page") || "0")
  const limit = Number.parseInt(searchParams.get("limit") || "10")
  const offset = page * limit

  let postsQuery = supabase
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

  if (filter === "following") {
    const { data: followingData } = await supabase.from("follows").select("following_id").eq("follower_id", user.id)
    const followingIds = followingData?.map((f) => f.following_id) || []
    if (followingIds.length > 0) {
      postsQuery = postsQuery.in("author_id", followingIds)
    } else {
      return NextResponse.json({ posts: [], hasMore: false })
    }
  } else if (filter === "pro") {
    const { data: proUsers } = await supabase.from("profiles").select("id").eq("is_pro", true)
    const proUserIds = proUsers?.map((p) => p.id) || []
    if (proUserIds.length > 0) {
      postsQuery = postsQuery.in("author_id", proUserIds)
    } else {
      return NextResponse.json({ posts: [], hasMore: false })
    }
  } else if (filter === "media") {
    postsQuery = postsQuery.not("media_urls", "is", null)
  } else if (filter === "polls") {
    const { data: pollPosts } = await supabase.from("polls").select("post_id")
    const pollPostIds = pollPosts?.map((p) => p.post_id) || []
    if (pollPostIds.length > 0) {
      postsQuery = postsQuery.in("id", pollPostIds)
    } else {
      return NextResponse.json({ posts: [], hasMore: false })
    }
  }

  const { data: posts, error } = await postsQuery
    .order("created_at", { ascending: false })
    .range(offset, offset + limit)

  if (error) {
    console.error("[v0] Error fetching posts:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }

  if (!posts || posts.length === 0) {
    return NextResponse.json({ posts: [], hasMore: false })
  }

  const hasMore = posts.length > limit
  const actualPosts = posts.slice(0, limit)

  const sortedPosts = actualPosts.sort((a, b) => {
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

  const formattedPosts = sortedPosts.map((post) => ({
    ...post,
    likes_count: likesMap.get(post.id) || 0,
    comments_count: commentsMap.get(post.id) || 0,
    shares_count: sharesMap.get(post.id) || 0,
    reposts_count: repostsMap.get(post.id) || 0,
    is_liked: userLikesSet.has(post.id),
    is_reposted: userRepostsSet.has(post.id),
    is_following: followingSet.has(post.author_id),
  }))

  return NextResponse.json({
    posts: formattedPosts,
    hasMore: hasMore,
  })
}
