/*
  Drone connection component. This handles the full workflow of connecting to a drone, 
  including managing socket events, listing COM ports, selecting connection type (serial or network),
  showing the connection modal, and providing connect/disconnect controls.

  All connection state and logic is contained here, so the parent component only needs 
  to render <Drone /> without handling any of the connection details.
*/

// Base imports
import { useEffect, useState } from "react"

// Third party imports
import {
  Button,
  Checkbox,
  Group,
  LoadingOverlay,
  Modal,
  SegmentedControl,
  Select,
  Tabs,
  TextInput,
  Tooltip,
} from "@mantine/core"
import {
  useDisclosure,
  useLocalStorage,
  useSessionStorage,
} from "@mantine/hooks"
import { IconInfoCircle, IconRefresh } from "@tabler/icons-react"

// Local imports
import { AddCommand } from "../spotlight/commandHandler.js"

// Helper imports
import { showErrorNotification } from "../../helpers/notification.js"
import {
    connectedToSocket,
    setConnected,
    setConnectedToSocket,
} from "../../helpers/droneUtils.js"

import { socket } from "../../helpers/socket"

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config.js"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function Drone() {

    const [opened, { open, close }] = useDisclosure(false)

    // Connection to drone
    const [connecting, setConnecting] = useState(false)

    const [wireless, setWireless] = useLocalStorage({
        key: "wirelessConnection",
        defaultValue: true,
    })

    const [selectedBaudRate, setSelectedBaudRate] = useLocalStorage({
        key: "baudrate",
        defaultValue: "9600",
    })
    const [droneConnectionStatusMessage, setDroneConnectionStatusMessage] = useState(null)

    function getComPorts() {
        if (!connectedToSocket) return
        socket.emit("get_com_ports")
        setFetchingComPorts(true)
    }

    // eslint-disable-next-line no-unused-vars
    const [aircraftType, setAircraftType] = useLocalStorage({
        key: "aircraftType",
        defaultValue: 0,
    })

    const ConnectionType = {
        Serial: "serial",
        Network: "network",
    }

    const [connectionType, setConnectionType] = useLocalStorage({
        key: "connectionType",
        defaultValue: ConnectionType.Serial,
    })

    // Network Connection
    const [networkType, setNetworkType] = useLocalStorage({
        key: "networkType",
        defaultValue: "tcp",
    })
    const [ip, setIp] = useLocalStorage({
        key: "ip",
        defaultValue: "127.0.0.1",
    })
    const [port, setPort] = useLocalStorage({
        key: "port",
        defaultValue: "5760",
    })

    // Com Ports
    const [comPorts, setComPorts] = useState([])
    const [selectedComPort, setSelectedComPort] = useSessionStorage({
        key: "selectedComPort",
        defaultValue: null,
    })
    const [fetchingComPorts, setFetchingComPorts] = useState(false)

    // Check if connected to drone
    useEffect(() => {
    if (selectedComPort === null) {
      socket.emit("is_connected_to_drone")
    }

    socket.on("connect", () => {
      setConnectedToSocket(true)
    })

    socket.on("disconnect", () => {
      setConnectedToSocket(false)
    })

    // Flag connected/not connected, if not fetch ports
    socket.on("is_connected_to_drone", (msg) => {
      if (msg) {
        setConnected(true)
      } else {
        setConnected(false)
        setConnecting(false)
        getComPorts()
      }
    })

    // Fetch com ports and list them
    socket.on("list_com_ports", (msg) => {
      setFetchingComPorts(false)
      setComPorts(msg)
      if (selectedComPort === null || !msg.includes(selectedComPort)) {
        const possibleComPort = msg.find(
          (port) =>
            port.toLowerCase().includes("mavlink") ||
            port.toLowerCase().includes("ardupilot"),
        )
        if (possibleComPort !== undefined) {
          setSelectedComPort(possibleComPort)
        } else if (msg.length > 0) {
          setSelectedComPort(msg[0])
        }
      }
    })

    // Flags that the drone is connected
    socket.on("connected_to_drone", (data) => {
      setAircraftType(data.aircraft_type)
      if (data.aircraft_type != 1 && data.aircraft_type != 2) {
        showErrorNotification("Aircraft not of type quadcopter or plane")
      }
      setConnected(true)
      setConnecting(false)
      close()
    })

    // Flags that the drone is disconnected
    socket.on("disconnected_from_drone", () => {
      console.log("disconnected_from_drone")
      setConnected(false)
    })

    // Handles disconnect trigger
    socket.on("disconnect", () => {
      setConnected(false)
      setConnecting(false)
    })

    // Flags an error with the com port
    socket.on("connection_error", (msg) => {
      console.log(msg.message)
      showErrorNotification(msg.message)
      setConnecting(false)
      setConnected(false)
    })

    socket.on("drone_connect_status", (msg) => {
      setDroneConnectionStatusMessage(msg.message)
    })

    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("is_connected_to_drone")
      socket.off("list_com_ports")
      socket.off("connected_to_drone")
      socket.off("disconnected_from_drone")
      socket.off("disconnect")
      socket.off("connection_error")
      socket.off("drone_connect_status")
      setConnected(false)
    }
  }, [])

  function connectToDrone(type) {
    if (type === ConnectionType.Serial) {
      socket.emit("connect_to_drone", {
        port: selectedComPort,
        baud: parseInt(selectedBaudRate),
        wireless: wireless,
        connectionType: type,
      })
    } else if (type === ConnectionType.Network) {
      if (ip === "" || port === "") {
        showErrorNotification("IP Address and Port cannot be empty")
        return
      }
      const networkString = `${networkType}:${ip}:${port}`
      socket.emit("connect_to_drone", {
        port: networkString,
        baud: 115200,
        wireless: true,
        connectionType: type,
      })
    } else {
      return
    }
    setConnecting(true)
  }

  function disconnect() {
    socket.emit("disconnect_from_drone")
  }

  function connectToDroneFromButton() {
    getComPorts()
    open()
  }
  AddCommand("connect_to_drone", connectToDroneFromButton)
  AddCommand("disconnect_from_drone", disconnect)

  return (
    <Modal
        opened={opened}
        onClose={() => {
          close()
          setConnecting(false)
        }}
        title="Connect to aircraft"
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        styles={{
          content: {
            borderRadius: "0.5rem",
          },
        }}
        withCloseButton={false}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            connectToDrone(connectionType)
          }}
        >
          <Tabs value={connectionType} onChange={setConnectionType}>
            <Tabs.List grow>
              <Tabs.Tab value={ConnectionType.Serial}>
                Serial Connection
              </Tabs.Tab>
              <Tabs.Tab value={ConnectionType.Network}>
                Network Connection
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value={ConnectionType.Serial} className="py-4">
              <LoadingOverlay visible={fetchingComPorts} />
              <div className="flex flex-col space-y-4">
                <Select
                  label="COM Port"
                  description="Select a COM Port from the ones available"
                  placeholder={
                    comPorts.length ? "Select a COM port" : "No COM ports found"
                  }
                  data={comPorts}
                  value={selectedComPort}
                  onChange={setSelectedComPort}
                  rightSectionPointerEvents="all"
                  rightSection={<IconRefresh />}
                  rightSectionProps={{
                    onClick: getComPorts,
                    className: "hover:cursor-pointer hover:bg-transparent/50",
                  }}
                />
                <Select
                  label="Baud Rate"
                  description="Select a baud rate for the specified COM Port"
                  data={[
                    "300",
                    "1200",
                    "4800",
                    "9600",
                    "19200",
                    "13400",
                    "38400",
                    "57600",
                    "74880",
                    "115200",
                    "230400",
                    "250000",
                  ]}
                  value={selectedBaudRate}
                  onChange={setSelectedBaudRate}
                />
                <div className="flex flex-row gap-2">
                  <Checkbox
                    label="Wireless Connection"
                    checked={wireless}
                    onChange={(event) =>
                      setWireless(event.currentTarget.checked)
                    }
                  />
                  <Tooltip label="Wireless connection mode reduces the telemetry data rates to save bandwidth">
                    <IconInfoCircle size={20} />
                  </Tooltip>
                </div>
              </div>
            </Tabs.Panel>
            <Tabs.Panel value={ConnectionType.Network} className="py-4">
              <div className="flex flex-col space-y-4">
                <SegmentedControl
                  label="Network Connection type"
                  description="Select a network connection type"
                  value={networkType}
                  onChange={setNetworkType}
                  data={[
                    { value: "tcp", label: "TCP" },
                    { value: "udp", label: "UDP" },
                  ]}
                />
                <TextInput
                  label="IP Address"
                  description="Enter the IP Address"
                  placeholder="127.0.0.1"
                  value={ip}
                  onChange={(event) => setIp(event.currentTarget.value)}
                  data-autofocus
                />
                <TextInput
                  label="Port"
                  description="Enter the port number"
                  placeholder="5760"
                  value={port}
                  onChange={(event) => setPort(event.currentTarget.value)}
                />
              </div>
            </Tabs.Panel>
          </Tabs>

          <Group justify="space-between" className="pt-4">
            <Button
              variant="filled"
              color={tailwindColors.red[600]}
              onClick={() => {
                close()
                setConnecting(false)
              }}
            >
              Close
            </Button>
            <Button
              variant="filled"
              type="submit"
              color={tailwindColors.green[600]}
              disabled={
                !connectedToSocket ||
                (connectionType == ConnectionType.Serial &&
                  selectedComPort === null)
              }
              loading={connecting}
            >
              Connect
            </Button>
          </Group>
        </form>

        {connecting && droneConnectionStatusMessage !== null && (
          <p className="text-center mt-4">{droneConnectionStatusMessage}</p>
        )}
      </Modal>
  )
}