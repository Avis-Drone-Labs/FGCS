import { useEffect } from 'react'
import { showErrorNotification } from '../helpers/notification'
import { socket } from '../helpers/socket'
import Navbar from '../components/navbar'

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
