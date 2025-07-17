import { io, type Socket } from "socket.io-client"

class SocketManager {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // начальная задержка в мс

  constructor() {
    this.initSocket()
  }

  private initSocket() {
    try {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin

      if (!socketUrl) {
        console.error("Socket URL is not defined")
        return
      }

      this.socket = io(socketUrl, {
        transports: ["polling", "websocket"],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      })

      this.socket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message)

        // Увеличиваем задержку экспоненциально
        this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 5000)

        this.reconnectAttempts++
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error("Max reconnect attempts reached, giving up")
          this.socket?.disconnect()
        }
      })

      this.socket.on("connect", () => {
        console.log("Socket connected successfully")
        // Сбрасываем счетчики при успешном подключении
        this.reconnectAttempts = 0
        this.reconnectDelay = 1000
      })

      this.socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason)

        // Если сервер закрыл соединение, пытаемся переподключиться
        if (reason === "io server disconnect") {
          this.socket?.connect()
        }
      })
    } catch (error) {
      console.error("Error initializing socket:", error)
    }
  }

  public getSocket(): Socket {
    if (!this.socket) {
      this.initSocket()
    }

    if (!this.socket) {
      throw new Error("Socket could not be initialized")
    }

    return this.socket
  }

  public isSocketConnected(): boolean {
    return !!this.socket?.connected
  }

  public connect() {
    this.socket?.connect()
  }

  public disconnect() {
    this.socket?.disconnect()
  }

  public reconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket.connect()
    } else {
      this.initSocket()
      this.socket?.connect()
    }
  }

  public emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn("Socket not connected, cannot emit event:", event)
    }
  }

  public on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback)
  }

  public off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback)
  }
}

// Создаем синглтон для управления сокетом
export const socketManager = new SocketManager()
