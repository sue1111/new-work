import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { verifyAdmin } from "@/lib/utils/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get("adminId")
    const type = searchParams.get("type")
    const status = searchParams.get("status")

    if (!adminId) {
      return NextResponse.json({ error: "Admin ID is required" }, { status: 400 })
    }

    // Verify admin status
    const isAdmin = await verifyAdmin(adminId)

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const supabase = getSupabaseServerClient()

    let query = supabase.from("notifications").select("*, users(username)").order("created_at", { ascending: false })

    if (type && type !== "all") {
      query = query.eq("type", type)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching notifications:", error)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    const notifications = data.map((notification) => ({
      id: notification.id,
      type: notification.type,
      userId: notification.user_id,
      username: notification.users?.username || "",
      amount: notification.amount || undefined,
      status: notification.status,
      message: notification.message,
      createdAt: notification.created_at,
    }))

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { adminId, notificationId, status } = await request.json()

    if (!adminId || !notificationId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify admin status
    const isAdmin = await verifyAdmin(adminId)

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const supabase = getSupabaseServerClient()

    // Get notification details
    const { data: notification, error: fetchError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .single()

    if (fetchError || !notification) {
      console.error("Error fetching notification:", fetchError)
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    // Update notification status
    const { error: updateError } = await supabase.from("notifications").update({ status }).eq("id", notificationId)

    if (updateError) {
      console.error("Error updating notification:", updateError)
      return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
    }

    // If it's a deposit request and it's approved, create a transaction
    if (notification.type === "deposit_request" && status === "approved" && notification.amount) {
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: notification.user_id,
        type: "deposit",
        amount: notification.amount,
        status: "completed",
        completed_at: new Date().toISOString(),
      })

      if (txError) {
        console.error("Error creating transaction:", txError)
        return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
      }

      // Update user balance
      await supabase
        .from("users")
        .update({
          balance: supabase.rpc("increment", { x: notification.amount }),
        })
        .eq("id", notification.user_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
