import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Create a single supabase client for the browser
const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Create a single supabase client for server components
const createServerClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL as string
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  })
}

// Singleton pattern for client-side Supabase client
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export const getSupabaseBrowserClient = () => {
  if (!browserClient) {
    browserClient = createBrowserClient()
  }
  return browserClient
}

export const getSupabaseServerClient = () => {
  return createServerClient()
}

// Добавим экспорт getSupabaseClient, который будет использовать браузерный клиент
// Это позволит сохранить обратную совместимость с кодом, который использует этот экспорт

// Добавьте следующую функцию после getSupabaseServerClient
export const getSupabaseClient = () => {
  return getSupabaseBrowserClient()
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
