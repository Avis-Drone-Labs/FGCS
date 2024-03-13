import { Button, NumberInput, Tabs } from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config'
import Layout from './components/layout'
import { showErrorNotification, showSuccessNotification } from './notification'
import { socket } from './socket'

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
          Open Gripper
        </Button>
        <Button
          onClick={() => setGripper('grab')}
          color={tailwindColors.falconred[100]}
        >
          Close Gripper
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
      delay: selectedDuration,
    })
  }

  function testAllMotors() {
    socket.emit('test_all_motors', {
      throttle: selectedThrottle,
      duration: selectedDuration,
    })
  }

  return (
    <div className='m-6'>
      <div className='flex flex-row gap-2'>
        <NumberInput
          value={selectedThrottle}
          onChange={setSelectedThrottle}
          suffix='%'
          min={0}
          max={100}
        />
        <NumberInput
          value={selectedDuration}
          onChange={setSelectedDuration}
          suffix='s'
          min={0}
        />
        <Button
          onClick={() => {
            testOneMotor(1)
          }}
        >
          Motor A
        </Button>
        <Button
          onClick={() => {
            testOneMotor(2)
          }}
        >
          Motor B
        </Button>
        <Button
          onClick={() => {
            testOneMotor(3)
          }}
        >
          Motor C
        </Button>
        <Button
          onClick={() => {
            testOneMotor(4)
          }}
        >
          Motor D
        </Button>
        <Button
          onClick={() => {
            testMotorSequence()
          }}
          color={tailwindColors.falconred[100]}
        >
          Test Motor Sequence
        </Button>
        <Button
          onClick={() => {
            testAllMotors()
          }}
          color={tailwindColors.falconred[100]}
        >
          Test All Motors
        </Button>
      </div>
    </div>
  )
}

export default function Config() {
  const [connected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })

  useEffect(() => {
    if (!connected) {
      return
    }

    if (connected) {
      socket.emit('set_state', { state: 'config' })
    }

    socket.on('motor_test_result', (data) => {
      if (data.result) {
        showSuccessNotification(data.message)
      } else {
        showErrorNotification(data.message)
      }
    })

    return () => {
      socket.off('motor_test_result')
    }
  }, [connected])

  return (
    <Layout currentPage='config'>
      {connected && (
        <div className='w-full h-full'>
          <Tabs
            defaultValue='gripper'
            orientation='vertical'
            color={tailwindColors.falconred[100]}
            className='h-full'
          >
            <Tabs.List>
              <Tabs.Tab value='gripper'>Gripper</Tabs.Tab>
              <Tabs.Tab value='motor_test'>Motor Test</Tabs.Tab>
              <Tabs.Tab value='rc_calibration' disabled>
                RC Calibration
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
