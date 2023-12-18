import Layout from './components/layout'
import { socket } from './socket'
import { useEffect, useState } from 'react'

export default function Config() {
  useEffect(() => {
    socket.emit('set_state', { state: 'config' })
    socket.on('params', (params) => {
      console.log(params)
    })

    socket.on('param_request_update', (msg) => {
      console.log(msg)
    })

    socket.on('error', (err) => {
      console.error(err.message)
    })

    return () => {
      socket.off('params')
      socket.off('error')
    }
  })

  return (
    <Layout currentPage="config">
      <p>config page</p>
    </Layout>
  )
}
