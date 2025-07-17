"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Save, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface AdminSettingsProps {
  adminId: string
}

interface SystemSettings {
  platformFee: number
  minBet: number
  maxBet: number
  minWithdrawal: number
  maintenanceMode: boolean
  depositWalletAddress: string
  platformFeeVsBot: number
  platformFeeVsPlayer: number
}

interface GameSettings {
  botWinProbability: number
}

export default function AdminSettings({ adminId }: AdminSettingsProps) {
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingSystem, setIsSavingSystem] = useState(false)
  const [isSavingGame, setIsSavingGame] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch system settings
      const systemResponse = await fetch("/api/settings?type=system", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })

      if (systemResponse.ok) {
        const systemData = await systemResponse.json()
        setSystemSettings(systemData)
      } else {
        const errorData = await systemResponse.json()
        console.error("Failed to fetch system settings:", errorData)
        setError("Failed to fetch system settings. Please try again.")
      }

      // Fetch game settings
      const gameResponse = await fetch("/api/settings?type=game", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      })

      if (gameResponse.ok) {
        const gameData = await gameResponse.json()
        setGameSettings(gameData)
      } else {
        const errorData = await gameResponse.json()
        console.error("Failed to fetch game settings:", errorData)
        setError("Failed to fetch game settings. Please try again.")
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      setError("An error occurred while fetching settings. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const saveSystemSettings = async () => {
    if (!systemSettings) return

    setIsSavingSystem(true)
    setError(null)
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "system",
          ...systemSettings,
        }),
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setSystemSettings(updatedSettings)
        toast({
          title: "Settings saved",
          description: "System settings have been updated successfully.",
        })
      } else {
        const errorData = await response.json()
        console.error("Failed to save system settings:", errorData)
        setError(`Failed to save system settings: ${errorData.error || "Unknown error"}`)
        toast({
          title: "Error",
          description: "Failed to save system settings. See console for details.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving system settings:", error)
      setError("An error occurred while saving system settings.")
      toast({
        title: "Error",
        description: "An error occurred while saving settings.",
        variant: "destructive",
      })
    } finally {
      setIsSavingSystem(false)
    }
  }

  const saveGameSettings = async () => {
    if (!gameSettings) return

    setIsSavingGame(true)
    setError(null)
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "game",
          ...gameSettings,
        }),
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setGameSettings(updatedSettings)
        toast({
          title: "Settings saved",
          description: "Game settings have been updated successfully.",
        })
      } else {
        const errorData = await response.json()
        console.error("Failed to save game settings:", errorData)
        setError(`Failed to save game settings: ${errorData.error || "Unknown error"}`)
        toast({
          title: "Error",
          description: "Failed to save game settings. See console for details.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving game settings:", error)
      setError("An error occurred while saving game settings.")
      toast({
        title: "Error",
        description: "An error occurred while saving settings.",
        variant: "destructive",
      })
    } finally {
      setIsSavingGame(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Configure platform fees, bet limits, and other system settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemSettings && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="platformFee">Platform Fee (%)</Label>
                  <Input
                    id="platformFee"
                    type="number"
                    min="0"
                    max="100"
                    value={systemSettings.platformFee}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        platformFee: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platformFeeVsBot">Platform Fee vs Bot (%)</Label>
                  <Input
                    id="platformFeeVsBot"
                    type="number"
                    min="0"
                    max="100"
                    value={systemSettings.platformFeeVsBot}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        platformFeeVsBot: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platformFeeVsPlayer">Platform Fee vs Player (%)</Label>
                  <Input
                    id="platformFeeVsPlayer"
                    type="number"
                    min="0"
                    max="100"
                    value={systemSettings.platformFeeVsPlayer}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        platformFeeVsPlayer: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minBet">Minimum Bet ($)</Label>
                  <Input
                    id="minBet"
                    type="number"
                    min="0"
                    value={systemSettings.minBet}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        minBet: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxBet">Maximum Bet ($)</Label>
                  <Input
                    id="maxBet"
                    type="number"
                    min="0"
                    value={systemSettings.maxBet}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        maxBet: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minWithdrawal">Minimum Withdrawal ($)</Label>
                  <Input
                    id="minWithdrawal"
                    type="number"
                    min="0"
                    value={systemSettings.minWithdrawal}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        minWithdrawal: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositWalletAddress">Deposit Wallet Address</Label>
                  <Input
                    id="depositWalletAddress"
                    value={systemSettings.depositWalletAddress}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        depositWalletAddress: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="maintenanceMode"
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(checked) =>
                      setSystemSettings({
                        ...systemSettings,
                        maintenanceMode: checked,
                      })
                    }
                  />
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                </div>

                <Button className="w-full mt-4" onClick={saveSystemSettings} disabled={isSavingSystem}>
                  {isSavingSystem ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save System Settings
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Game Settings</CardTitle>
            <CardDescription>Configure game-specific settings and parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {gameSettings && (
              <>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between">
                      <Label htmlFor="botWinProbability">Bot Win Probability</Label>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(gameSettings.botWinProbability * 100)}%
                      </span>
                    </div>
                    <Slider
                      id="botWinProbability"
                      min={0}
                      max={1}
                      step={0.01}
                      value={[gameSettings.botWinProbability]}
                      onValueChange={(value) =>
                        setGameSettings({
                          ...gameSettings,
                          botWinProbability: value[0],
                        })
                      }
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Easy</span>
                      <span>Hard</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-8" onClick={saveGameSettings} disabled={isSavingGame}>
                  {isSavingGame ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Game Settings
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={fetchSettings}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Settings
        </Button>
      </div>
    </div>
  )
}
