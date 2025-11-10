import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("*")
      .eq("post_id", postId)
      .maybeSingle()

    if (pollError) {
      console.error("Error fetching poll:", pollError)
      return NextResponse.json({ error: "Failed to fetch poll" }, { status: 500 })
    }

    if (!poll) {
      return NextResponse.json({ poll: null }, { status: 404 })
    }

    // Get poll options with vote counts
    const { data: options, error: optionsError } = await supabase
      .from("poll_options")
      .select(
        `
        *,
        vote_count:poll_votes(count)
      `,
      )
      .eq("poll_id", poll.id)
      .order("position")

    if (optionsError) throw optionsError

    // Get user's votes if logged in
    let userVotes: string[] = []
    if (user) {
      const { data: votes, error: votesError } = await supabase
        .from("poll_votes")
        .select("option_id")
        .eq("poll_id", poll.id)
        .eq("user_id", user.id)

      if (votesError) throw votesError
      userVotes = votes.map((v) => v.option_id)
    }

    // Calculate total votes
    const totalVotes = options.reduce((sum, opt) => sum + (opt.vote_count?.[0]?.count || 0), 0)

    const formattedOptions = options.map((opt) => ({
      id: opt.id,
      option_text: opt.option_text,
      position: opt.position,
      vote_count: opt.vote_count?.[0]?.count || 0,
    }))

    return NextResponse.json({
      id: poll.id,
      question: poll.question,
      ends_at: poll.ends_at,
      allow_multiple_answers: poll.allow_multiple_answers,
      total_votes: totalVotes,
      options: formattedOptions,
      user_votes: userVotes,
    })
  } catch (error) {
    console.error("Error fetching poll:", error)
    return NextResponse.json({ error: "Failed to fetch poll" }, { status: 500 })
  }
}
