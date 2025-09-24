/*
  This is the RC calibration component.

  You can see the different PWM inputs for each RC channel.
*/

// Base imports
import { useEffect } from "react"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"

// Helper javascript files
import { Progress } from "@mantine/core"
import apmParamDefsCopter from "../../../data/gen_apm_params_def_copter.json"
import apmParamDefsPlane from "../../../data/gen_apm_params_def_plane.json"

// Redux
import { useDispatch, useSelector } from "react-redux"
import {
  emitSetState,
  selectConnectedToDrone,
} from "../../redux/slices/droneConnectionSlice"
import { selectAircraftType } from "../../redux/slices/droneInfoSlice"
import {
  emitGetRcConfig,
  selectRadioChannels,
  selectRadioChannelsConfig,
} from "../../redux/slices/configSlice"

// Tailwind
const tailwindColors = resolveConfig(tailwindConfig).theme.colors
const PWM_MIN = 800
const PWM_MAX = 2200
const colors = [
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
  const aircraftType = useSelector(selectAircraftType)
  const channels = useSelector(selectRadioChannels)
  const channelsConfig = useSelector(selectRadioChannelsConfig)

  function getReadableRcOption(option) {
    if (option === 0) return null
    if (aircraftType === 1) {
      return apmParamDefsPlane.RC5_OPTION.Values[`${option}`] ?? option
    } else if (aircraftType === 2) {
      return apmParamDefsCopter.RC5_OPTION.Values[`${option}`] ?? option
    }
  }

  useEffect(() => {
    if (connected) {
      dispatch(emitSetState("config.rc"))
      dispatch(emitGetRcConfig())
    }
  }, [connected])

  return (
    <div className="m-4 flex flex-row gap-4 relative">
      <table class="table-auto">
        <tbody>
          {Object.keys(channels).map((channel) => (
            <tr key={channel}>
              <td className="w-fit pb-2 pr-4">
                <span className="font-bold">{channel} </span>
                {channelsConfig[channel]?.map ??
                  getReadableRcOption(channelsConfig[channel]?.option)}
              </td>
              <td>
                <Progress.Root className="w-[48rem] !h-6">
                  <Progress.Section
                    value={getPercentageValueFromPWM(channels[channel])}
                    color={colors[(channel - 1) % colors.length]}
                  >
                    <Progress.Label className="!text-lg !font-normal">
                      {channels[channel]}
                    </Progress.Label>
                  </Progress.Section>
                </Progress.Root>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
