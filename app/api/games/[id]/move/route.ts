import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { calculateWinner } from "@/lib/utils/game"
import { updateUserBalance } from "@/lib/db-actions"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const gameId = params.id
    const { index, userId } = await request.json()

    if (!gameId || index === undefined || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Get current game state
    const { data: game, error: fetchError } = await supabase
      .from("games")
      .select(`
        *,
        player_x:users!games_player_x_fkey(id, username, avatar),
        player_o:users!games_player_o_fkey(id, username, avatar)
      `)
      .eq("id", gameId)
      .single()

    if (fetchError || !game) {
      console.error("Error fetching game:", fetchError)
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Verify it's the player's turn
    const playerSymbol = game.player_x.id === userId ? "X" : "O"

    if (game.current_player !== playerSymbol) {
      return NextResponse.json({ error: "Not your turn" }, { status: 400 })
    }

    // Verify the game is still active
    if (game.status !== "playing") {
      return NextResponse.json({ error: "Game is not active" }, { status: 400 })
    }

    // Verify the cell is empty
    const board = game.board as (string | null)[]
    if (board[index] !== null) {
      return NextResponse.json({ error: "Cell is already filled" }, { status: 400 })
    }

    // Make the move
    board[index] = playerSymbol

    // Check for winner
    const winner = calculateWinner(board)
    let status = game.status
    let nextPlayer = playerSymbol === "X" ? "O" : "X"

    if (winner) {
      status = "completed"
      nextPlayer = game.current_player // Keep current player if game is over
    } else if (!board.includes(null)) {
      status = "draw"
      nextPlayer = game.current_player // Keep current player if game is over
    }

    // Update pot
    const newPot = game.pot + game.bet_amount

    // Update game in database
    const { error: updateError } = await supabase
      .from("games")
      .update({
        board: board,
        current_player: nextPlayer,
        status: status,
        pot: newPot,
        winner: winner,
        ended_at: status !== "playing" ? new Date().toISOString() : null,
      })
      .eq("id", gameId)

    if (updateError) {
      console.error("Error updating game:", updateError)
      return NextResponse.json({ error: "Failed to update game" }, { status: 500 })
    }

    // Handle payouts if game is completed
    if (status === "completed" && winner) {
      const winnerId = winner === "X" ? game.player_x.id : game.player_o.id

      // Winner gets 80% of the pot (20% platform fee)
      const winnings = newPot * 0.8
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
      const loserId = winner === "X" ? game.player_o.id : game.player_x.id
      await supabase
        .from("users")
        .update({
          games_played: supabase.rpc("increment", { x: 1 }),
        })
        .eq("id", loserId)
    } else if (status === "draw") {
      // In case of draw, return bets to both players
      await updateUserBalance(game.player_x.id, newPot / 2)
      await updateUserBalance(game.player_o.id, newPot / 2)

      // Update games played count for both players
      await supabase
        .from("users")
        .update({
          games_played: supabase.rpc("increment", { x: 1 }),
        })
        .in("id", [game.player_x.id, game.player_o.id])
    } else {
      // Deduct bet amount from current player
      await updateUserBalance(userId, -game.bet_amount)
    }

    // Get updated game
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
    const gameState = {
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

    return NextResponse.json(gameState)
  } catch (error) {
    console.error("Error making move:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
