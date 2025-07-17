"use client"

import { useState, useEffect } from "react"
import { Search, Filter, MoreHorizontal, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { GameState } from "@/lib/types"

export default function AdminGames() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedGame, setSelectedGame] = useState<GameState | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [games, setGames] = useState<GameState[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch games from the database
  const fetchGames = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Construct the API URL with query parameters
      const url = new URL("/api/admin/games", window.location.origin)
      if (statusFilter !== "all") {
        url.searchParams.append("status", statusFilter)
      }
      if (searchQuery) {
        url.searchParams.append("search", searchQuery)
      }

      const response = await fetch(url.toString(), {
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`Error fetching games: ${response.status}`)
      }

      const data = await response.json()
      setGames(data)
    } catch (err) {
      console.error("Failed to fetch games:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch games")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch games on component mount and when filters change
  useEffect(() => {
    fetchGames()

    // Set up auto-refresh interval
    const intervalId = setInterval(fetchGames, 30000) // Refresh every 30 seconds

    return () => clearInterval(intervalId)
  }, [statusFilter, searchQuery])

  const handleViewDetails = (game: GameState) => {
    setSelectedGame(game)
    setShowDetailsDialog(true)
  }

  const filteredGames = games.filter((game) => {
    const matchesSearch =
      game.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.players.X.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (game.players.O?.username && game.players.O.username.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSearch
  })

  return (
    <div>
      <Card className="border-0 apple-shadow">
        <div className="p-4">
          <div className="mb-4 flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <h2 className="text-xl font-bold text-gray-900">Game Management</h2>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 apple-input"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="playing">Playing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="draw">Draw</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchGames} variant="outline" size="sm">
                Refresh
              </Button>
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
            </div>
          )}

          {error && <div className="rounded-md bg-red-50 p-4 text-center text-red-800">{error}</div>}

          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Game ID</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Players</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Bet</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Pot</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Date</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGames.map((game) => (
                    <tr key={game.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-900">{game.id}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{game.players.X.username} (X)</div>
                        <div className="text-gray-900">
                          {game.players.O?.username || "Waiting..."} {game.players.O?.username ? "(O)" : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">${game.betAmount}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">${game.pot}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            game.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : game.status === "playing"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {game.status}
                          {game.winner && ` (${game.winner} won)`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(game.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(game)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && !error && filteredGames.length === 0 && (
            <div className="py-8 text-center text-gray-500">No games found matching your criteria</div>
          )}
        </div>
      </Card>

      {/* Game Details Dialog */}
      {selectedGame && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Game Details</DialogTitle>
              <DialogDescription>Complete information about game {selectedGame.id}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-gray-500">Game ID</div>
                <div className="col-span-2 font-mono text-xs text-gray-900">{selectedGame.id}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-gray-500">Status</div>
                <div className="col-span-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      selectedGame.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : selectedGame.status === "playing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedGame.status}
                    {selectedGame.winner && ` (${selectedGame.winner} won)`}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-gray-500">Player X</div>
                <div className="col-span-2 text-gray-900">
                  {selectedGame.players.X.username} (ID: {selectedGame.players.X.id})
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-gray-500">Player O</div>
                <div className="col-span-2 text-gray-900">
                  {selectedGame.players.O?.username
                    ? `${selectedGame.players.O.username} (ID: ${selectedGame.players.O.id})`
                    : "Waiting for player..."}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-gray-500">Bet Amount</div>
                <div className="col-span-2 text-gray-900">${selectedGame.betAmount}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-gray-500">Total Pot</div>
                <div className="col-span-2 text-gray-900">${selectedGame.pot}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-gray-500">Created</div>
                <div className="col-span-2 text-gray-900">{new Date(selectedGame.createdAt).toLocaleString()}</div>
              </div>
              {selectedGame.endedAt && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm font-medium text-gray-500">Ended</div>
                  <div className="col-span-2 text-gray-900">{new Date(selectedGame.endedAt).toLocaleString()}</div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-gray-500">Game Board</div>
                <div className="col-span-2">
                  <div className="grid grid-cols-3 gap-1">
                    {selectedGame.board.map((cell, index) => (
                      <div
                        key={index}
                        className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-sm font-bold"
                      >
                        {cell || ""}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
