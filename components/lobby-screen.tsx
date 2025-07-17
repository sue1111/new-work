"use client"

import { useState } from "react"
import { ArrowLeft, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { UserData, GameState } from "@/lib/types"

interface LobbyScreenProps {
  onJoinGame: (gameId: string) => void
  onCreateGame: (betAmount: number) => void
  onInvitePlayer: (userId: string, betAmount: number) => void
  onNavigate: (screen: "home" | "game" | "profile" | "lobby" | "leaderboard" | "admin") => void
  userData: UserData | null
  lobbyGames: GameState[]
  onlinePlayers: UserData[]
}

export default function LobbyScreen({
  onJoinGame,
  onCreateGame,
  onInvitePlayer,
  onNavigate,
  userData,
  lobbyGames,
  onlinePlayers,
}: LobbyScreenProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateGameModal, setShowCreateGameModal] = useState(false)
  const [betAmount, setBetAmount] = useState(10)

  const filteredGames = lobbyGames.filter(
    (game) =>
      game.players.X.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredPlayers = onlinePlayers.filter((player) =>
    player.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Проверка баланса перед присоединением к игре
  const handleJoinGame = (game: GameState) => {
    if (!userData) {
      alert("Пожалуйста, войдите в систему, чтобы играть")
      return
    }

    if (userData.balance < game.betAmount) {
      alert(`Недостаточно средств для ставки ${game.betAmount}. Пожалуйста, пополните баланс.`)
      onNavigate("profile")
      return
    }

    onJoinGame(game.id)
  }

  // Проверка баланса перед приглашением игрока
  const handleInvitePlayer = (player: UserData) => {
    if (!userData) {
      alert("Пожалуйста, войдите в систему, чтобы играть")
      return
    }

    if (userData.balance < betAmount) {
      alert(`Недостаточно средств для ставки ${betAmount}. Пожалуйста, пополните баланс.`)
      onNavigate("profile")
      return
    }

    onInvitePlayer(player.id, betAmount)
    alert(`Приглашение отправлено игроку ${player.username}`)
  }

  const betOptions = [5, 10, 25, 50, 100]

  return (
    <div className="flex min-h-screen flex-col bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 p-4 apple-blur">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="text-gray-500" onClick={() => onNavigate("home")}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Game Lobby</h1>
          <Button variant="outline" size="sm" onClick={() => setShowCreateGameModal(true)}>
            Create Table
          </Button>
        </div>

        {/* Search */}
        <div className="mt-4 flex items-center rounded-lg border border-gray-200 bg-gray-50 p-2">
          <Search className="ml-2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search games or players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent text-gray-900 placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </header>

      {/* Active Games */}
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Active Tables</h2>
          <div className="flex items-center text-sm text-primary">
            <Users className="mr-1 h-4 w-4" />
            {filteredGames.length} Tables
          </div>
        </div>

        {filteredGames.length > 0 ? (
          <div className="space-y-3">
            {filteredGames.map((game) => (
              <Card key={game.id} className="overflow-hidden border-0 apple-shadow">
                <div className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium text-gray-900">{game.players.X.username}'s Table</div>
                    <div className="text-sm text-gray-500">Created {new Date(game.createdAt).toLocaleTimeString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Bet Amount</div>
                    <div className="font-bold text-primary">${game.betAmount}</div>
                  </div>
                </div>
                <div className="border-t border-gray-100 bg-gray-50 p-3">
                  <Button className="w-full apple-button" onClick={() => handleJoinGame(game)}>
                    Join Table
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 apple-shadow p-4 text-center text-gray-500">
            No active tables found. Create one to start playing!
          </Card>
        )}
      </div>

      {/* Online Players */}
      <div className="mt-4 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Online Players</h2>
          <div className="flex items-center text-sm text-primary">
            <Users className="mr-1 h-4 w-4" />
            {filteredPlayers.length} Players
          </div>
        </div>

        {filteredPlayers.length > 0 ? (
          <div className="space-y-3">
            {filteredPlayers.map((player) => (
              <Card key={player.id} className="border-0 apple-shadow p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {player.avatar ? (
                      <img
                        src={player.avatar || "/placeholder.svg"}
                        alt={player.username}
                        className="h-10 w-10 rounded-full border border-gray-200"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                        {player.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{player.username}</div>
                      <div className="text-sm text-gray-500">{player.gamesWon} wins</div>
                    </div>
                  </div>
                  <Button size="sm" className="apple-button" onClick={() => handleInvitePlayer(player)}>
                    Invite
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 apple-shadow p-4 text-center text-gray-500">No players found</Card>
        )}
      </div>

      {/* Create Game Modal */}
      {showCreateGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <Card className="w-full max-w-sm border-0 shadow-2xl animate-fade-in dark:bg-gray-800">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-white">
              <h3 className="text-lg font-semibold">Create New Table</h3>
            </div>
            <div className="p-4">
              <p className="mb-4 text-gray-600 dark:text-gray-300">
                Select your bet amount. Winner takes 80% of the pot.
              </p>

              <div className="mb-6">
                <div className="text-center text-2xl font-bold text-primary">${betAmount}</div>
                <div className="mt-4 flex justify-center space-x-2">
                  {betOptions.map((value) => (
                    <button
                      key={value}
                      onClick={() => setBetAmount(value)}
                      className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all ${
                        betAmount === value
                          ? "bg-primary text-white ring-4 ring-primary/20"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      ${value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  className="border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => setShowCreateGameModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-primary text-white hover:bg-primary/90"
                  onClick={() => {
                    if (userData && userData.balance < betAmount) {
                      alert(`Недостаточно средств для ставки ${betAmount}. Пожалуйста, пополните баланс.`)
                      onNavigate("profile")
                      return
                    }
                    onCreateGame(betAmount)
                    setShowCreateGameModal(false)
                  }}
                >
                  Create Table
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
