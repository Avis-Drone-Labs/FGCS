/*
  The config screen. TODO: Someone please write about this
*/

// Base imports
import { useEffect, useState } from 'react'

// 3rd Party Imports
import { Button, NumberInput, Select, Tabs, Text } from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'

// Styling imports
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config'

// Custom component and helpers
import Layout from './components/layout'
import {
  showErrorNotification,
  showSuccessNotification,
} from './helpers/notification'
import { socket } from './helpers/socket'
import { COPTER_MODES } from './mavlinkConstants'

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

function Flightmodes() {
  const [flightmode1value, setflightmode1] = useState('')
  const [flightmode2value, setflightmode2] = useState('')
  const [flightmode3value, setflightmode3] = useState('')
  const [flightmode4value, setflightmode4] = useState('')
  const [flightmode5value, setflightmode5] = useState('')
  const [flightmode6value, setflightmode6] = useState('')
  const flightmodelist = [
    { fvalue: flightmode1value, param: 'FLTMODE1' },
    { fvalue: flightmode2value, param: 'FLTMODE2' },
    { fvalue: flightmode3value, param: 'FLTMODE3' },
    { fvalue: flightmode4value, param: 'FLTMODE4' },
    { fvalue: flightmode5value, param: 'FLTMODE5' },
    { fvalue: flightmode6value, param: 'FLTMODE6' },
  ]
  const onchangers = [
    setflightmode1,
    setflightmode2,
    setflightmode3,
    setflightmode4,
    setflightmode5,
    setflightmode6,
  ]

  useEffect(() => {
    socket.emit('get_flightmodes')
    socket.on('current_flightmodes', (values) => {
      for (let i = 0; i < 6; i++) {
        onchangers[i](values[i])
      }
    })
  }, [])

  function setflightmodes() {
    const multipleparams = new Array(6).fill(undefined)

    for (const modes in flightmodelist) {
      console.log(modes)
      console.log(flightmodelist[modes].fvalue)
      switch (flightmodelist[modes].fvalue) {
        case COPTER_MODES[0]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 0,
            param_type: 1,
          }
          break
        case COPTER_MODES[1]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 1,
            param_type: 1,
          }
          break
        case COPTER_MODES[2]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 2,
            param_type: 1,
          }
          break
        case COPTER_MODES[3]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 3,
            param_type: 1,
          }
          break
        case COPTER_MODES[4]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 4,
            param_type: 1,
          }
          break
        case COPTER_MODES[5]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 5,
            param_type: 1,
          }
          break
        case COPTER_MODES[6]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 6,
            param_type: 1,
          }
          break
        case COPTER_MODES[7]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 7,
            param_type: 1,
          }
          break
        case COPTER_MODES[8]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 9,
            param_type: 1,
          }
          break
        case COPTER_MODES[9]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 11,
            param_type: 1,
          }
          break
        case COPTER_MODES[10]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 13,
            param_type: 1,
          }
          break
        case COPTER_MODES[11]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 14,
            param_type: 1,
          }
          break
        case COPTER_MODES[12]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 15,
            param_type: 1,
          }
          break
        case COPTER_MODES[13]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 16,
            param_type: 1,
          }
          break
        case COPTER_MODES[14]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 17,
            param_type: 1,
          }
          break
        case COPTER_MODES[15]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 18,
            param_type: 1,
          }
          break
        case COPTER_MODES[16]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 19,
            param_type: 1,
          }
          break
        case COPTER_MODES[17]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 20,
            param_type: 1,
          }
          break
        case COPTER_MODES[18]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 21,
            param_type: 1,
          }
          break
        case COPTER_MODES[19]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 22,
            param_type: 1,
          }
          break
        case COPTER_MODES[20]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 23,
            param_type: 1,
          }
          break
        case COPTER_MODES[21]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 24,
            param_type: 1,
          }
          break
        case COPTER_MODES[22]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 25,
            param_type: 1,
          }
          break
        case COPTER_MODES[23]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 26,
            param_type: 1,
          }
          break
        case COPTER_MODES[24]:
          multipleparams[modes] = {
            param_id: flightmodelist[modes].param,
            param_value: 27,
            param_type: 1,
          }
          break
        default:
          break
      }
    }
    const undefine = multipleparams.some((value) => value === undefined)
    if (!undefine) {
      console.log(multipleparams)
      socket.emit('set_multiple_params', multipleparams)
    } else {
      showErrorNotification(
        'Please select appropriate values for flight modes from the dropdown',
      )
    }
  }
  return (
    <div className='m-6 flex flex-col gap-5'>
      <div className='flex flex-col mb-5 ml-40'>
        <Text>Current Mode: Manual</Text>
        <Text>Current PWM: 8:0</Text>
      </div>
      <div className='flex flex-row gap-x-24'>
        <div className='flex flex-col gap-4'>
          {['Mode 1', 'Mode 2', 'Mode 3', 'Mode 4', 'Mode 5', 'Mode 6'].map(
            (label, index) => (
              <Text key={index}>{label}</Text>
            ),
          )}
        </div>
        <div className='flex flex-col gap-1'>
          {flightmodelist.map((modeIndex, idx) => (
            <Select
              placeholder={modeIndex.fvalue}
              value={modeIndex.fvalue}
              data={Array.from(COPTER_MODES)}
              onChange={onchangers[idx]}
            />
          ))}
          <Button onClick={setflightmodes} mt='10'>
            Set flight modes
          </Button>
        </div>

        <div className='flex flex-col gap-4'>
          {[
            '0-1230',
            '1231-1360',
            '1361-1490',
            '1491-1620',
            '1621-1749',
            '1750+',
          ].map((label) => (
            <Text key={label}>PWM {label}</Text>
          ))}
        </div>
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
    }

    if (connected) {
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
              <Tabs.Tab value='gripper'>Gripper</Tabs.Tab>
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
              <Flightmodes />
            </Tabs.Panel>
          </Tabs>
        </div>
      }
    </Layout>
  )
}
