"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWebApp } from "@/hooks/use-web-app"
import UserInterface from "@/components/user-interface"
import LoginScreen from "@/components/login-screen"
import type { UserData } from "@/lib/types"
import PWAInstallPrompt from "@/components/pwa-install-prompt"

export default function TicTacToeBet() {
  const { isTelegramAvailable } = useWebApp()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // On component mount, try to load user data from localStorage
  useEffect(() => {
    const savedUserData = localStorage.getItem("userData")
    if (savedUserData) {
      try {
        const parsedData = JSON.parse(savedUserData)
        setUserData(parsedData)
      } catch (e) {
        console.error("Failed to parse saved user data", e)
        localStorage.removeItem("userData")
      }
    }
    setIsLoading(false)
  }, [])

  // When userData changes, update localStorage and handle redirection
  useEffect(() => {
    if (userData) {
      localStorage.setItem("userData", JSON.stringify(userData))
      if (userData.isAdmin) {
        // Optional: redirect admin to admin panel on login
        // router.push('/admin');
      }
    } else {
      localStorage.removeItem("userData")
    }
  }, [userData, router])

  const handleUserLogin = (newUserData: UserData) => {
    setUserData(newUserData)
  }

  const handleLogout = () => {
    setUserData(null)
    router.push("/") // Redirect to home on logout
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-800">Loading...</p>
      </div>
    )
  }

  return (
    <>
      {!userData ? (
        <LoginScreen onLogin={handleUserLogin} telegramAuthAvailable={isTelegramAvailable} />
      ) : (
        <UserInterface userData={userData} setUserData={setUserData} onLogout={handleLogout} />
      )}
      <PWAInstallPrompt />
    </>
  )
}
