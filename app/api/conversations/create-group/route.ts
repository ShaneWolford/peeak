import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, memberIds } = await request.json()

    console.log("[v0] Creating group with name:", name, "and members:", memberIds)

    if (!name || !memberIds || memberIds.length === 0) {
      return NextResponse.json({ error: "Name and members are required" }, { status: 400 })
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        type: "group",
        name,
        created_by: user.id,
      })
      .select()
      .single()

    if (conversationError) {
      console.error("[v0] Error creating conversation:", conversationError)
      throw conversationError
    }

    console.log("[v0] Conversation created:", conversation.id)

    // Add creator as admin
    const members = [
      {
        conversation_id: conversation.id,
        user_id: user.id,
        role: "admin",
      },
    ]

    // Add other members
    memberIds.forEach((memberId: string) => {
      if (memberId !== user.id) {
        members.push({
          conversation_id: conversation.id,
          user_id: memberId,
          role: "member",
        })
      }
    })

    console.log("[v0] Adding members:", members)

    const { error: membersError } = await supabase.from("conversation_members").insert(members)

    if (membersError) {
      console.error("[v0] Error adding members:", membersError)
      throw membersError
    }

    console.log("[v0] Members added successfully")

    // Create notifications for added members
    const notifications = memberIds
      .filter((id: string) => id !== user.id)
      .map((memberId: string) => ({
        user_id: memberId,
        type: "message",
        actor_id: user.id,
      }))

    if (notifications.length > 0) {
      const { error: notifError } = await supabase.from("notifications").insert(notifications)
      if (notifError) {
        console.error("[v0] Error creating notifications:", notifError)
      }
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("[v0] Error creating group:", error)
    return NextResponse.json(
      {
        error: "Failed to create group",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
