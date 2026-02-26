// Servo Output Configuration Page
import { useEffect, useState } from "react"
import {
  Table,
  Button,
  NumberInput,
  Checkbox,
  Select,
  Modal,
  Text,
  Progress,
} from "@mantine/core"
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Custom components, helpers and data
import apmParamDefsCopter from "../../../data/gen_apm_params_def_copter.json"
import apmParamDefsPlane from "../../../data/gen_apm_params_def_plane.json"

import { useSelector, useDispatch } from "react-redux"
import { selectAircraftType } from "../../redux/slices/droneInfoSlice"
import {
  emitGetServoConfig,
  emitSetServoConfigParam,
  emitBatchSetServoConfigParams,
  selectServoConfig,
  selectServoPwmOutputs,
  updateServoConfigParam,
} from "../../redux/slices/configSlice"
import { emitSetState } from "../../redux/slices/droneConnectionSlice"
import { selectConnectedToDrone } from "../../redux/slices/droneConnectionSlice"

export default function ServoOutput() {
  const dispatch = useDispatch()
  const [testModalOpen, setTestModalOpen] = useState(false)
  const [testServoIdx, setTestServoIdx] = useState(null)
  const [testPwm, setTestPwm] = useState(1500)

  const aircraftType = useSelector(selectAircraftType)
  const servoConfig = useSelector(selectServoConfig)
  const servoPwmOutputs = useSelector(selectServoPwmOutputs)
  const connected = useSelector(selectConnectedToDrone)

  // Helper to get paramDef for a given param_id
  function getParamDef(param_id) {
    if (aircraftType === 1) return apmParamDefsPlane[param_id]
    if (aircraftType === 2) return apmParamDefsCopter[param_id]
    return undefined
  }

  // Helper to handle param change
  function handleParamChange(param_id, value) {
    dispatch(
      emitSetServoConfigParam({
        param_id,
        value: parseInt(value),
      }),
    )
  }

  function handleOpenTestModal(servoNum) {
    setTestServoIdx(servoNum)
    setTestPwm(1500)
    setTestModalOpen(true)
  }

  function handleSendTestPwm() {
    // TODO: Implement test servo PWM send
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
    const config = servoConfig[num] || {}
    return {
      number: num,
      function: config.function,
      min: config.min,
      trim: config.trim,
      max: config.max,
      reversed: config.reversed === 1 || config.reversed === "1",
      pwm: servoPwmOutputs[num] || 0,
    }
  })

  useEffect(() => {
    if (connected) {
      dispatch(emitSetState("config.servo"))
      dispatch(emitGetServoConfig())
    }
  }, [connected, dispatch])

  return (
    <div className="p-4 overflow-auto">
      {/* Modal for sending test PWM */}
      <Modal
        opened={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title={`Test Servo Output #${testServoIdx}`}
        centered
      >
        <Text mb={8}>Enter PWM value to send:</Text>
        <NumberInput
          value={testPwm}
          min={800}
          max={2200}
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
            <Table.Th>Reversed</Table.Th>
            <Table.Th>Function</Table.Th>
            <Table.Th style={{ width: "70px" }}>Min</Table.Th>
            <Table.Th style={{ width: "70px" }}>Trim</Table.Th>
            <Table.Th style={{ width: "70px" }}>Max</Table.Th>
            <Table.Th>Test</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {servoRows.map((servo, idx) => {
            const num = servo.number
            const fnParam = `SERVO${num}_FUNCTION`
            const minParam = `SERVO${num}_MIN`
            const trimParam = `SERVO${num}_TRIM`
            const maxParam = `SERVO${num}_MAX`
            const revParam = `SERVO${num}_REVERSED`

            const fnDef = getParamDef(fnParam)
            const minDef = getParamDef(minParam)
            const trimDef = getParamDef(trimParam)
            const maxDef = getParamDef(maxParam)

            const fnOptions = fnDef?.Values
              ? Object.entries(fnDef.Values).map(([value, label]) => ({
                  value,
                  label: `${value}: ${label}`,
                }))
              : []

            const pwmPercentage =
              servo.pwm && servo.min && servo.max
                ? Math.max(
                    0,
                    Math.min(
                      100,
                      ((servo.pwm - servo.min) / (servo.max - servo.min)) * 100,
                    ),
                  )
                : 0

            return (
              <Table.Tr key={num} className="h-12">
                <Table.Td>{num}</Table.Td>
                <Table.Td>
                  <Progress.Root className="!h-6 !w-64">
                    <Progress.Section
                      value={pwmPercentage}
                      color={COLOURS[idx % COLOURS.length]}
                    >
                      <Progress.Label className="!text-lg !font-normal">
                        {servo.pwm || "--"}
                      </Progress.Label>
                    </Progress.Section>
                  </Progress.Root>
                </Table.Td>
                <Table.Td>
                  <Checkbox
                    checked={servo.reversed}
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
                    value={servo.function?.toString() || ""}
                    placeholder="Select function"
                    size="xs"
                    className="min-w-[120px]"
                    onChange={(val) => handleParamChange(fnParam, val)}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={servo.min || ""}
                    min={minDef?.Range?.low ? Number(minDef.Range.low) : 800}
                    max={minDef?.Range?.high ? Number(minDef.Range.high) : 2200}
                    size="xs"
                    style={{ width: "60px" }}
                    onChange={(val) => handleParamChange(minParam, val)}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={servo.trim || ""}
                    min={trimDef?.Range?.low ? Number(trimDef.Range.low) : 800}
                    max={
                      trimDef?.Range?.high ? Number(trimDef.Range.high) : 2200
                    }
                    size="xs"
                    style={{ width: "60px" }}
                    onChange={(val) => handleParamChange(trimParam, val)}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={servo.max || ""}
                    min={maxDef?.Range?.low ? Number(maxDef.Range.low) : 800}
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
                    onClick={() => handleOpenTestModal(num)}
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
