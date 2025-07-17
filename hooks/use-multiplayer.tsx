"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { socketManager } from "@/lib/socket"
import type { GameState, UserData, Player } from "@/lib/types"

interface PendingInvite {
  gameId: string
  from: Player
  betAmount: number
}

interface UseMultiplayerReturn {
  activeGame: GameState | null
  lobbyGames: GameState[]
  onlinePlayers: Player[]
  pendingInvite: PendingInvite | null
  isConnected: boolean
  createGame: (betAmount: number) => void
  joinGame: (gameId: string) => void
  makeMove: (index: number) => void
  invitePlayer: (userId: string, betAmount: number) => void
  acceptInvite: (gameId: string) => void
  declineInvite: (gameId: string) => void
  endGame: () => void
}

export function useMultiplayer(userData: UserData | null): UseMultiplayerReturn {
  const [activeGame, setActiveGame] = useState<GameState | null>(null)
  const [lobbyGames, setLobbyGames] = useState<GameState[]>([])
  const [onlinePlayers, setOnlinePlayers] = useState<Player[]>([])
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)

  // Используем useRef для хранения ID пользователя, чтобы избежать проблем с замыканиями
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (userData?.id) {
      userIdRef.current = userData.id
    }
  }, [userData])

  // Инициализация сокета при монтировании компонента
  useEffect(() => {
    if (!userData) return

    // Подключаемся к сокету
    const socket = socketManager.getSocket()

    // Устанавливаем обработчики событий
    socket.on("connect", () => {
      console.log("Socket connected")
      setIsConnected(true)

      // Отправляем данные пользователя при подключении
      socket.emit("user:connect", {
        userId: userData.id,
        username: userData.username,
        avatar: userData.avatar,
      })
    })

    socket.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    })

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      setIsConnected(false)
    })

    // Обработчики игровых событий
    socket.on("game:update", (game: GameState) => {
      if (game.players.X.id === userData.id || game.players.O?.id === userData.id) {
        setActiveGame(game)
      }
    })

    socket.on("game:lobby", (games: GameState[]) => {
      setLobbyGames(games)
    })

    socket.on("players:online", (players: Player[]) => {
      // Фильтруем текущего пользователя из списка онлайн-игроков
      setOnlinePlayers(players.filter((player) => player.id !== userData.id))
    })

    socket.on("game:invite", (invite: PendingInvite) => {
      setPendingInvite(invite)
    })

    // Подключаемся к сокету
    if (!socket.connected) {
      socket.connect()
    }

    // Отключаемся при размонтировании компонента
    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("connect_error")
      socket.off("game:update")
      socket.off("game:lobby")
      socket.off("players:online")
      socket.off("game:invite")

      // Отправляем событие отключения пользователя
      if (socket.connected && userData.id) {
        socket.emit("user:disconnect", { userId: userData.id })
      }
    }
  }, [userData])

  // Функция для создания новой игры
  const createGame = useCallback(
    (betAmount: number) => {
      if (!userData) return

      const socket = socketManager.getSocket()
      socket.emit("game:create", {
        userId: userData.id,
        betAmount,
      })
    },
    [userData],
  )

  // Функция для присоединения к игре
  const joinGame = useCallback(
    (gameId: string) => {
      if (!userData) return

      const socket = socketManager.getSocket()
      socket.emit("game:join", {
        userId: userData.id,
        gameId,
      })
    },
    [userData],
  )

  // Функция для выполнения хода
  const makeMove = useCallback(
    (index: number) => {
      if (!userData || !activeGame) return

      const socket = socketManager.getSocket()
      socket.emit("game:move", {
        userId: userData.id,
        gameId: activeGame.id,
        index,
      })
    },
    [userData, activeGame],
  )

  // Функция для приглашения игрока
  const invitePlayer = useCallback(
    (userId: string, betAmount: number) => {
      if (!userData) return

      const socket = socketManager.getSocket()
      socket.emit("game:invite", {
        fromUserId: userData.id,
        toUserId: userId,
        betAmount,
      })
    },
    [userData],
  )

  // Функция для принятия приглашения
  const acceptInvite = useCallback(
    (gameId: string) => {
      if (!userData) return

      const socket = socketManager.getSocket()
      socket.emit("game:accept-invite", {
        userId: userData.id,
        gameId,
      })

      // Сбрасываем приглашение
      setPendingInvite(null)
    },
    [userData],
  )

  // Функция для отклонения приглашения
  const declineInvite = useCallback(
    (gameId: string) => {
      if (!userData) return

      const socket = socketManager.getSocket()
      socket.emit("game:decline-invite", {
        userId: userData.id,
        gameId,
      })

      // Сбрасываем приглашение
      setPendingInvite(null)
    },
    [userData],
  )

  // Функция для завершения игры
  const endGame = useCallback(() => {
    if (!userData || !activeGame) return

    const socket = socketManager.getSocket()
    socket.emit("game:end", {
      userId: userData.id,
      gameId: activeGame.id,
    })

    // Сбрасываем активную игру
    setActiveGame(null)
  }, [userData, activeGame])

  return {
    activeGame,
    lobbyGames,
    onlinePlayers,
    pendingInvite,
    isConnected,
    createGame,
    joinGame,
    makeMove,
    invitePlayer,
    acceptInvite,
    declineInvite,
    endGame,
  }
}
