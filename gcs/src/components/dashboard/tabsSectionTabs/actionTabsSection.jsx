/**
 * ActionTabsSection
 * This file holds all relevant component to perform actions on the drone, within the action tab in tabsSection.
 */

// Native
import { useEffect, useState } from "react"

// Mantine
import { Button, NumberInput, Popover, Select, Tabs } from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"

// Mavlink
import {
  COPTER_MODES_FLIGHT_MODE_MAP,
  PLANE_MODES_FLIGHT_MODE_MAP,
} from "../../../helpers/mavlinkConstants"

// Helper
import { useDispatch, useSelector } from "react-redux"
import { socket } from "../../../helpers/socket"
import {
  selectArmed,
  setLoiterRadius,
} from "../../../redux/slices/droneInfoSlice"
import { NoConnectionMsg } from "../tabsSection"

export default function ActionTabsSection({
  connected,
  tabPadding,
  currentFlightModeNumber,
  aircraftType,
  currentLoiterRadius,
}) {
  return (
    <Tabs.Panel value="actions">
      <div className={tabPadding}>
        {!connected ? (
          <NoConnectionMsg message="No actions are available right now. Connect a drone to begin" />
        ) : (
          <div className="flex flex-col gap-y-2">
            {/** Loiter Radius */}
            <LoiterRadiusAction currentLoiterRadius={currentLoiterRadius} />
            {/** Flight Mode */}
            <FlightModeAction
              aircraftType={aircraftType}
              currentFlightModeNumber={currentFlightModeNumber}
            />
            {/** Arm / Takeoff / Landing */}
            <ArmTakeoffLandAction />
          </div>
        )}
      </div>
    </Tabs.Panel>
  )
}

const FlightModeAction = ({ aircraftType, currentFlightModeNumber }) => {
  const [newFlightModeNumber, setNewFlightModeNumber] = useState(3) // Default to AUTO mode

  // flight mode handling
  function setNewFlightMode(modeNumber) {
    if (modeNumber === null || modeNumber === currentFlightModeNumber) {
      return
    }
    socket.emit("set_current_flight_mode", { newFlightMode: modeNumber })
  }

  function getFlightModeMap() {
    if (aircraftType === 1) {
      return PLANE_MODES_FLIGHT_MODE_MAP
    } else if (aircraftType === 2) {
      return COPTER_MODES_FLIGHT_MODE_MAP
    }

    return {}
  }

  return (
    <>
      {currentFlightModeNumber !== null && (
        <div className="flex flex-wrap flex-cols gap-2">
          <Select
            value={newFlightModeNumber.toString()}
            onChange={(value) => {
              setNewFlightModeNumber(parseInt(value))
            }}
            data={Object.keys(getFlightModeMap()).map((key) => {
              return {
                value: key,
                label: getFlightModeMap()[key],
              }
            })}
            className="grow"
          />

          <Button
            onClick={() => setNewFlightMode(newFlightModeNumber)}
            className="grow"
          >
            Set Flight Mode
          </Button>
        </div>
      )}
    </>
  )
}

const ArmTakeoffLandAction = () => {
  const [takeoffAltitude, setTakeoffAltitude] = useLocalStorage({
    key: "takeoffAltitude",
    defaultValue: 10,
  })
  const isArmed = useSelector(selectArmed)

  function armDisarm(arm, force = false) {
    // TODO: Add force arm ability
    socket.emit("arm_disarm", { arm: arm, force: force })
  }

  function takeoff() {
    socket.emit("takeoff", { alt: takeoffAltitude })
  }

  function land() {
    socket.emit("land")
  }

  return (
    <>
      <div className="flex flex-wrap flex-cols gap-2">
        <Button
          onClick={() => {
            armDisarm(!isArmed)
          }}
          className="grow"
        >
          {isArmed ? "Disarm" : "Arm"}
        </Button>

        {/** Takeoff button with popover */}
        <Popover width={200} position="bottom" withArrow shadow="md">
          <Popover.Target>
            <Button className="grow">Takeoff</Button>
          </Popover.Target>
          <Popover.Dropdown className="flex flex-col space-y-2">
            <NumberInput
              label="Takeoff altitude (m)"
              placeholder="Takeoff altitude (m)"
              value={takeoffAltitude}
              onChange={setTakeoffAltitude}
              min={0}
              allowNegative={false}
              hideControls
            />
            <Button
              onClick={() => {
                takeoff()
              }}
            >
              Takeoff
            </Button>
          </Popover.Dropdown>
        </Popover>

        {/** Land Button */}
        <Button
          onClick={() => {
            land()
          }}
          className="grow"
        >
          Land
        </Button>
      </div>
    </>
  )
}

const LoiterRadiusAction = ({ currentLoiterRadius }) => {
  const dispatch = useDispatch()
  const [newLoiterRadius, setNewLoiterRadius] = useState(currentLoiterRadius) // Default to AUTO mode

  useEffect(() => {
    setNewLoiterRadius(currentLoiterRadius)
  }, [currentLoiterRadius])

  function sendNewLoiterRadius(radius) {
    if (radius === null || radius === currentLoiterRadius || radius < 0) {
      return
    }
    socket.emit("set_loiter_radius", { radius })
    dispatch(setLoiterRadius(radius))
  }

  return (
    <>
      {currentLoiterRadius !== null && (
        <div className="flex flex-wrap flex-cols gap-2">
          <NumberInput
            placeholder="Loiter radius (m)"
            value={newLoiterRadius}
            onChange={setNewLoiterRadius}
            min={0}
            allowNegative={false}
            hideControls
            data-autofocus
            suffix="m"
            decimalScale={2}
          />

          <Button
            onClick={() => sendNewLoiterRadius(newLoiterRadius)}
            className="grow"
          >
            Set Loiter Radius
          </Button>
        </div>
      )}
    </>
  )
}
