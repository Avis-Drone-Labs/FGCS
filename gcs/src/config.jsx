/*
  The config screen. Allows the testing and configuration of the settings and parameters of the drone

  This includes gripper testing, motor testing, RC configuration and Flight mode configuration
*/

// Base imports
import { useEffect, useState } from "react"

// 3rd Party Imports
import { Tabs } from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../tailwind.config"

// Custom component and helpers
import FlightModes from "./components/config/flightModes"
import Gripper from "./components/config/gripper"
import Motortestpanel from "./components/config/motorTest"
import RadioCalibration from "./components/config/radioCalibration"
import Layout from "./components/layout"
import NoDroneConnected from "./components/noDroneConnected"
import {
  showErrorNotification,
  showSuccessNotification,
} from "./helpers/notification"
import { socket } from "./helpers/socket"

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function Config() {
  const [connected] = useLocalStorage({
    key: "connectedToDrone",
    defaultValue: false,
  })

  // States in the frontend
  const [activeTab, setActiveTab] = useState(null)
  const [gripperEnabled, setGripperEnabled] = useState(false)

  // Set state variables and display acknowledgement messages from the drone
  useEffect(() => {
    if (!connected) {
      setActiveTab(null)
      return
    } else {
      socket.emit("set_state", { state: "config" })
      socket.emit("gripper_enabled")
    }

    socket.on("gripper_enabled", setGripperEnabled)

    socket.on("set_gripper_result", (data) => {
      if (data.success) {
        showSuccessNotification(data.message)
      } else {
        showErrorNotification(data.message)
      }
    })

    socket.on("motor_test_result", (data) => {
      if (data.success) {
        showSuccessNotification(data.message)
      } else {
        showErrorNotification(data.message)
      }
    })

    socket.on("param_set_success", (data) => {
      showSuccessNotification(data.message)
    })

    socket.on("params_error", (data) => {
      showErrorNotification(data.message)
    })

    return () => {
      socket.off("gripper_enabled")
      socket.off("set_gripper_result")
      socket.off("motor_test_result")
      socket.off("param_set_success")
      socket.off("params_error")
    }
  }, [connected])

  return (
    <Layout currentPage="config">
      {connected ? (
        <div className="w-full h-full">
          <Tabs
            orientation="vertical"
            color={tailwindColors.falconred[800]}
            className="h-full"
            keepMounted={false}
            value={activeTab}
            onChange={setActiveTab}
          >
            <Tabs.List>
              <Tabs.Tab value="gripper" disabled={!gripperEnabled}>
                Gripper
              </Tabs.Tab>
              <Tabs.Tab value="motor_test">Motor Test</Tabs.Tab>
              <Tabs.Tab value="rc_calibration">RC Calibration</Tabs.Tab>
              <Tabs.Tab value="flightmodes">Flight modes</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="gripper">
              <Gripper />
            </Tabs.Panel>
            <Tabs.Panel value="motor_test">
              <Motortestpanel />
            </Tabs.Panel>
            <Tabs.Panel value="rc_calibration">
              <RadioCalibration />
            </Tabs.Panel>
            <Tabs.Panel value="flightmodes">
              <FlightModes />
            </Tabs.Panel>
          </Tabs>
        </div>
      ) : (
        <NoDroneConnected />
      )}
    </Layout>
  )
}
