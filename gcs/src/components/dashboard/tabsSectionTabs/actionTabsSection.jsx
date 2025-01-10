/**
 * ActionTabsSection
 * This file holds all relevant component to perform actions on the drone, within the action tab in tabsSection.
 */

// Native
import { useState } from "react"

// Mantine
import { Button, NumberInput, Popover, Tabs, Select } from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"

// Mavlink
import {
  COPTER_MODES_FLIGHT_MODE_MAP,
  PLANE_MODES_FLIGHT_MODE_MAP,
} from "../../../helpers/mavlinkConstants"

// Helper
import { socket } from "../../../helpers/socket"
import { NoConnectionMsg } from "../tabsSection"

export default function ActionTabsSection({
  connected,
  tabPadding,
  currentFlightModeNumber,
  aircraftType,
  getIsArmed,
}) {
  return (
    <Tabs.Panel value="actions">
      <div className={tabPadding}>
        {!connected ? (
          <NoConnectionMsg message="No actions are available right now. Connect a drone to begin" />
        ) : (
          <div className="flex flex-col gap-y-2">
            {/** Flight Mode */}
            <FlightModeAction
              aircraftType={aircraftType}
              currentFlightModeNumber={currentFlightModeNumber}
            />
            {/** Arm / Takeoff / Landing */}
            <ArmTakeoffLandAction getIsArmed={getIsArmed} />
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

const ArmTakeoffLandAction = ({ getIsArmed }) => {
  const [takeoffAltitude, setTakeoffAltitude] = useLocalStorage({
    key: "takeoffAltitude",
    defaultValue: 10,
  })

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
            armDisarm(!getIsArmed())
          }}
          className="grow"
        >
          {getIsArmed() ? "Disarm" : "Arm"}
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
