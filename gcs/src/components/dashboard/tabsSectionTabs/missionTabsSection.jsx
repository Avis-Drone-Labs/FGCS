/**
 * MissionTabsSection
 * This file contains all relevant components to display and modify mission status and information within the mission section
 * in tabsSection.
 */

// Mantine
import { Button, Tabs } from "@mantine/core"

// Mavlink
import {
  getFlightModeMap,
  MISSION_STATES,
} from "../../../helpers/mavlinkConstants"

import { useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  emitGetCurrentMissionAll,
  emitSetCurrentFlightMode,
} from "../../../redux/slices/droneConnectionSlice"
import {
  emitControlMission,
  selectCurrentMission,
} from "../../../redux/slices/missionSlice"
import { NoConnectionMsg } from "../tabsSection"

export default function MissionTabsSection({
  connected,
  tabPadding,
  navControllerOutputData,
  currentFlightModeNumber,
  aircraftType,
}) {
  return (
    <Tabs.Panel value="mission">
      <div className={tabPadding}>
        {!connected ? (
          <NoConnectionMsg message="No mission actions are available right now. Connect a drone to begin" />
        ) : (
          <div className="flex flex-col gap-4">
            {/** Mission Information */}
            <MissionInfo navControllerOutputData={navControllerOutputData} />

            {/** Auto, Start and Restart Mission */}
            <AutoStartRestartMission
              aircraftType={aircraftType}
              currentFlightModeNumber={currentFlightModeNumber}
            />
          </div>
        )}
      </div>
    </Tabs.Panel>
  )
}

const MissionInfo = ({ navControllerOutputData }) => {
  const currentMission = useSelector(selectCurrentMission)
  return (
    <>
      {/** Mission Information */}
      <div className="text-lg">
        <p>
          <span className="font-bold"> Mission State:</span>{" "}
          {MISSION_STATES[currentMission.mission_state]}
        </p>
        <p>
          <span className="font-bold"> Waypoint: </span> {currentMission.seq}/
          {currentMission.total}
        </p>
        <p>
          <span className="font-bold">Distance to WP: </span>{" "}
          {(navControllerOutputData.wp_dist
            ? navControllerOutputData.wp_dist
            : 0
          ).toFixed(2)}
        </p>
      </div>
    </>
  )
}

const AutoStartRestartMission = ({ aircraftType, currentFlightModeNumber }) => {
  const dispatch = useDispatch()
  // this is repeated code, will be updated after socket functionality is changed
  function setNewFlightMode(modeNumber) {
    if (modeNumber === null || modeNumber === currentFlightModeNumber) {
      return
    }
    dispatch(emitSetCurrentFlightMode({ newFlightMode: modeNumber }))
  }

  const autoFlightModeNumber = useMemo(() => {
    const flightModeMap = getFlightModeMap(aircraftType)
    const key = Object.keys(flightModeMap).find(
      (key) => flightModeMap[key] === "Auto",
    )
    return key !== undefined ? parseInt(key) : null
  }, [aircraftType])

  return (
    <>
      <div className="flex flex-wrap flex-cols gap-2">
        {/** Auto Mode */}
        <Button
          onClick={() => {
            setNewFlightMode(autoFlightModeNumber)
          }}
          className="grow"
          disabled={autoFlightModeNumber === null}
        >
          Auto mode
        </Button>

        {/** Start Mission */}
        <Button
          onClick={() => {
            dispatch(emitControlMission({ action: "start" }))
          }}
          className="grow"
        >
          Start Mission
        </Button>

        {/** Restart Mission */}
        <Button
          onClick={() => {
            dispatch(emitControlMission({ action: "restart" }))
          }}
          className="grow"
        >
          Restart Mission
        </Button>

        <Button
          onClick={() => {
            dispatch(emitGetCurrentMissionAll())
          }}
          className="grow"
        >
          Read mission
        </Button>
      </div>
    </>
  )
}
