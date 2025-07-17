"use client"

import { useState, useCallback, memo, useEffect } from "react"
import { Trophy, Clock, User, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import GameBoard from "@/components/game-board"
import HomeScreen from "@/components/home-screen"
import ProfileScreen from "@/components/profile-screen"
import LobbyScreen from "@/components/lobby-screen"
import LeaderboardScreen from "@/components/leaderboard-screen"
import { useMultiplayer } from "@/hooks/use-multiplayer"
import type { GameState, UserData } from "@/lib/types"

interface UserInterfaceProps {
  userData: UserData | null
  setUserData: (userData: UserData) => void
  onAdminRequest: () => void
  onLogout: () => void
}

const UserInterface = memo(({ userData, setUserData, onAdminRequest, onLogout }: UserInterfaceProps) => {
  const [currentScreen, setCurrentScreen] = useState<"home" | "game" | "profile" | "lobby" | "leaderboard">("home")
  const [gameState, setGameState] = useState<GameState | null>(null)

  // Используем хук для многопользовательской игры
  const {
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
    endGame: endMultiplayerGame,
  } = useMultiplayer(userData)

  // Добавьте уведомление о проблемах с подключением, если пользователь пытается использовать мультиплеер
  const handleCreateMultiplayerGame = useCallback(
    (betAmount: number) => {
      if (!userData) return

      if (!isConnected) {
        alert("Не удалось подключиться к серверу. Мультиплеер временно недоступен. Вы можете играть против бота.")
        return
      }

      createGame(betAmount)
    },
    [userData, createGame, isConnected],
  )

  // Аналогично для других функций мультиплеера:
  const handleJoinGame = useCallback(
    (gameId: string) => {
      if (!userData) return

      if (!isConnected) {
        alert("Не удалось подключиться к серверу. Мультиплеер временно недоступен.")
        return
      }

      joinGame(gameId)
    },
    [userData, joinGame, isConnected],
  )

  const handleInvitePlayer = useCallback(
    (userId: string, betAmount: number) => {
      if (!userData) return

      if (!isConnected) {
        alert("Не удалось подключиться к серверу. Мультиплеер временно недоступен.")
        return
      }

      invitePlayer(userId, betAmount)
    },
    [userData, invitePlayer, isConnected],
  )

  // Обновляем локальное состояние игры при изменении активной игры
  useEffect(() => {
    if (activeGame) {
      setGameState(activeGame)
      setCurrentScreen("game")
    }
  }, [activeGame])

  // Обработчик для создания игры с ботом
  const handleCreateBotGame = useCallback(
    (betAmount: number) => {
      // Создаем игру с ботом
      if (!userData) return

      setGameState({
        id: `game_${Math.random().toString(36).substring(7)}`,
        board: Array(9).fill(null),
        currentPlayer: "X",
        players: {
          X: {
            id: userData.id || "player1",
            username: userData.username || "Player 1",
            avatar: userData.avatar,
          },
          O: {
            id: "ai",
            username: "AI Opponent",
            avatar: null,
          },
        },
        status: "playing",
        betAmount,
        pot: betAmount, // Начальная ставка только от игрока
        winner: null,
        createdAt: new Date().toISOString(),
      })
      setCurrentScreen("game")
    },
    [userData],
  )

  // Обработчик для присоединения к многопользовательской игре

  // Обработчик для хода в игре с ботом
  const handleBotGameMove = useCallback(
    (index: number) => {
      if (!gameState || !userData) return

      // Проверяем, что ячейка пуста и игра активна
      if (gameState.board[index] || gameState.status !== "playing") return

      // Обновляем доску с ходом игрока
      const newBoard = [...gameState.board]
      newBoard[index] = gameState.currentPlayer

      // Обновляем банк
      const newPot = gameState.pot + gameState.betAmount

      // Проверяем на победителя
      const winner = calculateWinner(newBoard)
      let newStatus = gameState.status
      let newWinner = gameState.winner

      if (winner) {
        newStatus = "completed"
        newWinner = winner

        // Обновляем баланс пользователя, если он выиграл
        if (winner === "X") {
          const winnings = newPot * 0.8 // 80% от банка (20% комиссия платформы)
          setUserData({
            ...userData,
            balance: userData.balance + winnings,
            gamesWon: userData.gamesWon + 1,
            gamesPlayed: userData.gamesPlayed + 1,
          })
        } else {
          setUserData({
            ...userData,
            gamesPlayed: userData.gamesPlayed + 1,
          })
        }
      } else if (!newBoard.includes(null)) {
        // Ничья
        newStatus = "draw"

        // Возвращаем ставки в случае ничьей
        setUserData({
          ...userData,
          balance: userData.balance + gameState.pot,
          gamesPlayed: userData.gamesPlayed + 1,
        })
      } else {
        // Вычитаем сумму ставки из баланса пользователя
        setUserData({
          ...userData,
          balance: userData.balance - gameState.betAmount,
        })

        // Ход бота
        setTimeout(() => {
          const aiBoard = [...newBoard]
          const emptyIndices = aiBoard
            .map((cell, idx) => (cell === null ? idx : null))
            .filter((idx) => idx !== null) as number[]

          if (emptyIndices.length > 0) {
            // Получаем вероятность победы из localStorage или используем значение по умолчанию
            const winProbability = Number.parseFloat(localStorage.getItem("botWinProbability") || "0.3")

            // Определяем, должен ли бот сделать стратегический ход или случайный
            const shouldMakeStrategicMove = Math.random() < winProbability

            let aiMoveIndex: number

            if (shouldMakeStrategicMove) {
              // Делаем стратегический ход (пытаемся выиграть или блокировать игрока)
              aiMoveIndex = getBestMove(aiBoard, "O") || emptyIndices[Math.floor(Math.random() * emptyIndices.length)]
            } else {
              // Делаем случайный ход
              aiMoveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)]
            }

            aiBoard[aiMoveIndex] = "O"

            // Обновляем банк снова для хода бота
            const aiPot = newPot + gameState.betAmount

            // Проверяем, выиграл ли бот
            const aiWinner = calculateWinner(aiBoard)
            let aiStatus = newStatus
            let aiGameWinner = newWinner

            if (aiWinner) {
              aiStatus = "completed"
              aiGameWinner = aiWinner

              setUserData({
                ...userData,
                gamesPlayed: userData.gamesPlayed + 1,
              })
            } else if (!aiBoard.includes(null)) {
              // Ничья после хода бота
              aiStatus = "draw"

              // Возвращаем ставки в случае ничьей
              setUserData({
                ...userData,
                balance: userData.balance + aiPot,
                gamesPlayed: userData.gamesPlayed + 1,
              })
            }

            setGameState({
              ...gameState,
              board: aiBoard,
              pot: aiPot,
              status: aiStatus,
              winner: aiGameWinner,
            })
          }
        }, 500)
      }

      // Обновляем состояние игры
      setGameState({
        ...gameState,
        board: newBoard,
        currentPlayer: gameState.currentPlayer === "X" ? "O" : "X",
        pot: newPot,
        status: newStatus,
        winner: newWinner,
      })
    },
    [gameState, userData, setUserData],
  )

  // Обработчик для хода в многопользовательской игре
  const handleMultiplayerMove = useCallback(
    (index: number) => {
      if (!activeGame || !userData) return
      makeMove(index)
    },
    [activeGame, userData, makeMove],
  )

  // Обработчик для завершения игры
  const handleEndGame = useCallback(() => {
    if (activeGame) {
      endMultiplayerGame()
    }
    setGameState(null)
    setCurrentScreen("home")
  }, [activeGame, endMultiplayerGame])

  // Обработчик запроса на пополнение баланса
  const handleDepositRequest = useCallback((amount: number) => {
    // В реальном приложении здесь был бы API-запрос
    console.log(`Запрос на пополнение баланса на сумму ${amount}`)
  }, [])

  // Отображаем модальное окно с приглашением в игру
  useEffect(() => {
    if (pendingInvite) {
      const handleInviteResponse = (accept: boolean) => {
        if (accept) {
          acceptInvite(pendingInvite.gameId)
        } else {
          declineInvite(pendingInvite.gameId)
        }
      }

      const confirmMessage = `${pendingInvite.from.username} приглашает вас сыграть. Принять приглашение?`
      if (confirm(confirmMessage)) {
        handleInviteResponse(true)
      } else {
        handleInviteResponse(false)
      }
    }
  }, [pendingInvite, acceptInvite, declineInvite])

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      {currentScreen === "home" && (
        <HomeScreen
          onCreateGame={handleCreateBotGame}
          onCreateMultiplayerGame={handleCreateMultiplayerGame}
          onNavigate={setCurrentScreen}
          userData={userData}
          onAdminRequest={onAdminRequest}
        />
      )}

      {currentScreen === "game" && gameState && (
        <GameBoard
          gameState={gameState}
          onMakeMove={activeGame ? handleMultiplayerMove : handleBotGameMove}
          onEndGame={handleEndGame}
          userData={userData}
          isMultiplayer={!!activeGame}
        />
      )}

      {currentScreen === "profile" && userData && (
        <ProfileScreen
          userData={userData}
          onNavigate={setCurrentScreen}
          onLogout={onLogout}
          onDepositRequest={handleDepositRequest}
        />
      )}

      {currentScreen === "lobby" && (
        <LobbyScreen
          onJoinGame={handleJoinGame}
          onCreateGame={handleCreateMultiplayerGame}
          onInvitePlayer={handleInvitePlayer}
          onNavigate={setCurrentScreen}
          userData={userData}
          lobbyGames={lobbyGames}
          onlinePlayers={onlinePlayers}
        />
      )}

      {currentScreen === "leaderboard" && <LeaderboardScreen onNavigate={setCurrentScreen} />}

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around border-t border-gray-100 bg-white/80 p-3 shadow-lg backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/80">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentScreen("home")}
          className={currentScreen === "home" ? "text-primary" : "text-gray-400"}
        >
          <Trophy className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentScreen("lobby")}
          className={currentScreen === "lobby" ? "text-primary" : "text-gray-400"}
        >
          <Users className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentScreen("leaderboard")}
          className={currentScreen === "leaderboard" ? "text-primary" : "text-gray-400"}
        >
          <Clock className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentScreen("profile")}
          className={currentScreen === "profile" ? "text-primary" : "text-gray-400"}
        >
          <User className="h-6 w-6" />
        </Button>
      </nav>
    </main>
  )
})

UserInterface.displayName = "UserInterface"

export default UserInterface

// Вспомогательная функция для определения победителя
function calculateWinner(board: (string | null)[]) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }

  return null
}

// Вспомогательная функция для получения лучшего хода для бота
function getBestMove(board: (string | null)[], player: string): number | null {
  const opponent = player === "X" ? "O" : "X"

  // Проверяем, может ли бот выиграть следующим ходом
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      const boardCopy = [...board]
      boardCopy[i] = player
      if (calculateWinner(boardCopy) === player) {
        return i
      }
    }
  }

  // Проверяем, может ли игрок выиграть следующим ходом и блокируем его
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      const boardCopy = [...board]
      boardCopy[i] = opponent
      if (calculateWinner(boardCopy) === opponent) {
        return i
      }
    }
  }

  // Пытаемся занять центр
  if (board[4] === null) {
    return 4
  }

  // Пытаемся занять углы
  const corners = [0, 2, 6, 8]

  for (const corner of corners) {
    if (board[corner] === null) {
      return corner
    }
  }

  // Если нет возможности выиграть или заблокировать, делаем случайный ход
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      return i
    }
  }

  return null
}
