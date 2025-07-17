import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { getUserById } from "@/lib/db-actions"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const user = await getUserById(userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    const updates = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Convert from camelCase to snake_case for database
    const dbUpdates: Record<string, any> = {}

    if ("balance" in updates) dbUpdates.balance = updates.balance
    if ("avatar" in updates) dbUpdates.avatar = updates.avatar
    if ("gamesPlayed" in updates) dbUpdates.games_played = updates.gamesPlayed
    if ("gamesWon" in updates) dbUpdates.games_won = updates.gamesWon
    if ("walletAddress" in updates) dbUpdates.wallet_address = updates.walletAddress
    if ("status" in updates) dbUpdates.status = updates.status

    const { error } = await supabase.from("users").update(dbUpdates).eq("id", userId)

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    const updatedUser = await getUserById(userId)

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
