/*
  The config screen. TODO: Someone please write about this
*/

// Base imports
import { useEffect, useState } from 'react'

// 3rd Party Imports
import { Button, NumberInput, Select, Tabs } from '@mantine/core'
import { useListState, useLocalStorage } from '@mantine/hooks'

// Styling imports
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config'

// Custom component and helpers
import Layout from './components/layout'
import { COPTER_MODES } from './helpers/mavlinkConstants'
import {
  showErrorNotification,
  showSuccessNotification,
} from './helpers/notification'
import { socket } from './helpers/socket'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

function Gripper() {
  function setGripper(action) {
    socket.emit('set_gripper', action)
  }

  // Set gripper config values

  return (
    <div className='m-6 w-1/2'>
      <div className='flex flex-row gap-2'>
        <Button
          onClick={() => setGripper('release')}
          color={tailwindColors.falconred[100]}
        >
          Release Gripper
        </Button>
        <Button
          onClick={() => setGripper('grab')}
          color={tailwindColors.falconred[100]}
        >
          Grab Gripper
        </Button>
      </div>
    </div>
  )
}

function MotorTest() {
  const [selectedThrottle, setSelectedThrottle] = useState(10)
  const [selectedDuration, setSelectedDuration] = useState(2)

  function testOneMotor(motorInstance) {
    socket.emit('test_one_motor', {
      motorInstance: motorInstance,
      throttle: selectedThrottle,
      duration: selectedDuration,
    })
  }

  function testMotorSequence() {
    socket.emit('test_motor_sequence', {
      throttle: selectedThrottle,
      duration: selectedDuration, // This is actually the delay between tests since it's a sequence test
    })
  }

  function testAllMotors() {
    socket.emit('test_all_motors', {
      throttle: selectedThrottle,
      duration: selectedDuration,
    })
  }

  return (
    <div className='m-6 w-min'>
      <div className='flex flex-col gap-2'>
        <div className='flex gap-2'>
          <NumberInput
            label='Throttle'
            value={selectedThrottle}
            onChange={setSelectedThrottle}
            suffix='%'
            min={0}
            max={100}
            className='w-36'
          />
          <NumberInput
            label='Duration'
            value={selectedDuration}
            onChange={setSelectedDuration}
            suffix='s'
            min={0}
            className='w-36'
          />
        </div>
        <div className='flex flex-col mt-6 gap-2'>
          <Button
            onClick={() => {
              testOneMotor(1)
            }}
            color={tailwindColors.blue[600]}
          >
            Test motor A
          </Button>
          <Button
            onClick={() => {
              testOneMotor(2)
            }}
            color={tailwindColors.blue[600]}
          >
            Test motor B
          </Button>
          <Button
            onClick={() => {
              testOneMotor(3)
            }}
            color={tailwindColors.blue[600]}
          >
            Test motor C
          </Button>
          <Button
            onClick={() => {
              testOneMotor(4)
            }}
            color={tailwindColors.blue[600]}
          >
            Test motor D
          </Button>
          <Button
            onClick={() => {
              testMotorSequence()
            }}
            color={tailwindColors.lime[600]}
          >
            Test motor sequence
          </Button>
          <Button
            onClick={() => {
              testAllMotors()
            }}
            color={tailwindColors.pink[600]}
          >
            Test all motors
          </Button>
        </div>
        <a
          className='text-teal-300 hover:underline text-sm'
          href='https://ardupilot.org/copter/docs/connect-escs-and-motors.html#motor-order-diagrams'
          target='_blank'
        >
          Click here to see your motor numbers and directions
        </a>
      </div>
    </div>
  )
}

const FLIGHT_MODE_PWM_VALUES = [
  '0-1230',
  '1231-1360',
  '1361-1490',
  '1491-1620',
  '1621-1749',
  '1750+',
]

function FlightModes() {
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
    socket.on('flight_mode_config', (data) => {
      console.log(data)
      flightModesHandler.setState(data.flight_modes)
      setFlightModeChannel(data.flight_mode_channel)
    })

    return () => {
      socket.off('flight_mode_config')
    }
  }, [])

  console.log(
    flightModes,
    COPTER_MODES.map((modeName, index) => ({
      value: index.toString(),
      label: modeName,
    })),
  )

  return (
    <div className='m-6 flex flex-row gap-4'>
      <div className='flex flex-col gap-2'>
        {flightModes.map((modeNumber, idx) => (
          <Select
            label={`Flight mode ${idx}`}
            description={`PWM: ${FLIGHT_MODE_PWM_VALUES[idx]}`}
            value={modeNumber.toString()}
            data={COPTER_MODES.map((modeName, index) => ({
              value: index.toString(),
              label: modeName,
            }))}
          />
        ))}
        <Button mt='10'>Set flight modes</Button>
      </div>
      <div>
        <p>Current Mode: {currentFlightMode}l</p>
        <p>Flight mode channel: {flightModeChannel}</p>
        <p>Current PWM: {currentPwmValue}</p>
      </div>
    </div>
  )
}

export default function Config() {
  const [connected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })
  const [gripperEnabled, setGripperEnabled] = useState(false)

  useEffect(() => {
    if (!connected) {
      return
    } else {
      socket.emit('set_state', { state: 'config' })
      socket.emit('gripper_enabled')
      socket.emit('get_flight_mode_config')
    }

    socket.on('gripper_enabled', setGripperEnabled)

    socket.on('set_gripper_result', (data) => {
      console.log(data)
      if (data.success) {
        showSuccessNotification(data.message)
      } else {
        showErrorNotification(data.message)
      }
    })

    socket.on('motor_test_result', (data) => {
      if (data.success) {
        showSuccessNotification(data.message)
      } else {
        showErrorNotification(data.message)
      }
    })

    socket.on('param_set_success', (data) => {
      showSuccessNotification(data.message)
    })

    socket.on('params_error', (data) => {
      showErrorNotification(data.message)
    })

    return () => {
      socket.off('gripper_enabled')
      socket.off('set_gripper_result')
      socket.off('motor_test_result')
      socket.off('param_set_success')
      socket.off('params_error')
    }
  }, [connected])

  return (
    <Layout currentPage='config'>
      {
        <div className='w-full h-full'>
          <Tabs
            defaultValue='flightmodes'
            orientation='vertical'
            color={tailwindColors.falconred[100]}
            className='h-full'
          >
            <Tabs.List>
              <Tabs.Tab value='gripper' disabled={!gripperEnabled}>
                Gripper
              </Tabs.Tab>
              <Tabs.Tab value='motor_test'>Motor Test</Tabs.Tab>
              <Tabs.Tab value='rc_calibration' disabled>
                RC Calibration
              </Tabs.Tab>
              <Tabs.Tab value='flightmodes'>Flight modes</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value='gripper'>
              <Gripper />
            </Tabs.Panel>
            <Tabs.Panel value='motor_test'>
              <MotorTest />
            </Tabs.Panel>
            <Tabs.Panel value='rc_calibration'>
              <h1>RC Calibration Page</h1>
            </Tabs.Panel>
            <Tabs.Panel value='flightmodes'>
              <FlightModes />
            </Tabs.Panel>
          </Tabs>
        </div>
      }
    </Layout>
  )
}
