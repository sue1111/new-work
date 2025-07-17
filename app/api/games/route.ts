import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { createGame } from "@/lib/db-actions"

export async function POST(request: Request) {
  try {
    const gameData = await request.json()

    if (!gameData.players?.X?.id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const game = await createGame({
      board: Array(9).fill(null),
      currentPlayer: "X",
      players: gameData.players,
      status: gameData.status || "playing",
      betAmount: gameData.betAmount || 10,
      pot: gameData.pot || 0,
      winner: null,
    })

    if (!game) {
      return NextResponse.json({ error: "Failed to create game" }, { status: 500 })
    }

    return NextResponse.json(game)
  } catch (error) {
    console.error("Error creating game:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")

    const supabase = getSupabaseServerClient()

    let query = supabase
      .from("games")
      .select(`
        *,
        player_x:users!games_player_x_fkey(id, username, avatar),
        player_o:users!games_player_o_fkey(id, username, avatar)
      `)
      .order("created_at", { ascending: false })

    if (userId) {
      query = query.or(`player_x.eq.${userId},player_o.eq.${userId}`)
    }

    if (status) {
      query = query.eq("status", status)
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
          : {
              id: "",
              username: "",
              avatar: null,
            },
      },
      status: item.status as "playing" | "completed" | "draw",
      betAmount: item.bet_amount,
      pot: item.pot,
      winner: item.winner as string | null,
      createdAt: item.created_at,
      endedAt: item.ended_at || undefined,
    }))

    return NextResponse.json(games)
  } catch (error) {
    console.error("Error fetching games:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
