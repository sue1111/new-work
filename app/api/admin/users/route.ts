import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { verifyAdmin } from "@/lib/utils/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get("adminId")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    if (!adminId) {
      return NextResponse.json({ error: "Admin ID is required" }, { status: 400 })
    }

    // Verify admin status
    const isAdmin = await verifyAdmin(adminId)

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const supabase = getSupabaseServerClient()

    // Use a more direct query approach to ensure we get the latest data
    // and disable any potential caching
    let query = supabase.from("users").select("*", { count: "exact" }).order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(`username.ilike.%${search}%,id.ilike.%${search}%`)
    }

    // Add cache control to prevent caching
    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    const users = data.map((user) => ({
      id: user.id,
      username: user.username,
      balance: user.balance,
      avatar: user.avatar,
      gamesPlayed: user.games_played,
      gamesWon: user.games_won,
      walletAddress: user.wallet_address || undefined,
      isAdmin: user.is_admin,
      status: user.status,
      createdAt: user.created_at,
      lastLogin: user.last_login || undefined,
    }))

    // Add cache control headers to prevent caching
    const response = NextResponse.json({ users, count })
    response.headers.set("Cache-Control", "no-store, max-age=0")
    return response
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
