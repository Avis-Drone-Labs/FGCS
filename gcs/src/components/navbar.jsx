/*
  The navbar component.

  This is shown at the top of each page. To change this please look at the layout component as this
  is where it is loaded. This also handles the connections to the drone as this is always loaded,
  in the future we may change this so that its loaded in its own component.
*/

// Base imports
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

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

// Redux
import { useDispatch, useSelector } from "react-redux"
import { emitIsConnectedToDrone, selectBaudrate, selectComPorts, selectConnected, selectConnecting, selectConnectionType, selectFetchingComPorts, selectIp, selectNetworkType, selectPort, selectSelectedComPorts, setBaudrate, setComPorts, setConnected, setConnecting, setConnectionType, setFetchingComPorts, setIp, setNetworkType, setPort, setSelectedComPorts } from "../redux/slices/droneConnectionSlice.js"
import { initSocket, selectIsConnectedToSocket, socketConnected } from "../redux/slices/socketSlice.js"
import { setDroneAircraftType } from "../redux/slices/droneInfoSlice.js"

// Local imports
import { AddCommand } from "./spotlight/commandHandler.js"

// Helper imports
import { IconAlertTriangle } from "@tabler/icons-react"
import { showErrorNotification } from "../helpers/notification.js"
import { socket } from "../helpers/socket"

