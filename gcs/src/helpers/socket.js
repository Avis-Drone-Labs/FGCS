"use client"
import { io } from "socket.io-client"

class SocketConnection {
  socket
  telemetrySocket
  socketEndpoint = import.meta.env.VITE_BACKEND_URL

  constructor() {
    this.socket = io(this.socketEndpoint)
    this.telemetrySocket = io(this.socketEndpoint + "/telemetry")
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
