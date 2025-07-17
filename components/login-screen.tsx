"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BellIcon as BrandTelegram } from "lucide-react"
import type { UserData } from "@/lib/types"

interface LoginScreenProps {
  onLogin: (userData: UserData) => void
  telegramAuthAvailable: boolean
}

export default function LoginScreen({ onLogin, telegramAuthAvailable }: LoginScreenProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [error, setError] = useState("")

  const handleTelegramLogin = () => {
    setIsLoading(true)
    // This is a placeholder for actual Telegram login logic
    alert("Telegram login is not implemented in this example.")
    setIsLoading(false)
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUsername(value)
    if (value.trim() !== "") {
      setShowPasswordField(true)
    } else {
      setShowPasswordField(false)
      setPassword("")
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        let errorMessage = `Failed to login (status ${response.status})`
        try {
          const data = await response.json()
          if (data?.error) errorMessage = data.error
        } catch {
          try {
            const text = await response.text()
            if (text) errorMessage = text
          } catch {
            // Keep default message
          }
        }
        throw new Error(errorMessage)
      }

      const userData: UserData = await response.json()
      onLogin(userData)
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <Card className="w-full max-w-md overflow-hidden border-0 shadow-xl">
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-center text-white">
          <h1 className="text-3xl font-bold">Tic-Tac-Toe</h1>
          <p className="mt-2 text-white/80">Login or Register to start playing</p>
        </div>

        <div className="p-6">
          {telegramAuthAvailable && (
            <div className="mb-6">
              <Button
                className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90 text-white"
                onClick={handleTelegramLogin}
                disabled={isLoading}
              >
                <BrandTelegram className="mr-2 h-5 w-5" />
                {isLoading ? "Logging in..." : "Login with Telegram"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">or</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                className="mt-1"
                placeholder="Enter your username"
                disabled={isLoading}
                required
              />
            </div>

            {showPasswordField && (
              <div className="mb-4">
                <Label htmlFor="password">Password</Label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={handlePasswordChange}
                  className="mt-1"
                  placeholder="Enter password"
                  required
                />
              </div>
            )}

            {error && <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 rounded border-red-200">{error}</div>}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading || !username || !password}
            >
              {isLoading ? "Processing..." : "Login / Register"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            By proceeding, you agree to the game rules and privacy policy.
          </p>
        </div>
      </Card>
    </div>
  )
}
