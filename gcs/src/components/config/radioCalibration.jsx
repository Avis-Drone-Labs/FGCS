/*
  This is the RC calibration component.

  You can see the different PWM inputs for each RC channel.
*/

// Base imports
import { useEffect, useState } from 'react'

// 3rd party imports
import { useLocalStorage } from '@mantine/hooks'

// Styling imports
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config'

// Helper javascript files
import { Progress } from '@mantine/core'
import { socket } from '../../helpers/socket'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const PWM_MIN = 800
const PWM_MAX = 2200

const colors = [
  tailwindColors.blue[500],
  tailwindColors.red[500],
  tailwindColors.green[500],
  tailwindColors.yellow[500],
  tailwindColors.purple[500],
  tailwindColors.indigo[500],
  tailwindColors.pink[500],
  tailwindColors.cyan[500],
  tailwindColors.teal[500],
  tailwindColors.lime[500],
  tailwindColors.orange[500],
  tailwindColors.emerald[500],
  tailwindColors.amber[500],
  tailwindColors.violet[500],
  tailwindColors.rose[500],
  tailwindColors.sky[500],
  tailwindColors.fuchsia[500],
  tailwindColors.stone[500],
  tailwindColors.slate[500],
]

function getPercentageValueFromPWM(pwmValue) {
  // Normalise the PWM value into a percentage value
  return ((pwmValue - PWM_MIN) / (PWM_MAX - PWM_MIN)) * 100
}

function getChannelName(channel) {
  switch (parseInt(channel)) {
    case 1:
      return 'Roll'
    case 2:
      return 'Pitch'
    case 3:
      return 'Throttle'
    case 4:
      return 'Yaw'
    default:
      return `Channel ${channel}`
  }
}

export default function RadioCalibration() {
  const [connected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })
  const [channels, setChannels] = useState({})

  useEffect(() => {
    if (!connected) {
      return
    }

    socket.emit('set_state', { state: 'config.rc_calibration' })

    socket.on('incoming_msg', (msg) => {
      if (msg.mavpackettype === 'RC_CHANNELS') {
        // Check to see if a RC_CHANNELS message has been received, if so get
        // all of the channel PWM values and set them in the state
        const chans = {}
        for (let i = 1; i < msg.chancount + 1; i++) {
          chans[i] = msg[`chan${i}_raw`]
          setChannels(chans)
        }
      }
    })

    return () => {
      socket.off('incoming_msg')
    }
  }, [connected])
  return (
    <div className='m-4 flex flex-row gap-4 relative'>
      <div className='flex flex-col gap-2 w-1/2'>
        {Object.keys(channels).map((channel, idx) => (
          <div key={idx} className='flex flex-row w-full items-center'>
            <p className='w-24'>{getChannelName(channel)}</p>
            <Progress.Root size='xl' className='w-full !h-6'>
              <Progress.Section
                value={getPercentageValueFromPWM(channels[channel])}
                color={colors[idx]}
              >
                <Progress.Label className='!text-lg !font-normal'>
                  {channels[channel]}
                </Progress.Label>
              </Progress.Section>
            </Progress.Root>
          </div>
        ))}
      </div>
    </div>
  )
}
