/*
  The config screen. Allows the testing and configuration of the settings and parameters of the drone

  This includes gripper testing, motor testing, RC configuration and Flight mode configuration
*/

// Base imports
import { useEffect, useState } from "react"

// 3rd Party Imports
import { Tabs } from "@mantine/core"

// Custom component and helpers
import FlightModes from "./components/config/flightModes"
import Gripper from "./components/config/gripper"
import Motortestpanel from "./components/config/motorTest"
import RadioCalibration from "./components/config/radioCalibration"
import Layout from "./components/layout"
import NoDroneConnected from "./components/noDroneConnected"

// Redux
import { useDispatch, useSelector } from "react-redux"
import Ftp from "./components/config/ftp"
import {
  emitGetGripperEnabled,
  selectGetGripperEnabled,
} from "./redux/slices/configSlice"
import { selectConnectedToDrone } from "./redux/slices/droneConnectionSlice"

export default function Config() {
  const dispatch = useDispatch()
  const connected = useSelector(selectConnectedToDrone)
  const getGripperEnabled = useSelector(selectGetGripperEnabled)

  // States in the frontend
  const [activeTab, setActiveTab] = useState(null)
  const paddingTop = "mt-4"

  // Set state variables and display acknowledgement messages from the drone
  useEffect(() => {
    if (!connected) {
      setActiveTab(null)
    } else {
      dispatch(emitGetGripperEnabled())
    }
  }, [connected])

  return (
    <Layout currentPage="config">
      {connected ? (
        <div className="w-full h-full">
          <Tabs
            orientation="vertical"
            color={"red"}
            className="h-full"
            keepMounted={false}
            value={activeTab}
            onChange={setActiveTab}
          >
            <Tabs.List>
              <Tabs.Tab value="gripper" disabled={!getGripperEnabled}>
                Gripper
              </Tabs.Tab>
              <Tabs.Tab value="motor_test">Motor Test</Tabs.Tab>
              <Tabs.Tab value="rc_calibration">RC Calibration</Tabs.Tab>
              <Tabs.Tab value="flightmodes">Flight modes</Tabs.Tab>
              <Tabs.Tab value="ftp">FTP</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="gripper">
              <div className={paddingTop}>
                <Gripper />
              </div>
            </Tabs.Panel>
            <Tabs.Panel value="motor_test">
              <div className={paddingTop}>
                <Motortestpanel />
              </div>
            </Tabs.Panel>
            <Tabs.Panel value="rc_calibration">
              <div className={paddingTop}>
                <RadioCalibration />
              </div>
            </Tabs.Panel>
            <Tabs.Panel value="flightmodes">
              <div className={paddingTop}>
                <FlightModes />
              </div>
            </Tabs.Panel>
            <Tabs.Panel value="ftp">
              <div className={paddingTop}>
                <Ftp />
              </div>
            </Tabs.Panel>
          </Tabs>
        </div>
      ) : (
        <NoDroneConnected tab="config" />
      )}
    </Layout>
  )
}
