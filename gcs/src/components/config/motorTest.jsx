/*
  This is the motor test panel for the config page.

  Allows testing the motors individually,in-sequence and simultaneously with throttle and duration parameters for the test. Shows frame type and class of drone
*/
// Base Imports
import { useEffect, useState } from "react"

// 3rd Party Imports
import { Button, NumberInput } from "@mantine/core"
import { useSessionStorage } from "@mantine/hooks"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Custom helper function
import {
  FRAME_CLASS_MAP,
  MOTOR_LETTER_LABELS,
} from "../../helpers/mavlinkConstants"
import { socket } from "../../helpers/socket"

export default function MotorTestPanel() {
  const [connected] = useSessionStorage({
    key: "connectedToDrone",
    defaultValue: false,
  })
  const [frameTypeOrder, setFrameTypeOrder] = useState(null)
  const [frameTypeDirection, setFrameTypeDirection] = useState(null)
  const [frameTypename, setFrameTypename] = useState(null)
  const [frameClass, setFrameClass] = useState(null)
  const [numberOfMotors, setNumberOfMotors] = useState(4)
  const [selectedThrottle, setSelectedThrottle] = useState(10)
  const [selectedDuration, setSelectedDuration] = useState(2)

  useEffect(() => {
    if (connected) {
      socket.emit("set_state", { state: "config.motor_test" })
      socket.emit("get_frame_config")
    }
    socket.on("frame_type_config", (data) => {
      const currentFrameType = data.frame_type
      const currentFrameClass = data.frame_class

      // Checks if the frame class has any compatible frame types and if the current frame type param is comaptible
      if (FRAME_CLASS_MAP[currentFrameClass].frametype) {
        if (
          Object.keys(FRAME_CLASS_MAP[currentFrameClass].frametype).includes(
            currentFrameType.toString(),
          )
        ) {
          const frameInfo =
            FRAME_CLASS_MAP[currentFrameClass].frametype[currentFrameType]
          setFrameTypeDirection(frameInfo.direction)
          setFrameTypeOrder(frameInfo.motorOrder)
          setFrameTypename(frameInfo.frametypename)
        }
      } else {
        setFrameTypeDirection(null)
        setFrameTypeOrder(null)
        setFrameTypename(currentFrameType)
      }
      setFrameClass(FRAME_CLASS_MAP[currentFrameClass].name)
      setNumberOfMotors(FRAME_CLASS_MAP[currentFrameClass].numberOfMotors)
    })

    return () => {
      socket.emit("set_state", { state: "config" })
      socket.off("frame_type_config")
    }
  }, [connected])
  // Test a single motor with the specified throttle and duration
  function testOneMotor(motorInstance) {
    socket.emit("test_one_motor", {
      motorInstance: motorInstance,
      throttle: selectedThrottle,
      duration: selectedDuration,
    })
  }

  // Test the motors individually in sequence with the specified throttle and time delay
  function testMotorSequence() {
    socket.emit("test_motor_sequence", {
      throttle: selectedThrottle,
      // This is actually the delay between tests since it's a sequence test
      duration: selectedDuration,
      numberOfMotors: numberOfMotors,
    })
  }

  // Test all the motors simultaneously with the specified throttle and duration
  function testAllMotors() {
    socket.emit("test_all_motors", {
      throttle: selectedThrottle,
      duration: selectedDuration,
      numOfMotors: numberOfMotors,
    })
  }

  return (
    <div className="flex flex-row gap-16 px-4">
      <div className="flex flex-col gap-2">
        {/* Input throttle and duration/delay of the test*/}
        <div className="flex gap-2">
          <NumberInput
            label="Throttle"
            value={selectedThrottle}
            onChange={setSelectedThrottle}
            suffix="%"
            min={0}
            max={100}
            className="w-full"
          />
          <NumberInput
            label="Duration"
            value={selectedDuration}
            onChange={setSelectedDuration}
            suffix="s"
            min={0}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-2 mt-6">
          {/* Individual motor testing buttons */}
          {MOTOR_LETTER_LABELS.slice(0, numberOfMotors).map((motor, index) => (
            <Button
              key={index}
              onClick={() => {
                testOneMotor(index + 1)
              }}
              color={tailwindColors.blue[600]}
            >
              Test motor {motor}
            </Button>
          ))}
          <Button
            onClick={() => {
              testMotorSequence()
            }}
            color={tailwindColors.green[600]}
            label="x"
          >
            Test motor sequence
          </Button>
          <Button
            onClick={() => {
              testAllMotors()
            }}
            color={tailwindColors.red[600]}
          >
            Test all motors
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="mt-6">
          {frameTypename !== null && (
            <>
              <p>Frame: {frameClass}</p>
              <p>Type: {frameTypename} </p>
            </>
          )}
        </div>
        <div className="flex flex-col gap-4">
          {/* Motor Order and direction details */}
          {frameTypeOrder !== null && (
            <div>
              {frameTypeOrder.map((mappedMotorNumber, idx) => {
                return (
                  <p key={idx}>
                    {" "}
                    Motor number: {mappedMotorNumber}, {frameTypeDirection[idx]}{" "}
                  </p>
                )
              })}

              {/* Link for user to check their motor order diagram*/}
              <a
                className="text-sm text-blue-400 hover:underline"
                href="https://ardupilot.org/copter/docs/connect-escs-and-motors.html#motor-order-diagrams"
                target="_blank"
              >
                Click here to see your motor numbers and directions
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
