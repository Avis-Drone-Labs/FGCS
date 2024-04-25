/*
  This is the motor test panel for the config page.

  Allows testing the motors individually,in-sequence and simultaneously with throttle and duration parameters for the test
*/

// 3rd Party Imports
import { Button, NumberInput } from '@mantine/core'

// Styling imports
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config'
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Custom helper function
import { socket } from '../../helpers/socket'

export default function Motortestpanel({
  selectedThrottle,
  selectedDuration,
  setSelectedThrottle,
  setSelectedDuration,
}) {
  // Test a single motor with the specified throttle and duration
  function testOneMotor(motorInstance) {
    socket.emit('test_one_motor', {
      motorInstance: motorInstance,
      throttle: selectedThrottle,
      duration: selectedDuration,
    })
  }
  // Test the motors individually in sequence with the specified throttle and time delay
  function testMotorSequence() {
    socket.emit('test_motor_sequence', {
      throttle: selectedThrottle,
      // This is actually the delay between tests since it's a sequence test
      duration: selectedDuration,
    })
  }

  // Test all the motors simultaneously with the specified throttle and duration
  function testAllMotors() {
    socket.emit('test_all_motors', {
      throttle: selectedThrottle,
      duration: selectedDuration,
    })
  }
  return (
    <div className='m-6 w-min'>
      <div className='flex flex-col gap-2'>
        {/* Input throttle and duration/delay of the test*/}
        <div className='flex gap-2'>
          <NumberInput
            label='Throttle'
            value={selectedThrottle}
            onChange={setSelectedThrottle}
            suffix='%'
            min={0}
            max={100}
            className='w-full'
          />
          <NumberInput
            label='Duration'
            value={selectedDuration}
            onChange={setSelectedDuration}
            suffix='s'
            min={0}
            className='w-full'
          />
        </div>
        <div className='flex flex-col mt-6 gap-2'>
          {/* Individual motor testing buttons*/}
          {['A', 'B', 'C', 'D'].map((motor, index) => (
            <Button
              key={index}
              onClick={() => {
                testOneMotor(index + 1)
              }}
              color={tailwindColors.lime[600]}
            >
              Test motor {motor}
            </Button>
          ))}
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
        {/* Link for user to check their motor order diagram*/}
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
