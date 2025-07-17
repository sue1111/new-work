"use client"

import { useState } from "react"
import { Plus, RefreshCw, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { UserData } from "@/lib/types"
import { useMobile } from "@/hooks/use-mobile"

interface HomeScreenProps {
  onCreateGame: (betAmount: number) => void
  onNavigate: (screen: "home" | "game" | "profile" | "lobby" | "leaderboard") => void
  userData: UserData | null
  onAdminRequest: () => void
}

export default function HomeScreen({ onCreateGame, onNavigate, userData, onAdminRequest }: HomeScreenProps) {
  const [betAmount, setBetAmount] = useState(10)
  const [showBetModal, setShowBetModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const { isMobile, isIOS } = useMobile()

  const handleCreateGame = () => {
    if (!userData) {
      alert("Пожалуйста, войдите в систему, чтобы играть")
      return
    }

    if (userData.balance < betAmount) {
      setShowDepositModal(true)
      return
    }

    onCreateGame(betAmount)
  }

  const betOptions = [5, 10, 25, 50, 100]

  return (
    <div
      className={`flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 ${isIOS ? "safe-area-top" : ""}`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-10 border-b border-gray-200 bg-white/80 p-4 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/80 ${isIOS ? "pt-safe" : ""}`}
      >
        {userData && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-3 shadow-md dark:bg-gray-800">
            <div className="flex items-center">
              {userData.avatar ? (
                <img
                  src={userData.avatar || "/placeholder.svg"}
                  alt={userData.username}
                  className="h-10 w-10 rounded-full border border-gray-100 dark:border-gray-700"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                  {userData.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="ml-2 font-medium dark:text-white">{userData.username}</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Balance</div>
              <div className="font-bold text-primary">${userData.balance.toFixed(2)}</div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
        <div className="grid w-full max-w-md gap-4 mx-auto">
          <Card className="overflow-hidden border-0 shadow-lg transition-all hover:shadow-xl dark:bg-gray-800">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-white">
              <h3 className="text-lg font-semibold">Create New Game</h3>
            </div>
            <div className="p-4">
              <Button
                className="w-full bg-primary text-white hover:bg-primary/90 py-3 touch-manipulation"
                onClick={() => setShowBetModal(true)}
              >
                <Plus className="mr-2 h-5 w-5" />
                New Game
              </Button>
            </div>
          </Card>

          <Card className="overflow-hidden border-0 shadow-lg transition-all hover:shadow-xl dark:bg-gray-800">
            <div className="bg-gray-900 p-4 text-white">
              <h3 className="text-lg font-semibold">Find Opponent</h3>
            </div>
            <div className="p-4">
              <Button className="w-full bg-gray-900 text-white hover:bg-gray-800" onClick={() => onNavigate("lobby")}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Find Match
              </Button>
            </div>
          </Card>

          <Card className="overflow-hidden border-0 shadow-lg transition-all hover:shadow-xl dark:bg-gray-800">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
              <h3 className="text-lg font-semibold">Leaderboard</h3>
            </div>
            <div className="p-4">
              <Button
                className="w-full bg-amber-500 text-white hover:bg-amber-600"
                onClick={() => onNavigate("leaderboard")}
              >
                <Trophy className="mr-2 h-4 w-4" />
                View Top Players
              </Button>
            </div>
          </Card>
        </div>
      </main>

      {/* Bet Modal */}
      {showBetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <Card className="w-full max-w-sm mx-4 border-0 shadow-2xl animate-fade-in dark:bg-gray-800">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-white">
              <h3 className="text-lg font-semibold">Set Bet Amount</h3>
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
                      className={`flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold transition-all touch-manipulation ${
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
                  onClick={() => setShowBetModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-primary text-white hover:bg-primary/90"
                  onClick={() => {
                    setShowBetModal(false)
                    handleCreateGame()
                  }}
                >
                  Start Game
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <Card className="w-full max-w-sm border-0 shadow-2xl animate-fade-in dark:bg-gray-800">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-white">
              <h3 className="text-lg font-semibold">Insufficient Funds</h3>
            </div>
            <div className="p-4">
              <p className="mb-4 text-gray-600 dark:text-gray-300">
                You don't have enough funds to place a bet of ${betAmount}. Current balance: $
                {userData?.balance.toFixed(2)}
              </p>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  className="border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => setShowDepositModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-primary text-white hover:bg-primary/90"
                  onClick={() => {
                    setShowDepositModal(false)
                    onNavigate("profile")
                  }}
                >
                  Add Funds
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
