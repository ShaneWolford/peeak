import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: suggestions, error } = await supabase
      .from("feature_suggestions")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching suggestions:", error)
      return NextResponse.json({ error: "Failed to fetch suggestions", details: error.message }, { status: 500 })
    }

    const userIds = [...new Set(suggestions?.map((s) => s.user_id) || [])]
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds)

    const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || [])

    const suggestionsWithVotes = await Promise.all(
      (suggestions || []).map(async (suggestion) => {
        const { count } = await supabase
          .from("feature_suggestion_votes")
          .select("*", { count: "exact", head: true })
          .eq("suggestion_id", suggestion.id)

        return {
          ...suggestion,
          profiles: profilesMap.get(suggestion.user_id) || null,
          voteCount: count || 0,
        }
      }),
    )

    // Check which suggestions the current user has voted on
    const { data: userVotes } = await supabase
      .from("feature_suggestion_votes")
      .select("suggestion_id")
      .eq("user_id", user.id)

    const votedSuggestionIds = new Set(userVotes?.map((v) => v.suggestion_id) || [])

    const suggestionsWithVoteStatus = suggestionsWithVotes.map((s) => ({
      ...s,
      hasVoted: votedSuggestionIds.has(s.id),
    }))

    return NextResponse.json(suggestionsWithVoteStatus)
  } catch (error) {
    console.error("Error in feature suggestions GET:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, category } = await request.json()

    if (!title || !description || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("feature_suggestions")
      .insert({
        user_id: user.id,
        title,
        description,
        category,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating suggestion:", error)
      return NextResponse.json({ error: "Failed to create suggestion" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in feature suggestions POST:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
