/*
  This is the motor test panel for the config page.

  Allows testing the motors individually,in-sequence and simultaneously with throttle and duration parameters for the test. Shows frame type and class of drone
*/
// Base Imports
import { useEffect, useState } from "react"

// 3rd Party Imports
import { Button, Modal, NumberInput } from "@mantine/core"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Custom helper function
import { MOTOR_LETTER_LABELS } from "../../helpers/mavlinkConstants"

// Redux

import { useDispatch, useSelector } from "react-redux"
import {
  emitGetFrameConfig,
  emitTestAllMotors,
  emitTestMotorSequence,
  emitTestOneMotor,
  selectFrameClass,
  selectFrameTypeDirection,
  selectFrameTypeName,
  selectFrameTypeOrder,
  selectNumberOfMotors,
  selectShowMotorTestWarningModal,
  setShowMotorTestWarningModal,
} from "../../redux/slices/configSlice"
import {
  emitSetState,
  selectConnectedToDrone,
} from "../../redux/slices/droneConnectionSlice"

export default function MotorTestPanel() {
  const dispatch = useDispatch()
  const connected = useSelector(selectConnectedToDrone)
  const frameTypeOrder = useSelector(selectFrameTypeOrder)
  const frameTypeDirection = useSelector(selectFrameTypeDirection)
  const frameTypename = useSelector(selectFrameTypeName)
  const frameClass = useSelector(selectFrameClass)
  const numberOfMotors = useSelector(selectNumberOfMotors)
  const showMotorTestWarningModal = useSelector(selectShowMotorTestWarningModal)

  const [selectedThrottle, setSelectedThrottle] = useState(10)
  const [selectedDuration, setSelectedDuration] = useState(2)

  useEffect(() => {
    if (connected) {
      dispatch(emitSetState("config.motor_test"))
      dispatch(emitGetFrameConfig())
    }
  }, [connected])

  // Test a single motor with the specified throttle and duration
  function testOneMotor(motorInstance) {
    dispatch(
      emitTestOneMotor({
        motorInstance: motorInstance,
        throttle: selectedThrottle,
        duration: selectedDuration,
      }),
    )
  }

  // Test the motors individually in sequence with the specified throttle and time delay
  function testMotorSequence() {
    dispatch(
      emitTestMotorSequence({
        throttle: selectedThrottle,
        // This is actually the delay between tests since it's a sequence test
        duration: selectedDuration,
        numberOfMotors: numberOfMotors,
      }),
    )
  }

  // Test all the motors simultaneously with the specified throttle and duration
  function testAllMotors() {
    dispatch(
      emitTestAllMotors({
        throttle: selectedThrottle,
        duration: selectedDuration,
        numberOfMotors: numberOfMotors,
      }),
    )
  }

  return (
    <div className="flex flex-row gap-16 px-4">
      <Modal
        opened={showMotorTestWarningModal}
        onClose={() => dispatch(setShowMotorTestWarningModal(false))}
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <div className="flex flex-col items-start justify-center gap-4">
          <p>
            Ensure all propellers are removed and the drone is secured before
            testing the motors.
          </p>
          <p className="font-bold text-falconred-600">
            Improper testing can lead to injury or damage.
          </p>

          <div className="mx-auto">
            <Button
              color={tailwindColors.green[600]}
              onClick={() => dispatch(setShowMotorTestWarningModal(false))}
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>
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
            >
              Test motor {motor}
            </Button>
          ))}
          <Button
            onClick={() => {
              testMotorSequence()
            }}
            color={"green"}
            label="x"
          >
            Test motor sequence
          </Button>
          <Button
            onClick={() => {
              testAllMotors()
            }}
            color={"red"}
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
