import { type NextRequest, NextResponse } from "next/server"
import { Server } from "socket.io"
import { getSupabaseServerClient } from "@/lib/supabase"
import type { GameState } from "@/lib/types"

// Глобальная переменная для хранения экземпляра Socket.IO сервера
let io: Server

// Хранилище активных игр
const activeGames: Record<string, GameState> = {}

// Обработчик для WebSocket соединений
export async function GET(req: NextRequest) {
  try {
    // Проверяем, инициализирован ли уже сервер Socket.IO
    if (!io) {
      // Получаем объект res из глобального объекта
      const res = new NextResponse()

      // Создаем новый экземпляр Socket.IO сервера
      io = new Server({
        cors: {
          origin: "*", // В продакшене нужно указать конкретные домены
          methods: ["GET", "POST"],
          credentials: true,
        },
        path: "/api/socket",
        addTrailingSlash: false,
      })

      // Обработчик подключения нового клиента
      io.on("connection", async (socket) => {
        console.log("New client connected:", socket.id)

        // Получаем данные пользователя из query параметров
        const userId = socket.handshake.query.userId as string
        const username = socket.handshake.query.username as string

        if (!userId || !username) {
          console.error("Missing user data in socket connection")
          socket.disconnect()
          return
        }

        // Проверяем существование пользователя в базе данных
        const supabase = getSupabaseServerClient()
        const { data: user, error } = await supabase
          .from("users")
          .select("id, username, balance")
          .eq("id", userId)
          .single()

        if (error || !user) {
          console.error("User not found or database error:", error)
          socket.disconnect()
          return
        }

        // Сохраняем данные пользователя в объекте сокета
        socket.data.user = {
          id: user.id,
          username: user.username,
          balance: user.balance,
        }

        // Отправляем клиенту список активных игр
        socket.emit("lobby:update", Object.values(activeGames))

        // Обработчики событий от клиента
        socket.on("game:create", async (data: { betAmount: number }) => {
          try {
            // Проверяем баланс пользователя
            if (user.balance < data.betAmount) {
              socket.emit("error", { message: "Insufficient balance" })
              return
            }

            // Создаем новую игру
            const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
            const newGame: GameState = {
              id: gameId,
              board: Array(9).fill(null),
              currentPlayer: "X",
              status: "waiting",
              winner: null,
              players: {
                X: socket.data.user,
                O: null,
              },
              betAmount: data.betAmount,
              createdAt: new Date().toISOString(),
            }

            // Сохраняем игру в хранилище
            activeGames[gameId] = newGame

            // Присоединяем пользователя к комнате игры
            socket.join(gameId)

            // Отправляем обновление всем клиентам
            io.emit("lobby:update", Object.values(activeGames))
            socket.emit("game:update", newGame)

            console.log(`Game ${gameId} created by ${user.username}`)
          } catch (error) {
            console.error("Error creating game:", error)
            socket.emit("error", { message: "Failed to create game" })
          }
        })

        // Другие обработчики событий...

        // Обработчик отключения клиента
        socket.on("disconnect", () => {
          console.log("Client disconnected:", socket.id)
          // Дополнительная логика при отключении клиента
        })
      })

      // Запускаем Socket.IO сервер
      console.log("Socket.IO server initialized")
    }

    // Возвращаем успешный ответ
    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error in socket route:", error)
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}