// Styling imports
import { twMerge } from "tailwind-merge"
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../tailwind.config.js"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function Navbar({ currentPage }) {
  // NOTE: Sockets won't work till this runs
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(initSocket())
  }, [])
  
  // Non redux storage
  const [opened, { open, close }] = useDisclosure(false)
  const [outOfDate] = useSessionStorage({ key: "outOfDate" })
  const [wireless, setWireless] = useLocalStorage({
    key: "wirelessConnection",
    defaultValue: true,
  })
  const [droneConnectionStatusMessage, setDroneConnectionStatusMessage] =
    useState(null)

  
  // Drones redux selectors
  const connectedToSocket = useSelector(selectIsConnectedToSocket)
  const connecting = useSelector(selectConnecting)
  const connected = useSelector(selectConnected)
  const selectedBaudRate = useSelector(selectBaudrate)
  const connectionType = useSelector(selectConnectionType)

  const ConnectionType = {
    Serial: "serial",
    Network: "network",
  }

  // Com ports redux selectors
  const comPorts = useSelector(selectComPorts);
  const selectedComPort = useSelector(selectSelectedComPorts)
  const fetchingComPorts = useSelector(selectFetchingComPorts)

  // Network connection redux selectors
  const networkType = useSelector(selectNetworkType)
  const ip = useSelector(selectIp)
  const port = useSelector(selectPort)


  // Functions!
  function getComPorts() {
    if (!connectedToSocket) return
    socket.emit("get_com_ports")
    dispatch(setFetchingComPorts(true))
  }

  // Check if connected to drone
  useEffect(() => {
    if (selectedComPort === null) {
      dispatch(emitIsConnectedToDrone())
    }

    // Fetch com ports and list them
    socket.on("list_com_ports", (msg) => {
      dispatch(setFetchingComPorts(false))
      dispatch(setComPorts(msg))
      const possibleComPort = msg.find(
        (port) =>
          port.toLowerCase().includes("mavlink") ||
          port.toLowerCase().includes("ardupilot"),
      )
      if (possibleComPort !== undefined) {
        dispatch(setSelectedComPorts(possibleComPort))
      } else if (msg.length > 0) {
        dispatch(setSelectedComPorts(msg[0]))
      }
    })

    // Flags that the drone is connected
    socket.on("connected_to_drone", (data) => {
      dispatch(setDroneAircraftType(data.aircraft_type))  // There are two aircraftTypes, make sure to not use FLA one haha :D
      if (data.aircraft_type != 1 && data.aircraft_type != 2) {
        showErrorNotification("Aircraft not of type quadcopter or plane")
      }
      dispatch(setConnected(true))
      dispatch(setConnecting(false))
      close()
    })

    // Flags that the drone is disconnected
    socket.on("disconnected_from_drone", () => {
      console.log("disconnected_from_drone")
      dispatch(setConnected(false))
    })

    // Handles disconnect trigger
    socket.on("disconnect", () => {
      dispatch(setConnected(false))
      dispatch(setConnecting(false))
    })

    // Flags an error with the com port
    socket.on("connection_error", (msg) => {
      console.log(msg.message)
      showErrorNotification(msg.message)
      dispatch(setConnecting(false))
      dispatch(setConnected(false))
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
      dispatch(setConnected(false))
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
    dispatch(setConnecting(true))
  }

  function disconnect() {
    console.log("disconnect")
    socket.emit("disconnect_from_drone")
  }

  function connectToDroneFromButton() {
    getComPorts()
    open()
  }
  AddCommand("connect_to_drone", connectToDroneFromButton)
  AddCommand("disconnect_from_drone", disconnect)

  const linkClassName =
    "text-md px-2 rounded-sm outline-none focus:text-falconred-400 hover:text-falconred-400 transition-colors delay-50"

  return (
    <div className="flex flex-row items-center justify-center py-2 px-2 bg-falcongrey-900">
      {/* Connect to drone modal - should probably be moved into its own component? */}
      <Modal
        opened={opened}
        onClose={() => {
          close()
          dispatch(setConnecting(false))
        }}
        title="Connect to aircraft"
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        withCloseButton={false}
        styles={{
          content: {
            borderRadius: "0.5rem",
          },
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            connectToDrone(connectionType)
          }}
        >
          <Tabs value={connectionType} onChange={(e) => {dispatch(setConnectionType(e))}}>
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
                  onChange={(e) => dispatch(setSelectedComPorts(e))}
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
                  onChange={(e) => dispatch(setBaudrate(e))}
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
                  onChange={(e) => {dispatch(setNetworkType(e))}}
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
                  onChange={(event) => dispatch(setIp(event.currentTarget.value))}
                  data-autofocus
                />
                <TextInput
                  label="Port"
                  description="Enter the port number"
                  placeholder="5760"
                  value={port}
                  onChange={(event) => dispatch(setPort(event.currentTarget.value))}
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
                dispatch(setConnecting(false))
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

      <div className="w-full flex justify-between gap-x-4 xl:grid xl:grid-cols-2 xl:gap-0">
        <div className="flex items-center wrap">
          {/* Navigation */}
          <Link
            to="/"
            className={twMerge(
              linkClassName,
              currentPage === "dashboard" && "text-falconred font-bold",
            )}
          >
            Dashboard
          </Link>
          <Link
            to="/missions"
            className={twMerge(
              linkClassName,
              currentPage === "missions" && "text-falconred font-bold",
            )}
          >
            Missions
          </Link>
          <Link
            to="/graphs"
            className={twMerge(
              linkClassName,
              currentPage === "graphs" && "text-falconred font-bold",
            )}
          >
            Graphs
          </Link>
          <Link
            to="/params"
            className={twMerge(
              linkClassName,
              currentPage === "params" && "text-falconred font-bold",
            )}
          >
            Params
          </Link>
          <Link
            to="/config"
            className={twMerge(
              linkClassName,
              currentPage === "config" && "text-falconred font-bold",
            )}
          >
            Config
          </Link>
          <Link
            to="/fla"
            className={twMerge(
              linkClassName,
              currentPage === "fla" && "text-falconred font-bold",
            )}
          >
            FLA
          </Link>
        </div>

        {/* Right hand side information */}
        <div className="!ml-auto flex flex-row space-x-4 items-center">
          {/* Out of date warning */}
          {outOfDate && (
            <a
              href="https://github.com/Avis-Drone-Labs/FGCS/releases"
              target="_blank"
              className="flex flex-row gap-2 text-red-400 hover:text-red-600"
            >
              <IconAlertTriangle /> FGCS out of date
            </a>
          )}

          {/* Connected to message */}
          <p>
            {connected && (
              <>
                Connected to
                <span className="inline font-bold">
                  {
                    {
                      [ConnectionType.Serial]: ` ${selectedComPort}`,
                      [ConnectionType.Network]: ` ${networkType}:${ip}:${port}`,
                    }[connectionType]
                  }
                </span>
              </>
            )}
          </p>

          {/* Button to connect to drone */}
          {connectedToSocket ? (
            <Button
              onClick={connected ? disconnect : connectToDroneFromButton}
              color={
                connected
                  ? tailwindColors.falconred[800]
                  : tailwindColors.green[600]
              }
              radius="xs"
            >
              {connected ? "Disconnect" : "Connect"}
            </Button>
          ) : (
            <Tooltip label="Not connected to socket">
              <Button data-disabled onClick={(event) => event.preventDefault()}>
                Connect
              </Button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}
