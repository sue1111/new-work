"use client"

import { useState, useEffect, useMemo } from "react"
import { ArrowLeft, Search, Trophy, DollarSign, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { LeaderboardPlayer } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface LeaderboardScreenProps {
  onNavigate: (screen: "home" | "game" | "profile" | "lobby" | "leaderboard" | "admin") => void
}

export default function LeaderboardScreen({ onNavigate }: LeaderboardScreenProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("winnings")
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/leaderboard?type=${activeTab}`)
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard data")
        }
        const data = await response.json()
        setLeaderboardData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [activeTab])

  const filteredPlayers = useMemo(() => {
    return leaderboardData.filter((player) => player.username.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [leaderboardData, searchQuery])

  const renderPlayerList = (players: LeaderboardPlayer[], sortBy: "winnings" | "wins") => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )
    }

    if (players.length === 0) {
      return <Card className="border-0 apple-shadow p-4 text-center text-gray-500">No players found</Card>
    }

    const sortedPlayers = [...players].sort((a, b) =>
      sortBy === "winnings" ? b.winnings - a.winnings : b.gamesWon - a.gamesWon,
    )

    return (
      <div className="space-y-3">
        {sortedPlayers.map((player, index) => (
          <Card key={player.id} className="overflow-hidden border-0 apple-shadow">
            <div className="flex items-center p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                <span className="text-sm font-medium">{index + 1}</span>
              </div>
              <div className="ml-3 flex flex-1 items-center">
                {player.avatar ? (
                  <img
                    src={player.avatar || "/placeholder.svg"}
                    alt={player.username}
                    className="h-10 w-10 rounded-full border border-gray-200"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-900">
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="ml-3">
                  <div className="font-medium text-gray-900">{player.username}</div>
                  <div className="text-sm text-gray-500">
                    {sortBy === "winnings" ? `${player.gamesWon} wins` : `$${player.winnings} earned`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">{sortBy === "winnings" ? "Winnings" : "Wins"}</div>
                <div className="flex items-center font-bold text-primary">
                  {sortBy === "winnings" ? (
                    <>
                      <DollarSign className="h-4 w-4" />
                      {player.winnings}
                    </>
                  ) : (
                    <>
                      <Trophy className="mr-1 h-4 w-4" />
                      {player.gamesWon}
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 p-4 apple-blur">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="text-gray-500" onClick={() => onNavigate("home")}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Leaderboard</h1>
          <div className="w-6"></div> {/* Spacer for alignment */}
        </div>

        {/* Search */}
        <div className="mt-4 flex items-center rounded-lg bg-gray-50 p-2 border border-gray-200">
          <Search className="ml-2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent text-gray-900 placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </header>

      {/* Leaderboard Tabs */}
      <div className="p-4">
        <Tabs defaultValue="winnings" onValueChange={(value) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-100">
            <TabsTrigger value="winnings" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Top Winnings
            </TabsTrigger>
            <TabsTrigger value="wins" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Most Wins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="winnings" className="mt-4">
            {renderPlayerList(filteredPlayers, "winnings")}
          </TabsContent>

          <TabsContent value="wins" className="mt-4">
            {renderPlayerList(filteredPlayers, "wins")}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
