/*
  This is the RC calibration component.

  You can see the different PWM inputs for each RC channel.
*/

// Base imports
import { useEffect, useMemo } from "react"

// Helper javascript files
import { Checkbox, Progress, Select, Table } from "@mantine/core"
import apmParamDefsCopter from "../../../data/gen_apm_params_def_copter.json"
import apmParamDefsPlane from "../../../data/gen_apm_params_def_plane.json"

// Redux
import { useDispatch, useSelector } from "react-redux"
import {
  emitGetRcConfig,
  emitSetRcConfigParam,
  selectRadioChannelsConfig,
  selectRadioPwmChannels,
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

  useEffect(() => {
    if (connected) {
      dispatch(emitSetState("config.rc"))
      dispatch(emitGetRcConfig())
    }
  }, [connected])

  return (
    <div className="m-4">
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
