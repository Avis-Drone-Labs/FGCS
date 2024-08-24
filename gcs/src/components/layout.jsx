/*
  Custom component to control the layout of each page. This is where the navbar is loaded, all pages use this.
*/

// Base imports
import { useEffect } from 'react'

// Helpers and custom component imports
import { showErrorNotification } from '../helpers/notification'
import { socket } from '../helpers/socket'
import Navbar from './navbar'
import Toolbar from './toolbar'

export default function Layout({ children, currentPage }) {
  // Handle drone errors
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
      <Toolbar />
      <Navbar currentPage={currentPage} />
      {children}
    </>
  )
}
