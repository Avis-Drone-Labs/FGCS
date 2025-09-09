"use client"
import { io } from "socket.io-client"
import { logInfo } from "./logging"

export const socket = io(import.meta.env.VITE_BACKEND_URL)

socket.on("connect", () => {
  logInfo(`Connected to socket from legacy, ${socket.id}`)
})

socket.on("disconnect", () => {
  logInfo("Disconnected from legacy socket")
})

class SocketConnection {
  socket
  socketEndpoint = import.meta.env.VITE_BACKEND_URL

  constructor() {
    this.socket = io(this.socketEndpoint)
  }
}

let socketConnection = undefined

class SocketFactory {
  static create() {
    if (!socketConnection) {
      socketConnection = new SocketConnection()
    }
    return socketConnection
  }
}
export default SocketFactory
