import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation, MobileBottomNav } from "@/components/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { PostCard } from "@/components/post-card"
import type { Post, Profile } from "@/lib/types"
import Link from "next/link"
import { Settings, MapPin, LinkIcon, Calendar } from "lucide-react"
import { format } from "date-fns"

export default async function ProfilePage() {
  const supabase = await createClient()

  // 🧠 Fetch user data
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  // 🧠 Fetch profile info
  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profileError || !profile) {
    console.error("Error loading profile:", profileError?.message)
    redirect("/auth/login")
  }

  // 🧠 Fetch user posts
  const { data: posts = [] } = await supabase
    .from("posts")
    .select(`*, profiles!posts_author_id_fkey (*)`)
    .eq("author_id", user.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })

  // 🧠 Follower + following count (optimized parallel fetch)
  const [followersResult, followingResult] = await Promise.all([
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", user.id),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", user.id),
  ])

  const followersCount = followersResult?.count || 0
  const followingCount = followingResult?.count || 0

  // 🧠 Post engagement info
  const postsWithEngagement = await Promise.all(
    posts.map(async (post) => {
      const [likes, comments, shares, userLike] = await Promise.all([
        supabase.from("likes").select("id", { count: "exact", head: true }).eq("post_id", post.id),
        supabase
          .from("comments")
          .select("id", { count: "exact", head: true })
          .eq("post_id", post.id)
          .eq("is_deleted", false),
        supabase.from("shares").select("id", { count: "exact", head: true }).eq("post_id", post.id),
        supabase.from("likes").select("id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle(),
      ])

      return {
        ...post,
        likes_count: likes.count || 0,
        comments_count: comments.count || 0,
        shares_count: shares.count || 0,
        is_liked: !!userLike.data,
      }
    }),
  )

  // 🧠 Create safe initials for fallback avatar
  const initials =
    profile.display_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-16 pb-20 md:pb-6 md:pl-64 md:pt-0">
        <div className="max-w-2xl mx-auto">
          {/* 🔹 Profile Header */}
          <div className="border-b border-border">
            <div className="h-48 bg-muted relative">
              {profile.banner_url ? (
                <img
                  src={profile.banner_url || "/placeholder.svg"}
                  alt="Banner"
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <Avatar className="h-24 w-24 -mt-16 border-4 border-background bg-background">
                  {profile.avatar_url ? (
                    <AvatarImage
                      src={profile.avatar_url || "/placeholder.svg"}
                      alt={profile.display_name || "Profile picture"}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : null}
                  <AvatarFallback className="text-2xl font-medium">{initials}</AvatarFallback>
                </Avatar>

                <Button asChild variant="outline">
                  <Link href="/profile/edit">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-bold">{profile.display_name || "Unnamed User"}</h1>
                {profile.username && <p className="text-muted-foreground">@{profile.username}</p>}
              </div>

              {profile.bio && <p className="text-base leading-relaxed whitespace-pre-line">{profile.bio}</p>}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}

                {profile.website && (
                  <div className="flex items-center gap-1">
                    <LinkIcon className="h-4 w-4" />
                    <a
                      href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-foreground"
                    >
                      {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}

                {profile.created_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {format(new Date(profile.created_at), "MMMM yyyy")}</span>
                  </div>
                )}
              </div>

              {/* 🔹 Stats */}
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-semibold">{followingCount}</span>{" "}
                  <span className="text-muted-foreground">Following</span>
                </div>
                <div>
                  <span className="font-semibold">{followersCount}</span>{" "}
                  <span className="text-muted-foreground">Followers</span>
                </div>
                <div>
                  <span className="font-semibold">{postsWithEngagement.length}</span>{" "}
                  <span className="text-muted-foreground">Posts</span>
                </div>
              </div>
            </div>
          </div>

          {/* 🔹 Posts Section */}
          <div className="divide-y divide-border">
            {postsWithEngagement.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground mb-4">No posts yet</p>
                <Button asChild>
                  <Link href="/feed">Go to feed to create your first post</Link>
                </Button>
              </div>
            ) : (
              postsWithEngagement.map((post) => (
                <PostCard
                  key={post.id}
                  post={post as Post & { profiles: Profile }}
                  currentUserId={user.id}
                  isFollowing={false}
                />
              ))
            )}
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </>
  )
}
