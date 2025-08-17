"use client"
import { io } from "socket.io-client"

export const socket = io(import.meta.env.VITE_BACKEND_URL)

socket.on("connect", () => {
  console.log(`Connected to socket, ${socket.id}`)
})

socket.on("disconnect", () => {
  console.log("Disconnected from socket")
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
