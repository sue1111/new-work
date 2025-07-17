import { getSupabaseServerClient } from "./supabase/supabase-server"
import type { UserData, GameState, Transaction, Notification } from "./types"

// User-related actions
export async function getUserById(userId: string): Promise<UserData | null> {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

  if (error || !data) {
    console.error("Error fetching user:", error)
    return null
  }

  return {
    id: data.id,
    username: data.username,
    balance: data.balance,
    avatar: data.avatar,
    gamesPlayed: data.games_played,
    gamesWon: data.games_won,
    walletAddress: data.wallet_address || undefined,
    isAdmin: data.is_admin,
    status: data.status as "active" | "banned" | "pending",
    createdAt: data.created_at,
    lastLogin: data.last_login || undefined,
  }
}

export async function createUser(userData: Omit<UserData, "id" | "createdAt">): Promise<UserData | null> {
  const supabase = getSupabaseServerClient()

  // Generate a unique ID for the user if not provided
  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  // Ensure all required fields are present with default values
  const userToCreate = {
    id: userId,
    username: userData.username,
    balance: userData.balance || 0,
    avatar: userData.avatar || null,
    games_played: userData.gamesPlayed || 0,
    games_won: userData.gamesWon || 0,
    wallet_address: userData.walletAddress || null,
    is_admin: userData.isAdmin || false,
    status: userData.status || "active",
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
  }

  // Log the user creation attempt
  console.log("Attempting to create user:", userToCreate)

  const { data, error } = await supabase.from("users").insert(userToCreate).select().single()

  if (error) {
    console.error("Error creating user:", error)
    return null
  }

  if (!data) {
    console.error("No data returned after user creation")
    return null
  }

  return {
    id: data.id,
    username: data.username,
    balance: data.balance,
    avatar: data.avatar,
    gamesPlayed: data.games_played,
    gamesWon: data.games_won,
    walletAddress: data.wallet_address || undefined,
    isAdmin: data.is_admin,
    status: data.status as "active" | "banned" | "pending",
    createdAt: data.created_at,
    lastLogin: data.last_login || undefined,
  }
}

export async function updateUserBalance(userId: string, amount: number): Promise<boolean> {
  const supabase = getSupabaseServerClient()

  const { data: user, error: fetchError } = await supabase.from("users").select("balance").eq("id", userId).single()

  if (fetchError || !user) {
    console.error("Error fetching user balance:", fetchError)
    return false
  }

  const newBalance = user.balance + amount

  const { error: updateError } = await supabase.from("users").update({ balance: newBalance }).eq("id", userId)

  if (updateError) {
    console.error("Error updating user balance:", updateError)
    return false
  }

  return true
}

// Game-related actions
export async function createGame(gameData: Omit<GameState, "id" | "createdAt">): Promise<GameState | null> {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from("games")
    .insert({
      board: gameData.board,
      current_player: gameData.currentPlayer,
      player_x: gameData.players.X.id,
      player_o: gameData.players.O?.id || null,
      status: gameData.status,
      bet_amount: gameData.betAmount,
      pot: gameData.pot,
      winner: gameData.winner,
    })
    .select()
    .single()

  if (error || !data) {
    console.error("Error creating game:", error)
    return null
  }

  // Fetch player information
  const { data: playerX } = await supabase.from("users").select("username, avatar").eq("id", data.player_x).single()

  let playerO = null
  if (data.player_o) {
    const { data: playerOData } = await supabase
      .from("users")
      .select("username, avatar")
      .eq("id", data.player_o)
      .single()

    playerO = playerOData
  }

  return {
    id: data.id,
    board: data.board as (string | null)[],
    currentPlayer: data.current_player as "X" | "O",
    players: {
      X: {
        id: data.player_x!,
        username: playerX?.username || "Unknown",
        avatar: playerX?.avatar,
      },
      O: playerO
        ? {
            id: data.player_o!,
            username: playerO.username,
            avatar: playerO.avatar,
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
}

// Transaction-related actions
export async function createTransaction(
  transactionData: Omit<Transaction, "id" | "createdAt" | "completedAt">,
): Promise<Transaction | null> {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: transactionData.userId,
      type: transactionData.type,
      amount: transactionData.amount,
      currency: transactionData.currency,
      status: transactionData.status,
      wallet_address: transactionData.walletAddress || null,
      tx_hash: transactionData.txHash || null,
    })
    .select()
    .single()

  if (error || !data) {
    console.error("Error creating transaction:", error)
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    type: data.type as "deposit" | "withdrawal" | "bet" | "win" | "refund",
    amount: data.amount,
    currency: data.currency,
    status: data.status as "pending" | "completed" | "failed",
    walletAddress: data.wallet_address || undefined,
    txHash: data.tx_hash || undefined,
    createdAt: data.created_at,
    completedAt: data.completed_at || undefined,
  }
}

// Notification-related actions
export async function createNotification(
  notificationData: Omit<Notification, "id" | "createdAt">,
): Promise<Notification | null> {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      type: notificationData.type,
      user_id: notificationData.userId,
      amount: notificationData.amount || null,
      status: notificationData.status,
      message: notificationData.message,
    })
    .select()
    .single()

  if (error || !data) {
    console.error("Error creating notification:", error)
    return null
  }

  return {
    id: data.id,
    type: data.type as "deposit_request" | "withdrawal_request" | "system",
    userId: data.user_id,
    username: "", // This will be filled in by the client
    amount: data.amount || undefined,
    status: data.status as "pending" | "approved" | "rejected",
    message: data.message,
    createdAt: data.created_at,
  }
}

// Settings-related actions
export async function getSystemSettings() {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from("system_settings")
    .select("*")
    .order("id", { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    console.error("Error fetching system settings:", error)
    return null
  }

  return {
    platformFee: data.platform_fee,
    minBet: data.min_bet,
    maxBet: data.max_bet,
    minWithdrawal: data.min_withdrawal,
    maintenanceMode: data.maintenance_mode,
    depositWalletAddress: data.deposit_wallet_address,
    platformFeeVsBot: data.platform_fee_vs_bot,
    platformFeeVsPlayer: data.platform_fee_vs_player,
  }
}

export async function getGameSettings() {
  const supabase = getSupabaseServerClient()

  const { data, error } = await supabase
    .from("game_settings")
    .select("*")
    .order("id", { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    console.error("Error fetching game settings:", error)
    return null
  }

  return {
    botWinProbability: data.bot_win_probability,
  }
}
