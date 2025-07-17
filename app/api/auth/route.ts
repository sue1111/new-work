import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase"
import { createUser } from "@/lib/db-actions"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Проверяем, существует ли пользователь
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error checking for existing user:", fetchError)
      return NextResponse.json({ error: "Database error while checking user." }, { status: 500 })
    }

    if (existingUser) {
      // Пользователь существует, попытка входа.
      // ВАЖНО: Здесь должна быть проверка хэшированного пароля.
      // Например: const isValid = await bcrypt.compare(password, existingUser.password_hash);
      // if (!isValid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

      // Обновляем время последнего входа
      await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", existingUser.id)

      return NextResponse.json({
        id: existingUser.id,
        username: existingUser.username,
        balance: existingUser.balance,
        avatar: existingUser.avatar,
        gamesPlayed: existingUser.games_played,
        gamesWon: existingUser.games_won,
        walletAddress: existingUser.wallet_address,
        isAdmin: existingUser.is_admin,
        status: existingUser.status,
      })
    } else {
      // Пользователь не существует, попытка регистрации.
      // ВАЖНО: Здесь нужно хэшировать пароль перед сохранением.
      // const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await createUser({
        username,
        // password: hashedPassword, // Сохраняем хэш
        balance: 0,
        avatar: null,
        gamesPlayed: 0,
        gamesWon: 0,
        isAdmin: false, // Новые пользователи по умолчанию не администраторы
        status: "active",
      })

      if (!newUser) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }

      return NextResponse.json(newUser)
    }
  } catch (error) {
    console.error("Error in auth route:", error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body. Expected JSON." }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
