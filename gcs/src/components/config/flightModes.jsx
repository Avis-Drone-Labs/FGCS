/*
  This is the flight modes component for the config page.

  It displays the different flight modes and the current flight mode selected depending on the
  PWM value from the RC transmitter on the specified channel. You can set the flight modes for
  each mode.
*/
// Base imports
import { useEffect, useMemo } from "react"
import { selectAircraftTypeString, selectFlightModeString } from "../../redux/slices/droneInfoSlice"

// 3rd party imports
import { Button, LoadingOverlay, Select } from "@mantine/core"

// Redux
import { useDispatch, useSelector } from "react-redux"
import { emitSetState, selectConnectedToDrone } from "../../redux/slices/droneConnectionSlice"

// Helper javascript files
import {
  getFlightModeMap,
} from "../../helpers/mavlinkConstants"
import { emitGetFlightModeConfig, emitRefreshFlightModeData, emitSetFlightMode, selectFlightModeChannel, selectFlightModesList, selectPwmValue, selectRefreshingFlightModeData, setRefreshingFlightModeData } from "../../redux/slices/configSlice"

const FLIGHT_MODE_PWM_VALUES = [
  [0, 1230],
  [1231, 1360],
  [1361, 1490],
  [1491, 1620],
  [1621, 1749],
  [1750],
]

export default function FlightModes() {
  const dispatch = useDispatch()
  const connected = useSelector(selectConnectedToDrone)
  const flightModes = useSelector(selectFlightModesList)
  const flightModeChannel = useSelector(selectFlightModeChannel)
  const refreshingFlightModeData = useSelector(selectRefreshingFlightModeData)
  const aircraftType = useSelector(selectAircraftTypeString)
  const currentFlightMode = useSelector(selectFlightModeString)
  const currentPwmValue = useSelector(selectPwmValue)

  const flightModeSelectDataMap = useMemo(() => {
    const flightModeMap = getFlightModeMap(aircraftType)
    return Object.keys(flightModeMap).map((key) => {
      return {
        value: key,
        label: flightModeMap[key],
      }
    })
  }, [aircraftType])

  useEffect(() => {
    if (!connected) {
      return
    }

    dispatch(emitSetState("config.flight_modes"))
    dispatch(emitGetFlightModeConfig())
  }, [connected])

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
    dispatch(emitSetFlightMode({
      mode_number: modeNumber + 1, // Mode number is 1 + indexed value
      flight_mode: parseInt(newFlightMode),
    }))
  }

  function refreshFlightModeData() {
    dispatch(emitRefreshFlightModeData())
    dispatch(setRefreshingFlightModeData(true))
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
                data={flightModeSelectDataMap}
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
