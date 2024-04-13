import { IconClock, IconNetwork, IconNetworkOff } from '@tabler/icons-react'
import { cloneElement, useEffect, useState } from 'react'

import { Tooltip } from '@mantine/core'
import { useInterval } from '@mantine/hooks'
import moment from 'moment'
import { socket } from '../helpers/socket'

export function StatusSection({ icon, value, tooltip }) {
  return (
    <Tooltip label={tooltip}>
      <div className='flex flex-row items-center justify-center space-x-1'>
        {cloneElement(icon, { size: 20 })}
        {value !== null && <p>{value}</p>}
      </div>
    </Tooltip>
  )
}

export default function StatusBar(props) {
  const [time, setTime] = useState(moment())
  const updateClock = useInterval(() => setTime(moment()), 1000)

  useEffect(() => {
    updateClock.start()
    return updateClock.stop
  }, [])

  return (
    <div
      className={`${props.className} bg-falcongrey/80 p-1 flex flex-row space-x-3`}
    >
      {props.children}
      <StatusSection
        icon={socket.connected ? <IconNetwork /> : <IconNetworkOff />}
        value=''
        tooltip={
          socket.connected ? 'Connected to socket' : 'Disconnected from socket'
        }
      />
      <StatusSection
        icon={<IconClock />}
        value={time?.format('HH:mm:ss')}
        tooltip='Local time'
      />
    </div>
  )
}
