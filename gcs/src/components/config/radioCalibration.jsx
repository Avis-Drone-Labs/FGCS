/*
  This is the RC calibration component.

  You can see the different PWM inputs for each RC channel.
*/

// Base imports
import { useEffect, useState } from "react"

// 3rd party imports
import { useLocalStorage, useSessionStorage } from "@mantine/hooks"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"

// Helper javascript files
import { Progress } from "@mantine/core"
import apmParamDefsCopter from "../../../data/gen_apm_params_def_copter.json"
import apmParamDefsPlane from "../../../data/gen_apm_params_def_plane.json"
import { socket } from "../../helpers/socket"

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
  const [connected] = useSessionStorage({
    key: "connectedToDrone",
    defaultValue: false,
  })
  const [aircraftType] = useLocalStorage({
    key: "aircraftType",
  })
  const [channels, setChannels] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
    13: 0,
    14: 0,
    15: 0,
    16: 0,
  })
  const [channelsConfig, setChannelsConfig] = useState({})

  function getReadableRcOption(option) {
    if (option === 0) return null
    if (aircraftType === 1) {
      return apmParamDefsPlane.RC5_OPTION.Values[`${option}`] ?? option
    } else if (aircraftType === 2) {
      return apmParamDefsCopter.RC5_OPTION.Values[`${option}`] ?? option
    }
  }

  useEffect(() => {
    if (!connected) {
      return
    }

    socket.emit("set_state", { state: "config.rc" })
    socket.emit("get_rc_config")

    socket.on("incoming_msg", (msg) => {
      if (msg.mavpackettype === "RC_CHANNELS") {
        // Check to see if a RC_CHANNELS message has been received, if so get
        // all of the channel PWM values and set them in the state
        const chans = {}
        for (let i = 1; i < msg.chancount + 1; i++) {
          chans[i] = msg[`chan${i}_raw`]

          setChannels(chans)
        }
      }
    })

    socket.on("rc_config", (data) => {
      const config = {}

      for (let i = 1; i < 17; i++) {
        config[i] = data[`RC_${i}`]
      }
      config[`${data.pitch}`].map = "Pitch"
      config[`${data.roll}`].map = "Roll"
      config[`${data.throttle}`].map = "Throttle"
      config[`${data.yaw}`].map = "Yaw"
      config[`${data.flight_modes}`].map = "Flight modes"

      setChannelsConfig(config)
    })

    return () => {
      socket.off("incoming_msg")
      socket.off("rc_config")
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
