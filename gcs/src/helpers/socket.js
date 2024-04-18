import { io } from 'socket.io-client'

export const socket = io(import.meta.env.VITE_BACKEND_URL)

socket.on('connect', () => {
  console.log(`Connected to socket, ${socket.id}`)
})

socket.on('disconnect', () => {
  console.log('Disconnected from socket')
})
