import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { updateUserBalance } from "@/lib/db-actions"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const gameId = params.id

    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    const { data, error } = await supabase
      .from("games")
      .select(`
        *,
        player_x:users!games_player_x_fkey(id, username, avatar),
        player_o:users!games_player_o_fkey(id, username, avatar)
      `)
      .eq("id", gameId)
      .single()

    if (error || !data) {
      console.error("Error fetching game:", error)
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Transform data to match the GameState type
    const game = {
      id: data.id,
      board: data.board as (string | null)[],
      currentPlayer: data.current_player as "X" | "O",
      players: {
        X: {
          id: data.player_x.id,
          username: data.player_x.username,
          avatar: data.player_x.avatar,
        },
        O: data.player_o
          ? {
              id: data.player_o.id,
              username: data.player_o.username,
              avatar: data.player_o.avatar,
            }
          : {
              id: "",
              username: "",
              avatar: null,
            },
      },
      status: data.status as "playing" | "completed" | "draw",
      betAmount: data.bet_amount,
      pot: data.pot,
      winner: data.winner as string | null,
      createdAt: data.created_at,
      endedAt: data.ended_at || undefined,
    }

    return NextResponse.json(game)
  } catch (error) {
    console.error("Error fetching game:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const gameId = params.id
    const updates = await request.json()

    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Get current game state
    const { data: currentGame, error: fetchError } = await supabase.from("games").select("*").eq("id", gameId).single()

    if (fetchError || !currentGame) {
      console.error("Error fetching game:", fetchError)
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Prepare updates
    const dbUpdates: Record<string, any> = {}

    if ("board" in updates) dbUpdates.board = updates.board
    if ("currentPlayer" in updates) dbUpdates.current_player = updates.currentPlayer
    if ("status" in updates) dbUpdates.status = updates.status
    if ("pot" in updates) dbUpdates.pot = updates.pot
    if ("winner" in updates) dbUpdates.winner = updates.winner

    // If game is ending, add ended_at timestamp
    if (updates.status === "completed" || updates.status === "draw") {
      dbUpdates.ended_at = new Date().toISOString()

      // Handle payouts if game is completed
      if (updates.status === "completed" && updates.winner) {
        const winnerId = updates.winner === "X" ? currentGame.player_x : currentGame.player_o

        if (winnerId) {
          // Winner gets 80% of the pot (20% platform fee)
          const winnings = currentGame.pot * 0.8
          await updateUserBalance(winnerId, winnings)

          // Update games won count
          await supabase
            .from("users")
            .update({
              games_won: supabase.rpc("increment", { x: 1 }),
              games_played: supabase.rpc("increment", { x: 1 }),
            })
            .eq("id", winnerId)

          // Update games played count for loser
          const loserId = updates.winner === "X" ? currentGame.player_o : currentGame.player_x
          if (loserId) {
            await supabase
              .from("users")
              .update({
                games_played: supabase.rpc("increment", { x: 1 }),
              })
              .eq("id", loserId)
          }
        }
      } else if (updates.status === "draw") {
        // In case of draw, return bets to both players
        if (currentGame.player_x) {
          await updateUserBalance(currentGame.player_x, currentGame.pot / 2)
        }

        if (currentGame.player_o) {
          await updateUserBalance(currentGame.player_o, currentGame.pot / 2)
        }

        // Update games played count for both players
        await supabase
          .from("users")
          .update({
            games_played: supabase.rpc("increment", { x: 1 }),
          })
          .in("id", [currentGame.player_x, currentGame.player_o].filter(Boolean))
      }
    }

    // Update game
    const { error: updateError } = await supabase.from("games").update(dbUpdates).eq("id", gameId)

    if (updateError) {
      console.error("Error updating game:", updateError)
      return NextResponse.json({ error: "Failed to update game" }, { status: 500 })
    }

    // Get updated game with player info
    const { data: updatedGame, error: fetchUpdatedError } = await supabase
      .from("games")
      .select(`
        *,
        player_x:users!games_player_x_fkey(id, username, avatar),
        player_o:users!games_player_o_fkey(id, username, avatar)
      `)
      .eq("id", gameId)
      .single()

    if (fetchUpdatedError || !updatedGame) {
      console.error("Error fetching updated game:", fetchUpdatedError)
      return NextResponse.json({ error: "Failed to fetch updated game" }, { status: 500 })
    }

    // Transform data to match the GameState type
    const game = {
      id: updatedGame.id,
      board: updatedGame.board as (string | null)[],
      currentPlayer: updatedGame.current_player as "X" | "O",
      players: {
        X: {
          id: updatedGame.player_x.id,
          username: updatedGame.player_x.username,
          avatar: updatedGame.player_x.avatar,
        },
        O: updatedGame.player_o
          ? {
              id: updatedGame.player_o.id,
              username: updatedGame.player_o.username,
              avatar: updatedGame.player_o.avatar,
            }
          : {
              id: "",
              username: "",
              avatar: null,
            },
      },
      status: updatedGame.status as "playing" | "completed" | "draw",
      betAmount: updatedGame.bet_amount,
      pot: updatedGame.pot,
      winner: updatedGame.winner as string | null,
      createdAt: updatedGame.created_at,
      endedAt: updatedGame.ended_at || undefined,
    }

    return NextResponse.json(game)
  } catch (error) {
    console.error("Error updating game:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
