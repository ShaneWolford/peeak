import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { optionIds } = await request.json()

    if (!Array.isArray(optionIds) || optionIds.length === 0) {
      return NextResponse.json({ error: "Invalid option IDs" }, { status: 400 })
    }

    // Get poll
    const { data: poll, error: pollError } = await supabase.from("polls").select("*").eq("post_id", postId).single()

    if (pollError) throw pollError

    // Check if poll has ended
    if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
      return NextResponse.json({ error: "Poll has ended" }, { status: 400 })
    }

    // Delete existing votes if changing vote
    await supabase.from("poll_votes").delete().eq("poll_id", poll.id).eq("user_id", user.id)

    // Validate option limit
    if (!poll.allow_multiple_answers && optionIds.length > 1) {
      return NextResponse.json({ error: "Multiple answers not allowed" }, { status: 400 })
    }

    // Insert new votes
    const votesToInsert = optionIds.map((optionId) => ({
      poll_id: poll.id,
      option_id: optionId,
      user_id: user.id,
    }))

    const { error: voteError } = await supabase.from("poll_votes").insert(votesToInsert)

    if (voteError) throw voteError

    // Fetch updated poll data
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
      user_votes: optionIds,
    })
  } catch (error) {
    console.error("Error voting on poll:", error)
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get poll
    const { data: poll, error: pollError } = await supabase.from("polls").select("*").eq("post_id", postId).single()

    if (pollError) throw pollError

    // Check if poll has ended
    if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
      return NextResponse.json({ error: "Poll has ended" }, { status: 400 })
    }

    // Delete all votes from this user for this poll
    const { error: deleteError } = await supabase
      .from("poll_votes")
      .delete()
      .eq("poll_id", poll.id)
      .eq("user_id", user.id)

    if (deleteError) throw deleteError

    // Fetch updated poll data
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
      user_votes: [],
    })
  } catch (error) {
    console.error("Error removing poll vote:", error)
    return NextResponse.json({ error: "Failed to remove vote" }, { status: 500 })
  }
}
