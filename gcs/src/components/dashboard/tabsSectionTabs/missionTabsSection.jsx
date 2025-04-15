/**
 * MissionTabsSection
 * This file contains all relevant components to display and modify mission status and information within the mission section
 * in tabsSection.
 */

// Mantine
import { Button, Tabs } from "@mantine/core"

// Mavlink
import {
  MISSION_STATES,
  COPTER_MODES_FLIGHT_MODE_MAP,
  PLANE_MODES_FLIGHT_MODE_MAP,
} from "../../../helpers/mavlinkConstants"

// Helper
import { socket } from "../../../helpers/socket"
import { NoConnectionMsg } from "../tabsSection"
import { useSelector } from "react-redux"
import {
  selectAircraftType,
  selectFlightMode,
  selectNavController,
} from "../../../redux/slices/droneInfoSlice"
import { selectCurrentMission } from "../../../redux/slices/missionSlice"

export default function MissionTabsSection({ connected, tabPadding }) {
  return (
    <Tabs.Panel value="mission">
      <div className={tabPadding}>
        {!connected ? (
          <NoConnectionMsg message="No mission actions are available right now. Connect a drone to begin" />
        ) : (
          <div className="flex flex-col gap-4">
            {/** Mission Information */}
            <MissionInfo />

            {/** Auto, Start and Restart Mission */}
            <AutoStartRestartMission />
          </div>
        )}
      </div>
    </Tabs.Panel>
  )
}

const MissionInfo = () => {
  const { wpDist } = useSelector(selectNavController)
  const { missionState, seq, total } = useSelector(selectCurrentMission)

  return (
    <>
      {/** Mission Information */}
      <div className="text-lg">
        <p>
          <span className="font-bold"> Mission State:</span>{" "}
          {MISSION_STATES[missionState]}
        </p>
        <p>
          <span className="font-bold"> Waypoint: </span> {seq}/{total}
        </p>
        <p>
          <span className="font-bold">Distance to WP: </span>{" "}
          {wpDist.toFixed(2)}
        </p>
      </div>
    </>
  )
}

const AutoStartRestartMission = () => {
  // this is repeated code, will be updated after socket functionality is changed

  const flightMode = useSelector(selectFlightMode)
  const aircraftType = useSelector(selectAircraftType)

  function setNewFlightMode(modeNumber) {
    if (modeNumber === null || modeNumber === flightMode) {
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
      </div>
    </>
  )
}
