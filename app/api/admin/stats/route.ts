import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { verifyAdmin } from "@/lib/utils/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get("adminId")

    if (!adminId) {
      return NextResponse.json({ error: "Admin ID is required" }, { status: 400 })
    }

    // Verify admin status
    const isAdmin = await verifyAdmin(adminId)

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const supabase = getSupabaseServerClient()

    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })

    if (usersError) {
      console.error("Error fetching users count:", usersError)
      return NextResponse.json({ error: "Failed to fetch users count" }, { status: 500 })
    }

    // Get active users count (users who logged in within the last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: activeUsers, error: activeUsersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gt("last_login", sevenDaysAgo.toISOString())

    if (activeUsersError) {
      console.error("Error fetching active users count:", activeUsersError)
      return NextResponse.json({ error: "Failed to fetch active users count" }, { status: 500 })
    }

    // Get total transactions count
    const { count: totalTransactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })

    if (transactionsError) {
      console.error("Error fetching transactions count:", transactionsError)
      return NextResponse.json({ error: "Failed to fetch transactions count" }, { status: 500 })
    }

    // Get total volume (sum of all completed transactions)
    const { data: volumeData, error: volumeError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("status", "completed")

    if (volumeError) {
      console.error("Error fetching transaction volume:", volumeError)
      return NextResponse.json({ error: "Failed to fetch transaction volume" }, { status: 500 })
    }

    const totalVolume = volumeData.reduce((sum, tx) => sum + tx.amount, 0)

    // Add cache control headers to prevent caching
    const response = NextResponse.json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalTransactions: totalTransactions || 0,
      totalVolume: totalVolume || 0,
    })

    response.headers.set("Cache-Control", "no-store, max-age=0")
    return response
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
