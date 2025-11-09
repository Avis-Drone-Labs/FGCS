/**
 * MissionTabsSection
 * This file contains all relevant components to display and modify mission status and information within the mission section
 * in tabsSection.
 */

// Mantine
import { Button, Tabs } from "@mantine/core"

// Mavlink
import {
  COPTER_MODES_FLIGHT_MODE_MAP,
  MISSION_STATES,
  PLANE_MODES_FLIGHT_MODE_MAP,
} from "../../../helpers/mavlinkConstants"

// Helper
import { socket } from "../../../helpers/socket"
import { NoConnectionMsg } from "../tabsSection"
import { useState, useEffect } from "react"

export default function MissionTabsSection({
  connected,
  tabPadding,
  currentMissionData,
  navControllerOutputData,
  currentFlightModeNumber,
  aircraftType,
}) {
  const [missionPaused, setMissionPaused] = useState(false)

  // Update missionPaused state based on current flight mode
  useEffect(() => {
    // GUIDED mode = copter 4, plane 15
    const guidedModeNumber = aircraftType === 1 ? 15 : 4
    const isInGuidedMode = currentFlightModeNumber === guidedModeNumber

    // only update if the state doesn't match the actual mode
    if (isInGuidedMode !== missionPaused) {
      setMissionPaused(isInGuidedMode)
    }
  }, [currentFlightModeNumber, aircraftType, missionPaused])

  return (
    <Tabs.Panel value="mission">
      <div className={tabPadding}>
        {!connected ? (
          <NoConnectionMsg message="No mission actions are available right now. Connect a drone to begin" />
        ) : (
          <div className="flex flex-col gap-4">
            {/** Mission Information */}
            <MissionInfo
              currentMissionData={currentMissionData}
              navControllerOutputData={navControllerOutputData}
            />

            {/** Auto, Start and Restart Mission */}
            <AutoStartRestartMission
              aircraftType={aircraftType}
              currentFlightModeNumber={currentFlightModeNumber}
              missionPaused={missionPaused}
              setMissionPaused={setMissionPaused}
            />
          </div>
        )}
      </div>
    </Tabs.Panel>
  )
}

const MissionInfo = ({ currentMissionData, navControllerOutputData }) => {
  return (
    <>
      {/** Mission Information */}
      <div className="text-lg">
        <p>
          <span className="font-bold"> Mission State:</span>{" "}
          {MISSION_STATES[currentMissionData.mission_state]}
        </p>
        <p>
          <span className="font-bold"> Waypoint: </span>{" "}
          {currentMissionData.seq}/{currentMissionData.total}
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

const AutoStartRestartMission = ({
  aircraftType,
  currentFlightModeNumber,
  missionPaused,
  setMissionPaused,
}) => {
  // this is repeated code, will be updated after socket functionality is changed
  function setNewFlightMode(modeNumber) {
    if (modeNumber === null || modeNumber === currentFlightModeNumber) {
      return
    }
    socket.emit("set_current_flight_mode", { newFlightMode: modeNumber })
  }

  function controlMission(action) {
    socket.emit("control_mission", { action })
  }

  function getFlightModeMap() {
    if (aircraftType === 1) {
      return PLANE_MODES_FLIGHT_MODE_MAP
    } else if (aircraftType === 2) {
      return COPTER_MODES_FLIGHT_MODE_MAP
    }

    return {}
  }

  function readCurrentMission() {
    socket.emit("get_current_mission_all")
  }

  function pauseMission() {
    controlMission("pause")
    setMissionPaused(true)
  }

  function resumeMission() {
    controlMission("resume")
    setMissionPaused(false)
  }

  return (
    <>
      <div className="flex flex-wrap flex-cols gap-2">
        {/** Auto Mode */}
        <Button
          onClick={() => {
            setNewFlightMode(
              parseInt(
                Object.keys(getFlightModeMap()).find(
                  (key) => getFlightModeMap()[key] === "Auto",
                ),
              ),
            )
          }}
          className="grow"
        >
          Auto mode
        </Button>

        {/** Start Mission */}
        <Button
          onClick={() => {
            controlMission("start")
          }}
          className="grow"
        >
          Start Mission
        </Button>

        {/** Restart Mission */}
        <Button
          onClick={() => {
            controlMission("restart")
          }}
          className="grow"
        >
          Restart Mission
        </Button>

        {/** Pause/Resume Mission */}
        <Button
          onClick={() => {
            if (missionPaused) {
              resumeMission()
            } else {
              pauseMission()
            }
          }}
          className="grow"
          color={missionPaused ? "green" : "yellow"}
        >
          {missionPaused ? "Resume Mission" : "Pause Mission"}
        </Button>

        <Button onClick={readCurrentMission} className="grow">
          Read mission
        </Button>
      </div>
    </>
  )
}
