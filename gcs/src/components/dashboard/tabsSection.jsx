/*
  Tabs section. This will be a part of the resizable info box located in the bottom half. This
  contains tabs like data, action, missions, and camera.
*/

// 3rd Party Imports
import { Tabs } from "@mantine/core"

// Tab Components
import ActionTabsSection from "./tabsSectionTabs/actionTabsSection"
import CameraTabsSection from "./tabsSectionTabs/cameraTabsSection"
import DataTabsSection from "./tabsSectionTabs/dataTabsSection"
import MissionTabsSection from "./tabsSectionTabs/missionTabsSection"
import PreFlightChecklistTab from "./tabsSectionTabs/preFlightChecklistSection"
import RTSPStreamTabsSection from "./tabsSectionTabs/rtspStreamTabsSection"

// Redux
import { useSelector } from "react-redux"
import { selectConnectedToDrone } from "../../redux/slices/droneConnectionSlice"
import {
  selectAircraftTypeString,
  selectNavController,
} from "../../redux/slices/droneInfoSlice"

export default function TabsSection({ currentFlightModeNumber }) {
  const connected = useSelector(selectConnectedToDrone)
  const aircraftType = useSelector(selectAircraftTypeString)
  const navControllerOutputData = useSelector(selectNavController)
  const tabPadding = "pt-6 pb-4"

  return (
    <Tabs defaultValue="data">
      <Tabs.List className="!overflow-x-scroll !flex-nowrap">
        <Tabs.Tab value="data">Data</Tabs.Tab>
        <Tabs.Tab value="actions">Actions</Tabs.Tab>
        <Tabs.Tab value="mission">Mission</Tabs.Tab>
        <Tabs.Tab value="camera">Camera</Tabs.Tab>
        <Tabs.Tab value="rtsp-streams">RTSP Streams</Tabs.Tab>
        <Tabs.Tab value="preFlightChecklist">Pre-Flight Checklist</Tabs.Tab>
      </Tabs.List>

      {/* Data */}
      <DataTabsSection tabPadding={tabPadding} />

      {/* Actions */}
      <ActionTabsSection
        connected={connected}
        tabPadding={tabPadding}
        currentFlightModeNumber={currentFlightModeNumber}
        aircraftType={aircraftType}
        currentLoiterRadius={navControllerOutputData.loiterRadius}
      ></ActionTabsSection>

      {/* Mission */}
      <MissionTabsSection
        connected={connected}
        tabPadding={tabPadding}
        navControllerOutputData={navControllerOutputData}
        currentFlightModeNumber={currentFlightModeNumber}
        aircraftType={aircraftType}
      />

      {/* Camera */}
      <CameraTabsSection tabPadding={tabPadding} />

      {/* RTSP Streams */}
      <RTSPStreamTabsSection tabPadding={tabPadding} />

      {/* Pre Flight Checklist */}
      <PreFlightChecklistTab tabPadding={tabPadding} />
    </Tabs>
  )
}

export const NoConnectionMsg = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <p className="text-white-800 px-6 text-center">{message}</p>
    </div>
  )
}
