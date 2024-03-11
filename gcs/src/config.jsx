import { Button, NumberInput, Tabs } from '@mantine/core'
import { useLocalStorage, useSetState } from '@mantine/hooks'
import { useEffect } from 'react'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config'
import Layout from './components/layout'
import { socket } from './socket'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

function ActuatorTest() {
  const [values, setValues] = useSetState({
    act1: null,
    act2: null,
    act3: null,
    act4: null,
    act5: null,
    act6: null,
    offsetIndex: 0,
  })

  const sharedInputProps = {
    description: 'PWM value',
    min: 800,
    max: 2200,
    allowDecimal: false,
    suffix: 'μs',
  }

  function setActuators() {
    console.log(values)
    socket.emit('set_actuators', values)
  }

  return (
    <div className='m-6 w-1/2'>
      <div className='flex flex-col gap-2'>
        <NumberInput
          label='Offset index'
          description='Index of actuator set (i.e if set to 1, Actuator 1 becomes Actuator 7)'
          value={values.offsetIndex}
          onChange={(val) => setValues({ offsetIndex: val })}
          min={0}
          allowDecimal={false}
          className='w-96'
        />
        <NumberInput
          label='Actuator 1'
          value={values.act1}
          onChange={(val) => setValues({ act1: val })}
          {...sharedInputProps}
        />
        <NumberInput
          label='Actuator 2'
          value={values.act2}
          onChange={(val) => setValues({ act2: val })}
          {...sharedInputProps}
        />
        <NumberInput
          label='Actuator 3'
          value={values.act3}
          onChange={(val) => setValues({ act3: val })}
          {...sharedInputProps}
        />
        <NumberInput
          label='Actuator 4'
          value={values.act4}
          onChange={(val) => setValues({ act4: val })}
          {...sharedInputProps}
        />
        <NumberInput
          label='Actuator 5'
          value={values.act5}
          onChange={(val) => setValues({ act5: val })}
          {...sharedInputProps}
        />
        <NumberInput
          label='Actuator 6'
          value={values.act6}
          onChange={(val) => setValues({ act6: val })}
          {...sharedInputProps}
        />
      </div>
      <Button
        onClick={setActuators}
        color={tailwindColors.green[600]}
        className='my-4'
      >
        Set actuators
      </Button>
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
      {!connected && (
        <div className='w-full h-full'>
          <Tabs
            defaultValue='actuator_test'
            orientation='vertical'
            color={tailwindColors.falconred[100]}
            className='h-full'
          >
            <Tabs.List>
              <Tabs.Tab value='actuator_test'>Actuator Test</Tabs.Tab>
              <Tabs.Tab value='motor_test' disabled>
                Motor Test
              </Tabs.Tab>
              <Tabs.Tab value='rc_calibration' disabled>
                RC Calibration
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value='actuator_test'>
              <ActuatorTest />
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
