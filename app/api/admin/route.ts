import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { verifyAdmin } from "@/lib/utils/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Verify admin status
    const isAdmin = await verifyAdmin(userId)

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get admin stats
    const supabase = getSupabaseServerClient()

    // Get total users
    const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true })

    // Get active users (logged in within the last 24 hours)
    const { count: activeUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gt("last_login", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // Get total games
    const { count: totalGames } = await supabase.from("games").select("*", { count: "exact", head: true })

    // Get total volume
    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount")
      .in("type", ["deposit", "withdrawal", "bet", "win"])

    const totalVolume = transactions?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0

    // Get platform fees (20% of each game pot)
    const { data: completedGames } = await supabase.from("games").select("pot").eq("status", "completed")

    const platformFees = completedGames?.reduce((sum, game) => sum + game.pot * 0.2, 0) || 0

    // Get pending withdrawals
    const { count: pendingWithdrawals } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("type", "withdrawal")
      .eq("status", "pending")

    // Get pending deposits
    const { count: pendingDeposits } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("type", "deposit")
      .eq("status", "pending")

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalGames: totalGames || 0,
      totalVolume,
      platformFees,
      pendingWithdrawals: pendingWithdrawals || 0,
      pendingDeposits: pendingDeposits || 0,
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
