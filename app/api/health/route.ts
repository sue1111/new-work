import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"

// Health check endpoint for monitoring
export async function GET() {
  try {
    const startTime = Date.now()

    // Check database connection
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase.from("system_settings").select("id").limit(1)

    if (error) {
      console.error("Database health check failed:", error)
      return NextResponse.json(
        {
          status: "error",
          database: "unhealthy",
          message: "Database connection failed",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

    // Check socket.io server
    const socketServer = (global as any).socketIOServer
    const socketStatus = socketServer ? "healthy" : "not initialized"

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      socket: socketStatus,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
