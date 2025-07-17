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

    // Get recent users
    const { data, error } = await supabase
      .from("users")
      .select("id, username, avatar, status, created_at, last_login")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching recent users:", error)
      return NextResponse.json({ error: "Failed to fetch recent users" }, { status: 500 })
    }

    const users = data.map((user) => ({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.created_at,
      lastLogin: user.last_login || undefined,
    }))

    // Add cache control headers to prevent caching
    const response = NextResponse.json(users)
    response.headers.set("Cache-Control", "no-store, max-age=0")
    return response
  } catch (error) {
    console.error("Error fetching recent users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
