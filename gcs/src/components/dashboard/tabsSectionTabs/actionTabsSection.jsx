/**
 * ActionTabsSection
 * This file holds all relevant component to perform actions on the drone, within the action tab in tabsSection.
 */

// Native
import { useEffect, useMemo, useState } from "react"

// Mantine
import { Button, NumberInput, Popover, Select, Tabs } from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"

// Mavlink
import { getFlightModeMap } from "../../../helpers/mavlinkConstants"

import { useDispatch, useSelector } from "react-redux"
import {
  emitArmDisarm,
  emitLand,
  emitSetCurrentFlightMode,
  emitSetLoiterRadius,
  emitTakeoff,
} from "../../../redux/slices/droneConnectionSlice"
import {
  selectArmed,
  setLoiterRadius,
} from "../../../redux/slices/droneInfoSlice"

import { NoConnectionMsg } from "../tabsSection"
import { useRebootCallback } from "../../../helpers/useRebootCallback"

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
            {aircraftType === "Plane" && (
              <LoiterRadiusAction currentLoiterRadius={currentLoiterRadius} />
            )}
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
  const dispatch = useDispatch()
  const [newFlightModeNumber, setNewFlightModeNumber] = useState(3) // Default to AUTO mode

  // flight mode handling
  function setNewFlightMode(modeNumber) {
    if (modeNumber === null || modeNumber === currentFlightModeNumber) {
      return
    }
    dispatch(emitSetCurrentFlightMode({ newFlightMode: modeNumber }))
  }

  const flightModeSelectDataMap = useMemo(() => {
    const flightModeMap = getFlightModeMap(aircraftType)
    return Object.keys(flightModeMap).map((key) => {
      return {
        value: key,
        label: flightModeMap[key],
      }
    })
  }, [aircraftType])

  return (
    <>
      {currentFlightModeNumber !== null && (
        <div className="flex flex-wrap flex-cols gap-2">
          <Select
            value={newFlightModeNumber.toString()}
            onChange={(value) => {
              setNewFlightModeNumber(parseInt(value))
            }}
            data={flightModeSelectDataMap}
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
  const dispatch = useDispatch()
  const [takeoffAltitude, setTakeoffAltitude] = useLocalStorage({
    key: "takeoffAltitude",
    defaultValue: 10,
  })
  const isArmed = useSelector(selectArmed)
  const rebootCallback = useRebootCallback()

  function armDisarm(arm, force = false) {
    // TODO: Add force arm ability
    dispatch(emitArmDisarm({ arm: arm, force: force }))
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
                dispatch(emitTakeoff({ alt: takeoffAltitude }))
              }}
            >
              Takeoff
            </Button>
          </Popover.Dropdown>
        </Popover>

        {/** Land Button */}
        <Button
          onClick={() => {
            dispatch(emitLand())
          }}
          className="grow"
        >
          Land
        </Button>

        {/** Reboot Button */}
        <Button onClick={rebootCallback} color={"red"} className="grow">
          Reboot FC
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
    dispatch(emitSetLoiterRadius(radius))
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
            className="grow"
            // Below is the cursed solution to fixing the misalignment between Mantine's
            // OWN components. It's a magic number of 40 as Mantine's Select component has
            // a 34px RHS icon and without it the NumberInput is 6px wider than select for uhhhh
            // unknown reasons. Thanks Mantine :D
            rightSection={<div />}
            rightSectionWidth="40px"
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
