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

    let query = supabase
      .from("games")
      .select(`
        *,
        player_x:users!games_player_x_fkey(id, username, avatar),
        player_o:users!games_player_o_fkey(id, username, avatar)
      `)
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(`id.ilike.%${search}%,player_x.username.ilike.%${search}%,player_o.username.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching games:", error)
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
    }

    // Transform data to match the GameState type
    const games = data.map((item) => ({
      id: item.id,
      board: item.board as (string | null)[],
      currentPlayer: item.current_player as "X" | "O",
      players: {
        X: {
          id: item.player_x.id,
          username: item.player_x.username,
          avatar: item.player_x.avatar,
        },
        O: item.player_o
          ? {
              id: item.player_o.id,
              username: item.player_o.username,
              avatar: item.player_o.avatar,
            }
          : undefined,
      },
      status: item.status as "playing" | "completed" | "draw",
      betAmount: item.bet_amount,
      pot: item.pot,
      winner: item.winner as string | null,
      createdAt: item.created_at,
      endedAt: item.ended_at || undefined,
    }))

    // Add cache control headers to prevent caching
    const response = NextResponse.json(games)
    response.headers.set("Cache-Control", "no-store, max-age=0")
    return response
  } catch (error) {
    console.error("Error fetching games:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
