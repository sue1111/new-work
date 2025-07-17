import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { verifyAdmin } from "@/lib/utils/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get("adminId")
    const limit = Number.parseInt(searchParams.get("limit") || "5", 10)

    if (!adminId) {
      return NextResponse.json({ error: "Admin ID is required" }, { status: 400 })
    }

    // Verify admin status
    const isAdmin = await verifyAdmin(adminId)

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const supabase = getSupabaseServerClient()

    // Get recent transactions with user information
    const { data, error } = await supabase
      .from("transactions")
      .select("*, users!inner(username)")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching recent transactions:", error)
      return NextResponse.json({ error: "Failed to fetch recent transactions" }, { status: 500 })
    }

    const transactions = data.map((tx) => ({
      id: tx.id,
      userId: tx.user_id,
      username: tx.users?.username,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status,
      createdAt: tx.created_at,
    }))

    // Add cache control headers to prevent caching
    const response = NextResponse.json(transactions)
    response.headers.set("Cache-Control", "no-store, max-age=0")
    return response
  } catch (error) {
    console.error("Error fetching recent transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
