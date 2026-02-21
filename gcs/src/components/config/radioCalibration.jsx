/*
  This is the RC calibration component.

  You can see the different PWM inputs for each RC channel.
*/

// Base imports
import { useEffect, useMemo, useState } from "react"

// Helper javascript files
import {
  Button,
  Checkbox,
  Modal,
  Progress,
  Select,
  Table,
  Text,
} from "@mantine/core"
import apmParamDefsCopter from "../../../data/gen_apm_params_def_copter.json"
import apmParamDefsPlane from "../../../data/gen_apm_params_def_plane.json"

// Redux
import { useDispatch, useSelector } from "react-redux"
import {
  emitBatchSetRcConfigParams,
  emitGetRcConfig,
  emitSetRcConfigParam,
  selectRadioCalibrationModalOpen,
  selectRadioChannelsConfig,
  selectRadioPwmChannels,
  setRadioCalibrationModalOpen,
} from "../../redux/slices/configSlice"
import {
  emitSetState,
  selectConnectedToDrone,
} from "../../redux/slices/droneConnectionSlice"
import { selectAircraftTypeString } from "../../redux/slices/droneInfoSlice"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const PWM_MIN = 800
const PWM_MAX = 2200

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

function getPercentageValueFromPWM(pwmValue) {
  // Normalise the PWM value into a percentage value
  return ((pwmValue - PWM_MIN) / (PWM_MAX - PWM_MIN)) * 100
}

