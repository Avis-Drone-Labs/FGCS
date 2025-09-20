/*
  The navbar component.

  This is shown at the top of each page. To change this please look at the layout component as this
  is where it is loaded. This also handles the connections to the drone as this is always loaded,
  in the future we may change this so that its loaded in its own component.
*/

// Base imports
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
import { useSessionStorage } from "@mantine/hooks"
import { IconInfoCircle, IconRefresh } from "@tabler/icons-react"

// Local imports
import { AddCommand } from "./spotlight/commandHandler.js"

// Helper imports
import { IconAlertTriangle } from "@tabler/icons-react"

// Redux
import { useDispatch, useSelector } from "react-redux"
import {
  ConnectionType,
  emitConnectToDrone,
  emitDisconnectFromDrone,
  emitGetComPorts,
  selectBaudrate,
  selectComPorts,
  selectConnectedToDrone,
  selectConnecting,
  selectConnectionModal,
  selectConnectionStatus,
  selectConnectionType,
  selectFetchingComPorts,
  selectIp,
  selectNetworkType,
  selectPort,
  selectSelectedComPorts,
  selectWireless,
  setBaudrate,
  setConnecting,
  setConnectionModal,
  setConnectionType,
  setIp,
  setNetworkType,
  setPort,
  setSelectedComPorts,
  setWireless,
} from "../redux/slices/droneConnectionSlice.js"
import { selectIsConnectedToSocket } from "../redux/slices/socketSlice.js"

// Styling imports
import { useEffect } from "react"
import { twMerge } from "tailwind-merge"
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../tailwind.config.js"
import { queueErrorNotification } from "../redux/slices/notificationSlice.js"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function Navbar() {
  // Redux
  const dispatch = useDispatch()
  const openedModal = useSelector(selectConnectionModal)

  const connecting = useSelector(selectConnecting)
  const connectedToDrone = useSelector(selectConnectedToDrone)
  const connectedToSocket = useSelector(selectIsConnectedToSocket)

  const comPorts = useSelector(selectComPorts)
  const selectedComPort = useSelector(selectSelectedComPorts)
  const fetchingComPorts = useSelector(selectFetchingComPorts)
  const wireless = useSelector(selectWireless)
  const selectedBaudRate = useSelector(selectBaudrate)
  const connectionType = useSelector(selectConnectionType)
  const networkType = useSelector(selectNetworkType)
  const ip = useSelector(selectIp)
  const port = useSelector(selectPort)
  const droneConnectionStatusMessage = useSelector(selectConnectionStatus)

  // Panel is open/closed
  const [outOfDate] = useSessionStorage({ key: "outOfDate" })
  const [currentPage] = useSessionStorage({
    key: "currentPage",
    defaultValue: "dashboard",
  })

  function connectToDrone(type) {
    if (type === ConnectionType.Serial) {
      dispatch(
        emitConnectToDrone({
          port: selectedComPort,
          baud: parseInt(selectedBaudRate),
          wireless: wireless,
          connectionType: type,
        }),
      )
    } else if (type === ConnectionType.Network) {
      if (ip === "" || port === "") {
        dispatch(queueErrorNotification("IP Address and Port cannot be empty"))
        return
      }
      const networkString = `${networkType}:${ip}:${port}`
      dispatch(
        emitConnectToDrone({
          port: networkString,
          baud: 115200,
          wireless: true,
          connectionType: type,
        }),
      )
    } else {
      return
    }

    dispatch(setConnecting(true))
  }

  // All seems to be broken, made a ticket for joe to look into: https://github.com/orgs/Avis-Drone-Labs/projects/10/views/1?pane=issue&itemId=124913361
  function disconnect() {
    dispatch(emitDisconnectFromDrone())
  }

  function connectToDroneFromButton() {
    dispatch(emitGetComPorts())
    dispatch(setConnectionModal(true))
  }

  useEffect(() => {
    AddCommand("connect_to_drone", connectToDroneFromButton)
    AddCommand("disconnect_from_drone", disconnect)
  }, [])

  const linkClassName =
    "text-md px-2 rounded-sm outline-none focus:text-falconred-400 hover:text-falconred-400 transition-colors delay-50"

  return (
    <div className="flex flex-row items-center justify-center py-2 px-2 bg-falcongrey-900">
      {/* Connect to drone modal - should probably be moved into its own component? */}
      <Modal
        opened={openedModal}
        onClose={() => {
          dispatch(setConnectionModal(false))
          dispatch(setConnecting(false))
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
          <Tabs
            value={connectionType}
            onChange={(value) => dispatch(setConnectionType(value))}
          >
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
                  onChange={(value) => dispatch(setSelectedComPorts(value))}
                  rightSectionPointerEvents="all"
                  rightSection={<IconRefresh />}
                  rightSectionProps={{
                    onClick: () => dispatch(emitGetComPorts()),
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
                  onChange={(value) => dispatch(setBaudrate(value))}
                />
                <div className="flex flex-row gap-2">
                  <Checkbox
                    label="Wireless Connection"
                    checked={wireless}
                    onChange={(event) =>
                      dispatch(setWireless(event.currentTarget.checked))
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
                  onChange={(value) => dispatch(setNetworkType(value))}
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
                  onChange={(event) =>
                    dispatch(setIp(event.currentTarget.value))
                  }
                  data-autofocus
                />
                <TextInput
                  label="Port"
                  description="Enter the port number"
                  placeholder="5760"
                  value={port}
                  onChange={(event) =>
                    dispatch(setPort(event.currentTarget.value))
                  }
                />
              </div>
            </Tabs.Panel>
          </Tabs>

          <Group justify="space-between" className="pt-4">
            <Button
              variant="filled"
              color={tailwindColors.red[600]}
              onClick={() => {
                dispatch(setConnectionModal(false))
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
            {connectedToDrone && (
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
              onClick={connectedToDrone ? disconnect : connectToDroneFromButton}
              color={
                connectedToDrone
                  ? tailwindColors.falconred[800]
                  : tailwindColors.green[600]
              }
              radius="xs"
            >
              {connectedToDrone ? "Disconnect" : "Connect"}
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
