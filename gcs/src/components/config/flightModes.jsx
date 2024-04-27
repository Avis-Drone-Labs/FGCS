/*
  This is the flight modes component for the config page.

  It displays the different flight modes and the current flight mode selected depending on the
  PWM value from the RC transmitter on the specified channel. You can set the flight modes for
  each channel and the flight mode channel.
*/

import { Button, Select } from '@mantine/core'
import { useListState } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import { COPTER_MODES_FLIGHT_MODE_MAP } from '../../helpers/mavlinkConstants'
import { socket } from '../../helpers/socket'

const FLIGHT_MODE_PWM_VALUES = [
  [0, 1230],
  [1231, 1360],
  [1361, 1490],
  [1491, 1620],
  [1621, 1749],
  [1750],
]

export default function FlightModes() {
  const [flightModes, flightModesHandler] = useListState([
    'UNKNOWN',
    'UNKNOWN',
    'UNKNOWN',
    'UNKNOWN',
    'UNKNOWN',
    'UNKNOWN',
  ])
  const [flightModeChannel, setFlightModeChannel] = useState('UNKNOWN')
  const [currentFlightMode, setCurrentFlightMode] = useState('UNKNOWN')
  const [currentPwmValue, setCurrentPwmValue] = useState(0)

  useEffect(() => {
    socket.emit('set_state', { state: 'config.flight_modes' })
    socket.emit('get_flight_mode_config')

    socket.on('flight_mode_config', (data) => {
      flightModesHandler.setState(data.flight_modes)
      setFlightModeChannel(data.flight_mode_channel)
    })

    return () => {
      socket.emit('set_state', { state: 'config' })
      socket.off('flight_mode_config')
    }
  }, [])

  useEffect(() => {
    socket.on('incoming_msg', (msg) => {
      if (
        msg.mavpackettype === 'RC_CHANNELS' &&
        flightModeChannel !== 'UNKNOWN'
      ) {
        setCurrentPwmValue(msg[`chan${flightModeChannel}_raw`])
      }
    })

    return () => {
      socket.off('incoming_msg')
    }
  }, [flightModeChannel])

  function isFlightModeActive(mode_idx) {
    if (FLIGHT_MODE_PWM_VALUES[mode_idx][1] === undefined) {
      return currentPwmValue >= FLIGHT_MODE_PWM_VALUES[mode_idx][0]
    }

    return (
      currentPwmValue >= FLIGHT_MODE_PWM_VALUES[mode_idx][0] &&
      currentPwmValue <= FLIGHT_MODE_PWM_VALUES[mode_idx][1]
    )
  }

  return (
    <div className='m-6 flex flex-row gap-4'>
      <div className='flex flex-col gap-2'>
        {flightModes.map((modeNumber, idx) => (
          <Select
            key={idx}
            label={`Flight mode ${idx}`}
            description={`PWM: ${FLIGHT_MODE_PWM_VALUES[idx][0]}${FLIGHT_MODE_PWM_VALUES[idx][1] === undefined ? '+' : `-${FLIGHT_MODE_PWM_VALUES[idx][1]}`}`}
            value={modeNumber.toString()}
            data={Object.keys(COPTER_MODES_FLIGHT_MODE_MAP).map(
              (flight_mode_number) => ({
                value: flight_mode_number.toString(),
                label: COPTER_MODES_FLIGHT_MODE_MAP[flight_mode_number],
              }),
            )}
            classNames={
              isFlightModeActive(idx) ? { input: '!text-lime-400' } : {}
            }
          />
        ))}
        <Button mt='10'>Set flight modes</Button>
      </div>
      <div>
        <p>Current Mode: {currentFlightMode}</p>
        <p>Flight mode channel: {flightModeChannel}</p>
        <p>Current PWM: {currentPwmValue}</p>
      </div>
    </div>
  )
}
