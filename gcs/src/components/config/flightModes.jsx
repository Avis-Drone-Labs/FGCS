/*
  This is the flight modes component for the config page.

  It displays the different flight modes and the current flight mode selected depending on the
  PWM value from the RC transmitter on the specified channel. You can set the flight modes for
  each mode.
*/
// Base imports
import { useEffect, useState } from "react"

// 3rd party imports
import { Button, LoadingOverlay, Select } from "@mantine/core"
import {
  useListState,
  useLocalStorage,
  useSessionStorage,
} from "@mantine/hooks"

// Helper javascript files
import {
  COPTER_MODES_FLIGHT_MODE_MAP,
  MAV_AUTOPILOT_INVALID,
  PLANE_MODES_FLIGHT_MODE_MAP,
} from "../../helpers/mavlinkConstants"
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../helpers/notification"
import { socket } from "../../helpers/socket"

const FLIGHT_MODE_PWM_VALUES = [
  [0, 1230],
  [1231, 1360],
  [1361, 1490],
  [1491, 1620],
  [1621, 1749],
  [1750],
]

export default function FlightModes() {
  const [connected] = useSessionStorage({
    key: "connectedToDrone",
    defaultValue: false,
  })

  function getCurrentFlightMap(currentFlightState) {
    if (currentFlightState === 1) {
      return PLANE_MODES_FLIGHT_MODE_MAP
    } else if (currentFlightState === 2) {
      return COPTER_MODES_FLIGHT_MODE_MAP
    }

    return {}
  }

  const [flightModes, flightModesHandler] = useListState([
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
  ])
  const [flightModeChannel, setFlightModeChannel] = useState("UNKNOWN")
  const [currentFlightMode, setCurrentFlightMode] = useState("UNKNOWN")
  const [aircraftType] = useLocalStorage({
    key: "aircraftType",
  })
  const [currentPwmValue, setCurrentPwmValue] = useState(0)
  const [refreshingFlightModeData, setRefreshingFlightModeData] =
    useState(false)

  const flightModesSelectValuesMap = Object.keys(
    getCurrentFlightMap(aircraftType),
  ).map((mappedFlightModeNumber) => ({
    value: mappedFlightModeNumber.toString(),
    label: getCurrentFlightMap(aircraftType)[mappedFlightModeNumber],
  }))

  useEffect(() => {
    if (!connected) {
      return
    }

    socket.emit("set_state", { state: "config.flight_modes" })
    socket.emit("get_flight_mode_config")

    socket.on("flight_mode_config", (data) => {
      flightModesHandler.setState(data.flight_modes)
      setFlightModeChannel(data.flight_mode_channel)
      setRefreshingFlightModeData(false)
    })

    socket.on("set_flight_mode_result", (data) => {
      if (data.success) {
        showSuccessNotification(data.message)
      } else {
        showErrorNotification(data.message)
      }

      socket.emit("get_flight_mode_config")
    })

    return () => {
      socket.emit("set_state", { state: "config" })
      socket.off("flight_mode_config")
      socket.off("set_flight_mode_result")
    }
  }, [connected])

  useEffect(() => {
    socket.on("incoming_msg", (msg) => {
      if (
        msg.mavpackettype === "RC_CHANNELS" &&
        flightModeChannel !== "UNKNOWN"
      ) {
        setCurrentPwmValue(msg[`chan${flightModeChannel}_raw`])
      } else if (
        msg.mavpackettype === "HEARTBEAT" &&
        msg.autopilot !== MAV_AUTOPILOT_INVALID &&
        msg.type
      ) {
        // Get the current flight mode
        let mode = "UNKNOWN"
        if (msg.type === 1) {
          mode = PLANE_MODES_FLIGHT_MODE_MAP[msg.custom_mode]
        } else if (msg.type === 2) {
          mode = COPTER_MODES_FLIGHT_MODE_MAP[msg.custom_mode]
        }

        setCurrentFlightMode(mode)
      }
    })

    return () => {
      socket.off("incoming_msg")
    }
  }, [flightModeChannel])

  function isFlightModeActive(mode_idx) {
    // Check if the current PWM value is within the range of the flight mode
    // If the second value is undefined, then check if the current PWM value is
    // greater than the first value; this is for the last flight mode where the
    // value is greater than 1750.
    if (FLIGHT_MODE_PWM_VALUES[mode_idx][1] === undefined) {
      return currentPwmValue >= FLIGHT_MODE_PWM_VALUES[mode_idx][0]
    }

    return (
      currentPwmValue >= FLIGHT_MODE_PWM_VALUES[mode_idx][0] &&
      currentPwmValue <= FLIGHT_MODE_PWM_VALUES[mode_idx][1]
    )
  }

  function changeFlightMode(modeNumber, newFlightMode) {
    socket.emit("set_flight_mode", {
      mode_number: modeNumber + 1, // Mode number is 1 + indexed value
      flight_mode: parseInt(newFlightMode),
    })
  }

  function refreshFlightModeData() {
    socket.emit("refresh_flight_mode_data")
    setRefreshingFlightModeData(true)
  }

  return (
    <>
      <div className="relative">
        <LoadingOverlay
          visible={refreshingFlightModeData}
          zIndex={1000}
          overlayProps={{ blur: 2 }}
        />

        <div className="mx-4 flex flex-row gap-4 relative">
          <div className="flex flex-col gap-2">
            {flightModes.map((flightModeNumber, idx) => (
              <Select
                key={idx}
                label={`Flight mode ${idx + 1}`}
                description={`PWM: ${FLIGHT_MODE_PWM_VALUES[idx][0]}${FLIGHT_MODE_PWM_VALUES[idx][1] === undefined ? "+" : `-${FLIGHT_MODE_PWM_VALUES[idx][1]}`}`}
                value={flightModeNumber.toString()}
                onChange={(value) => changeFlightMode(idx, value)}
                data={flightModesSelectValuesMap}
                classNames={
                  isFlightModeActive(idx) ? { input: "!text-lime-400" } : {}
                }
              />
            ))}
          </div>
          <div className="mx-4">
            <p>Current mode: {currentFlightMode}</p>
            <p>Flight mode channel: {flightModeChannel}</p>
            <p>Current PWM: {currentPwmValue}</p>
            <Button
              onClick={refreshFlightModeData}
              loading={refreshingFlightModeData}
              className="mt-2"
            >
              Refresh data
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
