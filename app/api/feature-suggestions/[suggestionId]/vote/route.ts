import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ suggestionId: string }> }) {
  try {
    const { suggestionId } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from("feature_suggestion_votes")
      .select("id")
      .eq("suggestion_id", suggestionId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existingVote) {
      // Remove vote
      const { error: deleteError } = await supabase.from("feature_suggestion_votes").delete().eq("id", existingVote.id)

      if (deleteError) {
        console.error("Error removing vote:", deleteError)
        return NextResponse.json({ error: "Failed to remove vote" }, { status: 500 })
      }

      // Decrement vote count
      const { error: updateError } = await supabase.rpc("decrement_suggestion_votes", {
        suggestion_id: suggestionId,
      })

      if (updateError) {
        console.error("Error decrementing votes:", updateError)
      }

      return NextResponse.json({ voted: false })
    } else {
      // Add vote
      const { error: insertError } = await supabase.from("feature_suggestion_votes").insert({
        suggestion_id: suggestionId,
        user_id: user.id,
      })

      if (insertError) {
        console.error("Error adding vote:", insertError)
        return NextResponse.json({ error: "Failed to add vote" }, { status: 500 })
      }

      // Increment vote count
      const { error: updateError } = await supabase.rpc("increment_suggestion_votes", {
        suggestion_id: suggestionId,
      })

      if (updateError) {
        console.error("Error incrementing votes:", updateError)
      }

      return NextResponse.json({ voted: true })
    }
  } catch (error) {
    console.error("Error in vote toggle:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
