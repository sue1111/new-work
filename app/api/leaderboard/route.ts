import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "winnings"
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)

    const supabase = getSupabaseServerClient()

    if (type === "winnings") {
      // Get users with highest winnings (based on transactions)
      const { data, error } = await supabase
        .from("users")
        .select("id, username, avatar, games_played, games_won")
        .order("balance", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Error fetching leaderboard:", error)
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
      }

      // Calculate winnings for each user
      const leaderboard = await Promise.all(
        data.map(async (user) => {
          const { data: transactions } = await supabase
            .from("transactions")
            .select("amount")
            .eq("user_id", user.id)
            .eq("type", "win")

          const winnings = transactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0

          return {
            id: user.id,
            username: user.username,
            gamesWon: user.games_won,
            winnings,
            avatar: user.avatar,
          }
        }),
      )

      // Sort by winnings
      leaderboard.sort((a, b) => b.winnings - a.winnings)

      return NextResponse.json(leaderboard)
    } else if (type === "wins") {
      // Get users with most wins
      const { data, error } = await supabase
        .from("users")
        .select("id, username, avatar, games_played, games_won, balance")
        .order("games_won", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Error fetching leaderboard:", error)
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
      }

      const leaderboard = data.map((user) => ({
        id: user.id,
        username: user.username,
        gamesWon: user.games_won,
        winnings: user.balance,
        avatar: user.avatar,
      }))

      return NextResponse.json(leaderboard)
    } else {
      return NextResponse.json({ error: "Invalid leaderboard type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