export default function RadioCalibration() {
  const dispatch = useDispatch()
  const connected = useSelector(selectConnectedToDrone)
  const aircraftTypeString = useSelector(selectAircraftTypeString)
  const pwmChannels = useSelector(selectRadioPwmChannels)
  const channelsConfig = useSelector(selectRadioChannelsConfig)

  const calibrationModalOpened = useSelector(selectRadioCalibrationModalOpen)
  const [initialCalibrationPwms, setInitialCalibrationPwms] = useState(null)
  const [calibrationData, setCalibrationData] = useState({})

  const paramDefs = useMemo(() => {
    return aircraftTypeString === "Copter"
      ? apmParamDefsCopter
      : apmParamDefsPlane
  }, [aircraftTypeString])

  const rcSelectOptions = useMemo(() => {
    const rcOptions = paramDefs.RC1_OPTION?.Values
    if (!rcOptions) return []

    return Object.entries(rcOptions)
      .sort((a, b) => {
        // Always put "0" first
        if (a[0] === "0") return -1
        if (b[0] === "0") return 1
        // Then sort by label alphabetically
        return a[1].localeCompare(b[1])
      })
      .map(([value, label]) => ({
        value: value,
        label: label,
      }))
  }, [paramDefs])

  function handleRcOptionChange(channel, newOption) {
    dispatch(
      emitSetRcConfigParam({
        param_id: `RC${channel}_OPTION`,
        value: parseInt(newOption),
      }),
    )
  }

  function handleReversedChange(channel, isReversed) {
    dispatch(
      emitSetRcConfigParam({
        param_id: `RC${channel}_REVERSED`,
        value: isReversed ? 1 : 0,
      }),
    )
  }

  function getChannelUsageString(channel) {
    if (channelsConfig[channel]?.map) {
      return channelsConfig[channel]?.map
    } else if (channelsConfig[channel]?.option !== 0) {
      return channelsConfig[channel]?.option?.toString() || null
    }
    return null
  }

  function resetCalibrationData() {
    setCalibrationData({})
    setInitialCalibrationPwms(null)
  }

  function writeCalibrationParams() {
    const params = []
    for (const channel in calibrationData) {
      if (calibrationData[channel] !== undefined) {
        const { min, max } = calibrationData[channel]
        params.push({
          param_id: `RC${channel}_MIN`,
          value: min,
        })
        params.push({
          param_id: `RC${channel}_MAX`,
          value: max,
        })
      }
    }

    if (params.length > 0) {
      dispatch(emitBatchSetRcConfigParams({ params }))
    }
  }

  useEffect(() => {
    if (connected) {
      dispatch(emitSetState("config.rc"))
      dispatch(emitGetRcConfig())
    }
  }, [connected, dispatch])

  useEffect(() => {
    if (calibrationModalOpened) {
      // Set initial calibration PWM values once first opening the modal
      if (initialCalibrationPwms === null) {
        setInitialCalibrationPwms(pwmChannels)
      } else {
        setCalibrationData((prevCalibrationData) => {
          const newCalibrationData = { ...prevCalibrationData }

          for (const channel in pwmChannels) {
            const pwmValue = pwmChannels[channel]

            // If the PWM value is different to the initial value and the
            // calibration data hasn't been created yet, then create it
            if (
              pwmValue !== initialCalibrationPwms[channel] &&
              newCalibrationData[channel] === undefined
            ) {
              newCalibrationData[channel] = { min: pwmValue, max: pwmValue }
            }

            // If calibration data exists then set the min/max values accordingly
            if (
              newCalibrationData[channel] !== undefined &&
              pwmValue < newCalibrationData[channel]?.min
            ) {
              newCalibrationData[channel].min = pwmValue
            } else if (
              newCalibrationData[channel] !== undefined &&
              pwmValue > newCalibrationData[channel]?.max
            ) {
              newCalibrationData[channel].max = pwmValue
            }
          }

          return newCalibrationData
        })
      }
    }
  }, [calibrationModalOpened, pwmChannels, initialCalibrationPwms])

  return (
    <div className="m-4">
      <Modal
        opened={calibrationModalOpened}
        onClose={() => {
          dispatch(setRadioCalibrationModalOpen(false))
          resetCalibrationData()
        }}
        title="RC Calibration"
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        size="90%"
      >
        <div className="flex flex-col gap-4 items-center justify-center">
          <Text>
            Move all RC sticks, dials and switches to their extreme positions.
          </Text>
          <Text fw="bold" c="red">
            Ensure no propellers are attached during calibration!
          </Text>
          <div
            className={`grid gap-1 w-full ${
              Object.keys(pwmChannels).length > 8
                ? "grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            {Object.keys(pwmChannels).map((channel) => (
              <div key={channel}>
                <Text className="font-bold">
                  Channel {channel}{" "}
                  {getChannelUsageString(channel) !== null && (
                    <span>({getChannelUsageString(channel)})</span>
                  )}{" "}
                  {calibrationData[channel] !== undefined && (
                    <span>
                      : {calibrationData[channel]?.min}-
                      {calibrationData[channel]?.max}
                    </span>
                  )}
                </Text>
                {calibrationData[channel] === undefined ? (
                  <Progress.Root className="!h-6">
                    <Progress.Section
                      value={100}
                      color="grey"
                    ></Progress.Section>
                  </Progress.Root>
                ) : (
                  <>
                    <Progress.Root className="!h-6">
                      <Progress.Section
                        value={getPercentageValueFromPWM(
                          calibrationData[channel]?.min,
                        )}
                        color="grey"
                      ></Progress.Section>
                      <Progress.Section
                        color={COLOURS[(channel - 1) % COLOURS.length]}
                        value={
                          getPercentageValueFromPWM(
                            calibrationData[channel]?.max,
                          ) -
                          getPercentageValueFromPWM(
                            calibrationData[channel]?.min,
                          )
                        }
                      >
                        <Progress.Label className="!text-lg !font-normal">
                          {pwmChannels[channel]}
                        </Progress.Label>
                      </Progress.Section>
                      <Progress.Section
                        value={
                          100 -
                          getPercentageValueFromPWM(
                            calibrationData[channel]?.max,
                          )
                        }
                        color="grey"
                      ></Progress.Section>
                    </Progress.Root>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-row justify-between w-full">
            <Button
              color="red"
              onClick={() => {
                dispatch(setRadioCalibrationModalOpen(false))
                resetCalibrationData()
              }}
            >
              Cancel
            </Button>
            <Button color="green" onClick={writeCalibrationParams}>
              Save Calibration
            </Button>
          </div>
        </div>
      </Modal>

      <Button
        onClick={() => {
          resetCalibrationData()
          dispatch(setRadioCalibrationModalOpen(true))
        }}
        className="mb-4"
      >
        RC Calibration
      </Button>
      <Table withRowBorders={false} className="!w-fit">
        <Table.Thead>
          <Table.Tr>
            <Table.Th className="">Channel</Table.Th>
            <Table.Th className="">Function/Option</Table.Th>
            <Table.Th className="">Reversed</Table.Th>
            <Table.Th className="w-[40rem]">PWM Value</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {Object.keys(pwmChannels).map((channel) => (
            <Table.Tr key={channel} className="h-12">
              <Table.Td>
                <span className="font-bold text-lg">RC{channel}</span>
              </Table.Td>
              <Table.Td>
                {channelsConfig[channel]?.map ? (
                  <span>{channelsConfig[channel].map}</span>
                ) : (
                  <Select
                    data={rcSelectOptions}
                    value={channelsConfig[channel]?.option?.toString() || "0"}
                    onChange={(value) => handleRcOptionChange(channel, value)}
                    placeholder="Select option"
                    allowDeselect={false}
                    searchable
                  />
                )}
              </Table.Td>
              <Table.Td>
                <Checkbox
                  checked={channelsConfig[channel]?.reversed || false}
                  onChange={(event) =>
                    handleReversedChange(channel, event.currentTarget.checked)
                  }
                />
              </Table.Td>
              <Table.Td>
                <Progress.Root className="!h-6">
                  <Progress.Section
                    value={getPercentageValueFromPWM(pwmChannels[channel])}
                    color={COLOURS[(channel - 1) % COLOURS.length]}
                  >
                    <Progress.Label className="!text-lg !font-normal">
                      {pwmChannels[channel]}
                    </Progress.Label>
                  </Progress.Section>
                </Progress.Root>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  )
}
