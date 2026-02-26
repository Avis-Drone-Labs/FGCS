// Servo Output Configuration Page Scaffold
import { useEffect, useState } from "react"
import {
  Table,
  Button,
  NumberInput,
  Progress,
  Checkbox,
  Select,
  Modal,
  Text,
} from "@mantine/core"
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors
import { io } from "socket.io-client"
const socket = io()

// Custom components, helpers and data
import apmParamDefsCopter from "../../../data/gen_apm_params_def_copter.json"
import apmParamDefsPlane from "../../../data/gen_apm_params_def_plane.json"

import { useSelector, useDispatch } from "react-redux"
import { selectAircraftType } from "../../redux/slices/droneInfoSlice"
import {
  selectParams,
  selectModifiedParams,
  appendModifiedParams,
  updateModifiedParamValue,
} from "../../redux/slices/paramsSlice"
import { emitRefreshParams } from "../../redux/slices/paramsSlice"
import { emitSetState } from "../../redux/slices/droneConnectionSlice"
import { selectConnectedToDrone } from "../../redux/slices/droneConnectionSlice"
import { selectServoOutputs } from "../../redux/slices/servoOutputSlice"

export default function ServoOutput() {
  const dispatch = useDispatch()
  const [testModalOpen, setTestModalOpen] = useState(false)
  const [testServoIdx, setTestServoIdx] = useState(null)
  const [testPwm, setTestPwm] = useState(1500)
  const aircraftType = useSelector(selectAircraftType)
  const params = useSelector(selectParams)
  const modifiedParams = useSelector(selectModifiedParams)
  const connected = useSelector(selectConnectedToDrone)
  const servoOutputs = useSelector(selectServoOutputs)

  // Helper to get param value (modified or current)
  function getParamValue(param_id) {
    const mod = modifiedParams.find((p) => p.param_id === param_id)
    if (mod) return mod.param_value
    const orig = params.find((p) => p.param_id === param_id)
    return orig ? orig.param_value : ""
  }

  // Helper to get paramDef for a given param_id
  function getParamDef(param_id) {
    if (aircraftType === 1) return apmParamDefsPlane[param_id]
    if (aircraftType === 2) return apmParamDefsCopter[param_id]
    return undefined
  }

  // Helper to update param value in Redux
  function handleParamChange(param_id, value) {
    const orig = params.find((p) => p.param_id === param_id)
    if (!orig) return
    const param = { ...orig }
    if (modifiedParams.find((p) => p.param_id === param_id)) {
      dispatch(updateModifiedParamValue({ param_id, param_value: value }))
    } else {
      dispatch(
        appendModifiedParams([
          {
            param_id,
            param_value: value,
            param_type: param.param_type,
            initial_value: param.param_value,
          },
        ]),
      )
    }
  }

  function handleOpenTestModal(idx) {
    setTestServoIdx(idx)
    setTestPwm(1500) // Placeholder, as position is not available
    setTestModalOpen(true)
  }

  function handleSendTestPwm() {
    // Send test PWM to backend
    if (testServoIdx !== null && servoRows[testServoIdx]) {
      const servoNum = servoRows[testServoIdx].number
      socket.emit("set_servo_pwm", { servo: servoNum, pwm: testPwm })
    }
    setTestModalOpen(false)
  }

  const COLOURS = [
    tailwindColors.red[500],
    tailwindColors.orange[500],
    tailwindColors.yellow[500],
    tailwindColors.green[500],
    tailwindColors.blue[500],
    tailwindColors.indigo[500],
    tailwindColors.purple[500],
    tailwindColors.pink[500],
  ]

  // Build servo rows (1-16)
  const servoRows = Array.from({ length: 16 }, (_, i) => {
    const num = i + 1
    return {
      number: num,
      function: getParamValue(`SERVO${num}_FUNCTION`),
      min: getParamValue(`SERVO${num}_MIN`),
      trim: getParamValue(`SERVO${num}_TRIM`),
      max: getParamValue(`SERVO${num}_MAX`),
      reverse:
        getParamValue(`SERVO${num}_REVERSED`) === 1 ||
        getParamValue(`SERVO${num}_REVERSED`) === "1",
      pwm: servoOutputs[num] || null, // Use true output PWM
    }
  })

  useEffect(() => {
    if (connected) {
      dispatch(emitSetState("config.servo"))
      dispatch(emitRefreshParams())
    }
  }, [connected, dispatch])

  useEffect(() => {
    console.log("Updated servo outputs:", servoOutputs)
  }, [servoOutputs])

  return (
    <div className="p-4 overflow-auto">
      {/* Modal for sending test PWM */}
      <Modal
        opened={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title={`Test Servo Output #${testServoIdx !== null ? servoRows[testServoIdx]?.number : ""}`}
        centered
      >
        <Text mb={8}>Enter PWM value to send:</Text>
        <NumberInput
          value={testPwm}
          min={servoRows[testServoIdx]?.min || 800}
          max={servoRows[testServoIdx]?.max || 2200}
          onChange={setTestPwm}
        />
        <Button mt={16} color="blue" onClick={handleSendTestPwm}>
          Send PWM
        </Button>
      </Modal>

      <Table highlightOnHover withRowBorders={false} className="!w-fit">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>#</Table.Th>
            <Table.Th>Position</Table.Th>
            <Table.Th>Reverse</Table.Th>
            <Table.Th>Function</Table.Th>
            <Table.Th style={{ width: "70px" }}>Min</Table.Th>
            <Table.Th style={{ width: "70px" }}>Trim</Table.Th>
            <Table.Th style={{ width: "70px" }}>Max</Table.Th>
            <Table.Th>Test PWM</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {servoRows.map((servo, idx) => {
            // Param IDs
            const num = servo.number
            const fnParam = `SERVO${num}_FUNCTION`
            const minParam = `SERVO${num}_MIN`
            const trimParam = `SERVO${num}_TRIM`
            const maxParam = `SERVO${num}_MAX`
            const revParam = `SERVO${num}_REVERSED`

            // Param defs
            const fnDef = getParamDef(fnParam)
            const minDef = getParamDef(minParam)
            const trimDef = getParamDef(trimParam)
            const maxDef = getParamDef(maxParam)
            const revDef = getParamDef(revParam)

            // Function dropdown options
            const fnOptions = fnDef?.Values
              ? Object.entries(fnDef.Values).map(([value, label]) => ({
                  value,
                  label: `${value}: ${label}`,
                }))
              : []

            return (
              <Table.Tr key={num} className="h-12">
                <Table.Td>{num}</Table.Td>
                <Table.Td>
                  <Progress.Root className="!h-6 !w-64">
                    <Progress.Section
                      value={
                        servo.pwm && servo.min && servo.max
                          ? ((servo.pwm - servo.min) /
                              (servo.max - servo.min)) *
                            100
                          : 0
                      }
                      color={COLOURS[idx % COLOURS.length]}
                    >
                      <Progress.Label className="!text-lg !font-normal">
                        {servo.pwm ? `${servo.pwm}` : "--"}
                      </Progress.Label>
                    </Progress.Section>
                  </Progress.Root>
                </Table.Td>
                <Table.Td>
                  <Checkbox
                    checked={servo.reverse}
                    size="sm"
                    onChange={(event) =>
                      handleParamChange(
                        revParam,
                        event.currentTarget.checked ? 1 : 0,
                      )
                    }
                  />
                </Table.Td>
                <Table.Td>
                  <Select
                    data={fnOptions}
                    value={servo.function?.toString()}
                    placeholder="Select function"
                    size="xs"
                    className="min-w-[120px]"
                    onChange={(val) => handleParamChange(fnParam, val)}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={servo.min}
                    min={minDef?.Range?.low ? Number(minDef.Range.low) : 800}
                    max={
                      minDef?.Range?.high
                        ? Number(minDef.Range.high)
                        : servo.max
                    }
                    size="xs"
                    style={{ width: "60px" }}
                    onChange={(val) => handleParamChange(minParam, val)}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={servo.trim}
                    min={
                      trimDef?.Range?.low
                        ? Number(trimDef.Range.low)
                        : servo.min
                    }
                    max={
                      trimDef?.Range?.high
                        ? Number(trimDef.Range.high)
                        : servo.max
                    }
                    size="xs"
                    style={{ width: "60px" }}
                    onChange={(val) => handleParamChange(trimParam, val)}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={servo.max}
                    min={
                      maxDef?.Range?.low ? Number(maxDef.Range.low) : servo.min
                    }
                    max={maxDef?.Range?.high ? Number(maxDef.Range.high) : 2200}
                    size="xs"
                    style={{ width: "60px" }}
                    onChange={(val) => handleParamChange(maxParam, val)}
                  />
                </Table.Td>
                <Table.Td>
                  <Button
                    size="xs"
                    color="blue"
                    onClick={() => handleOpenTestModal(idx)}
                  >
                    Test
                  </Button>
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </div>
  )
}
