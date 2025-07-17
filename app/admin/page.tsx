"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminStats from "./components/admin-stats"
import AdminUsers from "./components/admin-users"
import AdminTransactions from "./components/admin-transactions"
import AdminNotifications from "./components/admin-notifications"
import AdminSettings from "./components/admin-settings"
import AdminRecentUsers from "./components/admin-recent-users"
import AdminRecentTransactions from "./components/admin-recent-transactions"
import { getSupabaseClient } from "@/lib/supabase"

export default function AdminPage() {
  const [adminId, setAdminId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAdminStatus() {
      const supabase = getSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login")
        return
      }

      const { data: userData, error } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", session.user.id)
        .single()

      if (error || !userData || !userData.is_admin) {
        router.push("/")
        return
      }

      setAdminId(session.user.id)
      setIsLoading(false)
    }

    checkAdminStatus()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Загрузка админ-панели...</h2>
          <p className="text-gray-500">Пожалуйста, подождите</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-3xl font-bold">Панель администратора</h1>

      {adminId && (
        <>
          <AdminStats adminId={adminId} />

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <AdminRecentUsers adminId={adminId} />
            <AdminRecentTransactions adminId={adminId} />
          </div>

          <Tabs defaultValue="users" className="mt-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="users">Пользователи</TabsTrigger>
              <TabsTrigger value="transactions">Транзакции</TabsTrigger>
              <TabsTrigger value="notifications">Уведомления</TabsTrigger>
              <TabsTrigger value="settings">Настройки</TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="mt-6">
              <AdminUsers adminId={adminId} />
            </TabsContent>
            <TabsContent value="transactions" className="mt-6">
              <AdminTransactions adminId={adminId} />
            </TabsContent>
            <TabsContent value="notifications" className="mt-6">
              <AdminNotifications adminId={adminId} />
            </TabsContent>
            <TabsContent value="settings" className="mt-6">
              <AdminSettings adminId={adminId} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
