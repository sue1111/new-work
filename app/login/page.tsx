"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { validateUsername } from "@/lib/utils/validation"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setError("Username is required")
      return
    }

    if (!validateUsername(username)) {
      setError("Username must be 3-20 characters and contain only letters, numbers, and underscores")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      })

      if (response.ok) {
        const userData = await response.json()

        // Store user data in localStorage
        localStorage.setItem("tictactoe_user", JSON.stringify(userData))

        // Redirect based on admin status
        if (userData.isAdmin) {
          router.push("/admin")
        } else {
          router.push("/")
        }
      } else {
        const data = await response.json()
        setError(data.error || "Failed to login")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">TicTacToe Game</CardTitle>
          <CardDescription>Enter your username to continue</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {error && <div className="text-sm text-red-500">{error}</div>}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login / Register"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
