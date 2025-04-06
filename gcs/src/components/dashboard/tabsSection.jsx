/* 
  Tabs section. This will be a part of the resizable info box located in the bottom half. This
  contains tabs like data, action, missions, and camera.
*/

// 3rd Party Imports
import { Tabs } from "@mantine/core"

// Tab Componenents
import CameraTabsSection from "./tabsSectionTabs/cameraTabsSection"
import ActionTabsSection from "./tabsSectionTabs/actionTabsSection"
import MissionTabsSection from "./tabsSectionTabs/missionTabsSection"
import DataTabsSection from "./tabsSectionTabs/dataTabsSection"

export default function TabsSection({
  connected,
  aircraftType,
  getIsArmed,
  currentFlightModeNumber,
  currentMissionData,
  navControllerOutputData,
  displayedData,
  setDisplayedData,
}) {
  const tabPadding = "pt-6"

  return (
    <Tabs defaultValue="data">
      <Tabs.List grow>
        <Tabs.Tab value="data">Data</Tabs.Tab>
        <Tabs.Tab value="actions">Actions</Tabs.Tab>
        <Tabs.Tab value="mission">Mission</Tabs.Tab>
        <Tabs.Tab value="camera">Camera</Tabs.Tab>
      </Tabs.List>
      {/* Data */}
      <DataTabsSection
        tabPadding={tabPadding}
        displayedData={displayedData}
        setDisplayedData={setDisplayedData}
      />

      {/* Actions */}
      <ActionTabsSection
        connected={connected}
        tabPadding={tabPadding}
        currentFlightModeNumber={currentFlightModeNumber}
        aircraftType={aircraftType}
        getIsArmed={getIsArmed}
      ></ActionTabsSection>

      {/* Mission */}
      <MissionTabsSection
        connected={connected}
        tabPadding={tabPadding}
        currentMissionData={currentMissionData}
        navControllerOutputData={navControllerOutputData}
        currentFlightModeNumber={currentFlightModeNumber}
        aircraftType={aircraftType}
      />

      {/* Camera */}
      <CameraTabsSection tabPadding={tabPadding} />
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
