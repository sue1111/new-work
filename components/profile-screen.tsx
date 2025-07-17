"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, ArrowUpRight, Clock, Trophy, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { UserData, Transaction } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ProfileScreenProps {
  userData: UserData
  onNavigate: (screen: "home" | "game" | "profile" | "lobby" | "leaderboard") => void
  onLogout: () => void
}

export default function ProfileScreen({ userData, onNavigate, onLogout }: ProfileScreenProps) {
  const { toast } = useToast()
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [amount, setAmount] = useState(100)
  const [walletAddress, setWalletAddress] = useState(userData.walletAddress || "")
  const [depositSent, setDepositSent] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [transactionError, setTransactionError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userData.id) return
      setIsLoadingTransactions(true)
      setTransactionError(null)
      try {
        const response = await fetch(`/api/transactions?userId=${userData.id}`)
        if (!response.ok) throw new Error("Failed to fetch transactions")
        const data = await response.json()
        setTransactions(data)
      } catch (error) {
        setTransactionError("Failed to load transaction history")
      } finally {
        setIsLoadingTransactions(false)
      }
    }
    fetchTransactions()
  }, [userData.id])

  const createDepositNotification = async (amount: number) => {
    setDepositSent(true)
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          type: "deposit_request",
          amount: amount,
          message: `User ${userData.username} requested a deposit verification for $${amount}. Wallet: ${walletAddress}`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send deposit request.")
      }

      toast({
        title: "Request Sent",
        description: "Your deposit request has been sent to the administrator for review.",
      })
      setShowDepositModal(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setDepositSent(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 p-4 apple-blur">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="text-gray-500" onClick={() => onNavigate("home")}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Profile</h1>
          <div className="w-6"></div>
        </div>
      </header>

      {/* Profile Info & Balance */}
      <div className="p-4">
        <Card className="overflow-hidden border-0 apple-shadow">
          <div className="p-4">
            <div className="flex items-center mb-4">
              {userData.avatar ? (
                <img
                  src={userData.avatar || "/placeholder.svg"}
                  alt={userData.username}
                  className="h-16 w-16 rounded-full border-2 border-white"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-xl font-bold">
                  {userData.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="ml-4">
                <h2 className="text-xl font-bold">{userData.username}</h2>
                <p className="text-gray-500 text-sm">ID: {userData.id}</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Balance</h3>
            <p className="mt-1 text-3xl font-bold text-primary">${userData.balance.toFixed(2)}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button className="apple-button" onClick={() => setShowDepositModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Deposit
              </Button>
              <Button
                variant="outline"
                className="border-gray-200 text-gray-700 hover:bg-gray-100 bg-transparent"
                onClick={() => setShowWithdrawModal(true)}
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Withdraw
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats */}
      <div className="mt-2 px-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 apple-shadow p-4">
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <div className="text-sm text-gray-500">Games Won</div>
                <div className="font-bold text-gray-900">{userData.gamesWon}</div>
              </div>
            </div>
          </Card>
          <Card className="border-0 apple-shadow p-4">
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <div className="text-sm text-gray-500">Games Played</div>
                <div className="font-bold text-gray-900">{userData.gamesPlayed}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Transaction History */}
      <div className="mt-6 px-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Transaction History</h3>
        <Card className="border-0 apple-shadow overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {isLoadingTransactions ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : transactionError ? (
              <div className="p-4 text-center text-red-500">{transactionError}</div>
            ) : transactions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No transactions yet.</div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="border-b border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </div>
                      <div className="text-sm text-gray-500">{formatDate(tx.createdAt)}</div>
                    </div>
                    <div
                      className={`font-bold ${
                        tx.type === "deposit" || tx.type === "win" ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {tx.type === "deposit" || tx.type === "win" ? "+" : "-"}${tx.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Logout Button */}
      <div className="mt-6 px-4">
        <Button
          variant="outline"
          className="w-full border-gray-200 text-gray-700 hover:bg-gray-100 bg-transparent"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <Card className="w-full max-w-sm border-0 apple-shadow animate-fade-in">
            <div className="apple-gradient p-4 text-white">
              <h3 className="text-lg font-semibold">Deposit USDT (TRC20)</h3>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <p className="mb-2 text-gray-600">Send USDT to this address (TRC20 network only):</p>
                <div className="trc20-address break-all">TJDENsfBJs4RFETt1X1W8wMDc8M5XnJhCe</div>
                <p className="mt-2 text-sm text-gray-500">
                  Minimum deposit: $10. Funds will be credited after 6 network confirmations.
                </p>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-red-600">
                  * Please enter YOUR wallet address (required for verification)
                </label>
                <Input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter YOUR TRC20 wallet address"
                  className="apple-input font-mono text-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">Amount to Deposit (USDT)</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={10}
                  className="apple-input"
                />
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  className="border-gray-200 text-gray-700 hover:bg-gray-100 bg-transparent"
                  onClick={() => setShowDepositModal(false)}
                >
                  Close
                </Button>
                <Button
                  className="apple-button"
                  onClick={() => {
                    if (!walletAddress || walletAddress.length < 30) {
                      toast({
                        title: "Validation Error",
                        description: "Please enter your wallet address.",
                        variant: "destructive",
                      })
                      return
                    }
                    createDepositNotification(amount)
                  }}
                  disabled={depositSent}
                >
                  {depositSent ? "Sending..." : "I've Sent USDT"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
