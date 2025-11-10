import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.id === userId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    // Check if already following
    const { data: existingFollow, error: checkError } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", userId)
      .maybeSingle()

    if (checkError) {
      console.error("[v0] Error checking existing follow:", checkError)
      return NextResponse.json({ error: "Failed to check follow status" }, { status: 500 })
    }

    if (existingFollow) {
      // Unfollow
      const { error } = await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId)

      if (error) {
        console.error("[v0] Error unfollowing:", error)
        return NextResponse.json({ error: "Failed to unfollow" }, { status: 500 })
      }

      return NextResponse.json({ following: false })
    } else {
      // Follow
      const { error: followError } = await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: userId,
      })

      if (followError) {
        console.error("[v0] Error following:", followError)
        return NextResponse.json({ error: "Failed to follow" }, { status: 500 })
      }

      try {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "follow",
          actor_id: user.id,
        })
      } catch (notifError) {
        console.error("[v0] Error creating notification (non-critical):", notifError)
        // Don't fail the follow if notification fails
      }

      // Check for mutual follow
      const { data: mutualFollow, error: mutualError } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", userId)
        .eq("following_id", user.id)
        .maybeSingle()

      if (mutualError) {
        console.error("[v0] Error checking mutual follow:", mutualError)
        // Don't fail the follow if mutual check fails
      } else if (mutualFollow) {
        console.log("[v0] Mutual follow detected, creating/getting conversation")

        try {
          // Use the database function to get or create DM conversation
          const { data: conversationId, error: convError } = await supabase.rpc("get_or_create_dm_conversation", {
            user1_id: user.id,
            user2_id: userId,
          })

          if (convError) {
            console.error("[v0] Error getting/creating conversation:", convError)
          } else if (conversationId) {
            console.log("[v0] Conversation ready:", conversationId)

            // Check if welcome message already exists
            const { data: existingMessages } = await supabase
              .from("messages")
              .select("id")
              .eq("conversation_id", conversationId)
              .limit(1)

            // Only send welcome message if this is a new conversation
            if (!existingMessages || existingMessages.length === 0) {
              // Get both user profiles for the welcome message
              const { data: otherUserProfile } = await supabase
                .from("profiles")
                .select("display_name, username")
                .eq("id", userId)
                .single()

              // Send automated welcome message using new messages table
              const { error: messageError } = await supabase.from("messages").insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content: `🎉 You and ${otherUserProfile?.display_name || otherUserProfile?.username || "this user"} are now connected! Start chatting.`,
              })

              if (messageError) {
                console.error("[v0] Error sending welcome message:", messageError)
              } else {
                console.log("[v0] Welcome message sent")

                // Create notification for the other user
                try {
                  await supabase.from("notifications").insert({
                    user_id: userId,
                    type: "message",
                    actor_id: user.id,
                  })
                } catch (notifError) {
                  console.error("[v0] Error creating message notification:", notifError)
                }
              }
            }
          }
        } catch (dmError) {
          console.error("[v0] Error in DM conversation flow (non-critical):", dmError)
          // Don't fail the follow if DM creation fails
        }
      }

      return NextResponse.json({ following: true })
    }
  } catch (error) {
    console.error("[v0] Error toggling follow:", error)
    return NextResponse.json(
      { error: "Failed to toggle follow", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
