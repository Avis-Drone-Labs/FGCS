import { useEffect, useState } from 'react'

import { useListState, useLocalStorage } from '@mantine/hooks'
import Layout from './components/layout'
import Graph from './components/graph'

import { socket } from './socket'

export default function Graphs() {
  const graphLength = 200
  const [connected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })
  
  // VFR_HUD
  const [groundSpeedData, groundSpeedDataHandler] = useListState([{x:Date.now(), y:0}])
  const [headingData, headingDataHandler] = useListState([{x:Date.now(), y:0}])
  const [altitudeData, altitudeDataHandler] = useListState([{x:Date.now(), y:0}])

  // ATTITUDE
  const [pitchData, pitchDataHandler] = useListState([{x:Date.now(), y:0}])
  const [rollData, rollDataHandler] = useListState([{x:Date.now(), y:0}])
  const [yawData, yawDataHandler] = useListState([{x:Date.now(), y:0}])

  useEffect(() => {
    if (!connected) {
      return
    } else {
      socket.emit('set_state', { state: 'dashboard' })
    }

    socket.on('incoming_msg', (msg) => {
      // console.log(msg)
      const timestamp = Date.now()
      switch (msg.mavpackettype) {
        case 'VFR_HUD':
          if (groundSpeedData.length >= graphLength) groundSpeedDataHandler.shift()
          if (headingData.length >= graphLength) headingDataHandler.shift()
          if (altitudeData.length >= graphLength) altitudeDataHandler.shift()

          groundSpeedDataHandler.append(msg.groundspeed)
          headingDataHandler.append(msg.heading)
          altitudeDataHandler.append(msg.altitude)

          break
        case 'ATTITUDE':
          if (yawData.length >= graphLength) yawDataHandler.shift()
          if (pitchData.length >= graphLength) pitchDataHandler.shift()
          if (rollData.length >= graphLength) rollDataHandler.shift()

          yawDataHandler.append({x: timestamp, y: msg.yaw})
          pitchDataHandler.append({x: timestamp, y: msg.pitch})
          rollDataHandler.append({x: timestamp, y: msg.roll})

          break
        default:
          break
      }
    }, [groundSpeedData, headingData, altitudeData, yawData, pitchData, rollData])

    return () => {
      socket.off('incoming_msg')
    }
  }, [connected])

  return (
    <Layout currentPage='graphs'>
      <p>graphs page</p>
      <p>{connected}</p>
      <Graph data={yawData}></Graph>
    </Layout>
  )
}
