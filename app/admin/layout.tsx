import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Tic-Tac-Toe Admin Dashboard",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b bg-background">
          <div className="container flex h-16 items-center px-4">
            <h1 className="text-xl font-bold">Tic-Tac-Toe Admin</h1>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
