import { Button, Tabs } from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { useEffect } from 'react'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config'
import Layout from './components/layout'
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

    // socket.on('params', (params) => {
    //   paramsHandler.setState(params)
    //   shownParamsHandler.setState(params)
    //   setFetchingVars(false)
    //   setFetchingVarsProgress(0)
    //   setSearchValue('')
    // })

    return () => {
      // socket.off('params')
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
              <Tabs.Tab value='motor_test' disabled>
                Motor Test
              </Tabs.Tab>
              <Tabs.Tab value='rc_calibration' disabled>
                RC Calibration
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value='gripper'>
              <Gripper />
            </Tabs.Panel>
            <Tabs.Panel value='motor_test'>
              <h1>Motor Test Page</h1>
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
