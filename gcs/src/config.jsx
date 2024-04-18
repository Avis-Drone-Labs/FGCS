/*
  The config screen. TODO: Someone please write about this
*/

// Base imports
import { useEffect, useState } from 'react'

// 3rd Party Imports
import { Button, NumberInput, Tabs } from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'

// Styling imports
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config'

// Custom component and helpers
import {
  showErrorNotification,
  showSuccessNotification,
} from './helpers/notification'
import { socket } from './helpers/socket'
import Layout from './components/layout'

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

export default function Config() {
  const [connected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })
  const [gripperEnabled, setGripperEnabled] = useState(false)

  useEffect(() => {
    if (!connected) {
      return
    }

    if (connected) {
      socket.emit('set_state', { state: 'config' })
      socket.emit('gripper_enabled')
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

    return () => {
      socket.off('gripper_enabled')
      socket.off('set_gripper_result')
      socket.off('motor_test_result')
    }
  }, [connected])

  return (
    <Layout currentPage='config'>
      {connected && (
        <div className='w-full h-full'>
          <Tabs
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
              <Tabs.Tab value='flightmodes' disabled>
                Flight Modes
              </Tabs.Tab>
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
          </Tabs>
        </div>
      )}
    </Layout>
  )
}
