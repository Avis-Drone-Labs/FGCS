import { useEffect } from 'react'
import { showErrorNotification } from '../notification'
import { socket } from '../socket'
import Navbar from './navbar'

export default function Layout({ children, currentPage }) {
  useEffect(() => {
    socket.on('drone_error', (err) => {
      showErrorNotification(err.message)
    })

    return () => {
      socket.off('drone_error')
    }
  }, [])

  return (
    <>
      <Navbar currentPage={currentPage} />
      {children}
    </>
  )
}
