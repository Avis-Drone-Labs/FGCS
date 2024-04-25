/*
  The config screen. Allows the testing and configuration of the settings and parameters of the drone

  This includes gripper testing, motor testing, RC configuration and Flight mode configuration
*/

// Base imports
import { useEffect, useState } from 'react'

// 3rd Party Imports
import { Tabs } from '@mantine/core'
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
import Motortestpanel from './components/config/motorTest'
import Gripper from './components/config/gripper'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function Config() {
  const [connected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })

  // States in the frontend
  const [gripperEnabled, setGripperEnabled] = useState(false)
  const [selectedThrottle, setSelectedThrottle] = useState(10)
  const [selectedDuration, setSelectedDuration] = useState(2)

  // Set state variables and display acknowledgement messages from the drone
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
              <Motortestpanel
                selectedThrottle={selectedThrottle}
                selectedDuration={selectedDuration}
                setSelectedThrottle={setSelectedThrottle}
                setselectedDuration={setSelectedDuration}
              />
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
