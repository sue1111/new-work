import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { getSystemSettings, getGameSettings } from "@/lib/db-actions"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "system"
    const adminId = searchParams.get("adminId")

    // Log the request for debugging
    console.log(`Settings request - type: ${type}, adminId: ${adminId || "not provided"}`)

    if (type === "system") {
      const settings = await getSystemSettings()

      if (!settings) {
        // Return default system settings if none found
        return NextResponse.json({
          platformFee: 5,
          minBet: 1,
          maxBet: 100,
          minWithdrawal: 10,
          maintenanceMode: false,
          depositWalletAddress: "",
          platformFeeVsBot: 5,
          platformFeeVsPlayer: 2,
        })
      }

      return NextResponse.json(settings)
    } else if (type === "game") {
      const settings = await getGameSettings()

      if (!settings) {
        // Return default game settings if none found
        return NextResponse.json({
          botWinProbability: 0.5,
          settings: {
            minBet: 1,
            maxBet: 100,
            platformFeePercent: 5,
            enableTournaments: true,
            enableRankings: true,
            maxPlayersPerGame: 2,
            defaultTimeLimit: 30,
          },
        })
      }

      // For admin game settings, include the additional settings object
      if (adminId) {
        return NextResponse.json({
          ...settings,
          settings: {
            minBet: 1,
            maxBet: 100,
            platformFeePercent: 5,
            enableTournaments: true,
            enableRankings: true,
            maxPlayersPerGame: 2,
            defaultTimeLimit: 30,
          },
        })
      }

      return NextResponse.json(settings)
    } else {
      return NextResponse.json({ error: "Invalid settings type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { type, ...updates } = await request.json()

    if (!type) {
      return NextResponse.json({ error: "Settings type is required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    if (type === "system") {
      // Convert from camelCase to snake_case for database
      const dbUpdates: Record<string, any> = {}

      if ("platformFee" in updates) dbUpdates.platform_fee = updates.platformFee
      if ("minBet" in updates) dbUpdates.min_bet = updates.minBet
      if ("maxBet" in updates) dbUpdates.max_bet = updates.maxBet
      if ("minWithdrawal" in updates) dbUpdates.min_withdrawal = updates.minWithdrawal
      if ("maintenanceMode" in updates) dbUpdates.maintenance_mode = updates.maintenanceMode
      if ("depositWalletAddress" in updates) dbUpdates.deposit_wallet_address = updates.depositWalletAddress
      if ("platformFeeVsBot" in updates) dbUpdates.platform_fee_vs_bot = updates.platformFeeVsBot
      if ("platformFeeVsPlayer" in updates) dbUpdates.platform_fee_vs_player = updates.platformFeeVsPlayer

      dbUpdates.updated_at = new Date().toISOString()

      // Log the update operation for debugging
      console.log("Updating system settings with:", dbUpdates)

      // Use upsert instead of update to handle cases where the row might not exist
      const { data, error } = await supabase
        .from("system_settings")
        .upsert({ id: 1, ...dbUpdates })
        .select()

      if (error) {
        console.error("Error updating system settings:", error)
        return NextResponse.json({ error: "Failed to update system settings", details: error }, { status: 500 })
      }

      console.log("Settings updated successfully:", data)
    } else if (type === "game") {
      // Convert from camelCase to snake_case for database
      const dbUpdates: Record<string, any> = {}

      if ("botWinProbability" in updates) dbUpdates.bot_win_probability = updates.botWinProbability

      dbUpdates.updated_at = new Date().toISOString()

      // Log the update operation for debugging
      console.log("Updating game settings with:", dbUpdates)

      // Use upsert instead of update to handle cases where the row might not exist
      const { data, error } = await supabase
        .from("game_settings")
        .upsert({ id: 1, ...dbUpdates })
        .select()

      if (error) {
        console.error("Error updating game settings:", error)
        return NextResponse.json({ error: "Failed to update game settings", details: error }, { status: 500 })
      }

      console.log("Game settings updated successfully:", data)
    } else {
      return NextResponse.json({ error: "Invalid settings type" }, { status: 400 })
    }

    // Return updated settings
    if (type === "system") {
      const settings = await getSystemSettings()
      if (!settings) {
        return NextResponse.json({ error: "Failed to fetch updated system settings" }, { status: 500 })
      }
      return NextResponse.json(settings)
    } else {
      const settings = await getGameSettings()
      if (!settings) {
        return NextResponse.json({ error: "Failed to fetch updated game settings" }, { status: 500 })
      }
      return NextResponse.json(settings)
    }
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
