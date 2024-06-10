/*
  This is the motor test panel for the config page.

  Allows testing the motors individually,in-sequence and simultaneously with throttle and duration parameters for the test
*/
// Base Imports
import {useEffect,useState} from "react";

// 3rd Party Imports
import { Button, NumberInput } from '@mantine/core'

// Styling imports
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config'
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Custom helper function
import { socket } from '../../helpers/socket'
import {useLocalStorage} from "@mantine/hooks";
import {FRAME_CLASS_MAP} from "../../helpers/mavlinkConstants";


export default function Motortestpanel() {
  const [connected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })
  const [frameType,setFrameType] = useState({motorOrder:null,direction:null,ftype:null})
  const [frameClass, setFrameClass] = useState(null)
  const [numberOfMotors,setNumberOfMotors] = useState(4)
  const [selectedThrottle, setSelectedThrottle] = useState(10)
  const [selectedDuration, setSelectedDuration] = useState(2)


  useEffect(()=>{
    if(!connected){
      return;
    } else {
      socket.emit('set_state',{state:'config.motor_test'})
      socket.emit('get_frame_config')
    }
    socket.on("frame_type_config",(data) => {
      let frameType = data.frame_type
      let frameClass = data.frame_class
      if (FRAME_CLASS_MAP[frameClass].frametype){
        if(Object.keys(FRAME_CLASS_MAP[frameClass].frametype).includes(frameType.toString())){
         setFrameType(FRAME_CLASS_MAP[frameClass].frametype[frameType])
        }
      } else {
        setFrameType({motorOrder:null,direction:null,ftype:frameType})
      }
      setFrameClass(FRAME_CLASS_MAP[frameClass].name)
      setNumberOfMotors(FRAME_CLASS_MAP[frameClass].numberOfMotors)
    })

    return () => {
      socket.emit('set_state',{state:'config'})
      socket.off("frame_type_config")
  }
  },[])
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
      numberOfMotors: numberOfMotors
    })
  }

  // Test all the motors simultaneously with the specified throttle and duration
  function testAllMotors() {
    socket.emit('test_all_motors', {
      throttle: selectedThrottle,
      duration: selectedDuration,
      numOfMotors: numberOfMotors
    })
  }

  return (
    <div className='m-6 w-min flex flex-row gap-16'>
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

        <div className='flex flex-col gap-2 mt-6'>
          {/* Individual motor testing buttons*/}
          {frameClass != null && (
              <>
                <p> FrameClass:{frameClass} </p>
              </>
          )}
          {[Array.from({length:numberOfMotors},(index)=>{index+1})].map((motor, index) => (
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
            label='x'
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
          className='text-sm text-teal-300 hover:underline'
          href='https://ardupilot.org/copter/docs/connect-escs-and-motors.html#motor-order-diagrams'
          target='_blank'
        >
          Click here to see your motor numbers and directions
        </a>
      </div>
      <div className='flex flex-col gap-16 mt-2'>
        <div>
          {frameType.ftype != null && (
              <>
                <p> Type:{frameType.ftype} </p>
              </>
          )}
        </div>
        <div className='flex flex-col gap-5'>
          {frameType.motorOrder != null  && (
              <>
              {frameType.motorOrder.map((mappedMotorNumber,idx)=>{
                return(<h> MotorNumber:{mappedMotorNumber},{frameType.direction[idx]} </h>)}
              )}
              </>
          )
          }
        </div>
      </div>
    </div>
  )
}
