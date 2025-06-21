import { io } from "socket.io-client"
import { logInfo } from "./logging"

export const socket = io(import.meta.env.VITE_BACKEND_URL)

socket.on("connect", () => {
  logInfo(`Connected to socket, ${socket.id}`)
})

socket.on("disconnect", () => {
  logInfo("Disconnected from socket")
})
