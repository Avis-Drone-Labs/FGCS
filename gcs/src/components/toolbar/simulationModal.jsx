import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  Modal,
  Text,
  Button,
  Select,
  NumberInput,
  Checkbox,
  Tooltip,
  Group,
  ActionIcon,
} from "@mantine/core"
import { IconAlertCircle, IconInfoCircle, IconTrash } from "@tabler/icons-react"
import {
  SimulationStatus,
  addSimulationPort,
  emitStartSimulation,
  emitStopSimulation,
  removeSimulationPortById,
  selectIsSimulationRunning,
  selectSimulationConnectAfterStart,
  selectSimulationModalOpened,
  selectSimulationPorts,
  selectSimulationStatus,
  selectSimulationVehicleType,
  setSimulationConnectAfterStart,
  setSimulationModalOpened,
  setSimulationVehicleType,
  updateSimulationPortById,
} from "../../redux/slices/simulationParamsSlice"
import { selectIsConnectedToSocket } from "../../redux/slices/socketSlice"
import { showNotification } from "../../helpers/notification"
import {
  emitDisconnectFromDrone,
  selectConnectedToDrone,
  selectConnecting,
  selectConnectionStatus,
} from "../../redux/slices/droneConnectionSlice"
import ConnectionProgress from "../connectionProgress"

const normalizePort = (val) => {
  if (val === null || val === "" || val === undefined || isNaN(val)) {
    return undefined
  }
  return Number(val)
}

const getDuplicates = (values) => {
  const counts = new Map()
  values.forEach((v) => {
    if (v === null || v === undefined) return
    const current = counts.get(v) || 0
    counts.set(v, current + 1)
  })
  return new Set(
    Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([value]) => value),
  )
}

export default function SimulationModal() {
  const dispatch = useDispatch()
  const modalOpen = useSelector(selectSimulationModalOpened)
  const isSimulationRunning = useSelector(selectIsSimulationRunning)
  const simulationStatus = useSelector(selectSimulationStatus)
  const ports = useSelector(selectSimulationPorts)
  const vehicleType = useSelector(selectSimulationVehicleType)
  const connectAfterStart = useSelector(selectSimulationConnectAfterStart)
  const connectedToSocket = useSelector(selectIsConnectedToSocket)
  const droneConnectionStatus = useSelector(selectConnectionStatus)
  const connecting = useSelector(selectConnecting)
  const connectedToDrone = useSelector(selectConnectedToDrone)

  const [pendingStopAfterDisconnect, setPendingStopAfterDisconnect] =
    useState(false)

  useEffect(() => {
    if (!pendingStopAfterDisconnect) return
    if (connectedToDrone) return
    if (!isSimulationRunning) {
      setPendingStopAfterDisconnect(false)
      return
    }

    dispatch(emitStopSimulation())
    setPendingStopAfterDisconnect(false)
  }, [
    pendingStopAfterDisconnect,
    connectedToDrone,
    isSimulationRunning,
    dispatch,
  ])

  const duplicateHostPorts = getDuplicates(ports.map((p) => p.hostPort))
  const duplicateContainerPorts = getDuplicates(
    ports.map((p) => p.containerPort),
  )
  const hasEmptyPort = ports.some(
    (p) =>
      normalizePort(p.hostPort) === undefined ||
      normalizePort(p.containerPort) === undefined,
  )

  return (
    <Modal
      opened={modalOpen}
      onClose={() => {
        dispatch(setSimulationModalOpened(false))
        if (simulationStatus === SimulationStatus.Starting) {
          showNotification(
            "Simulation still starting",
            "The simulator is still starting and will continue in the background",
          )
        } else if (simulationStatus === SimulationStatus.Stopping) {
          showNotification(
            "Simulation still stopping",
            "The simulator is still stopping and will continue in the background",
          )
        }
      }}
      title="SITL Simulator"
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
    >
      {ports.map((port) => (
        <Group spacing="md" mb="md" key={port.id} wrap="nowrap" align="end">
          <NumberInput
            label="Host Port"
            min={1025}
            max={65535}
            hideControls
            allowDecimal={false}
            value={port.hostPort}
            style={{ flex: 1 }}
            error={
              duplicateHostPorts.has(port.hostPort) ||
              normalizePort(port.hostPort) === undefined
            }
            onChange={(val) =>
              dispatch(
                updateSimulationPortById({
                  id: port.id,
                  key: "hostPort",
                  value: normalizePort(val),
                }),
              )
            }
          />

          <NumberInput
            label="Container Port"
            min={1}
            max={65535}
            hideControls
            allowDecimal={false}
            value={port.containerPort}
            style={{ flex: 1 }}
            error={
              duplicateContainerPorts.has(port.containerPort) ||
              normalizePort(port.containerPort) === undefined
            }
            onChange={(val) =>
              dispatch(
                updateSimulationPortById({
                  id: port.id,
                  key: "containerPort",
                  value: normalizePort(val),
                }),
              )
            }
          />

          {ports.length > 1 && (
            <Tooltip label="Remove port" withArrow>
              <ActionIcon
                color="red"
                aria-label="Remove port"
                size={36}
                onClick={() => dispatch(removeSimulationPortById(port.id))}
              >
                <IconTrash size={20} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      ))}

      {(duplicateHostPorts.size > 0 || duplicateContainerPorts.size > 0) && (
        <Group mb="md" gap={6} align="center">
          <IconAlertCircle size={18} color="red" />
          <Text size="sm" c="red.7">
            Duplicated ports
          </Text>
        </Group>
      )}

      <Button
        fullWidth
        variant="default"
        mb="md"
        onClick={() => dispatch(addSimulationPort())}
      >
        Add Port
      </Button>

      <Select
        mb="md"
        label="Vehicle type"
        placeholder="Pick value"
        data={["ArduCopter", "ArduPlane"]}
        value={vehicleType}
        allowDeselect={false}
        onChange={(value) => {
          if (value) dispatch(setSimulationVehicleType(value))
        }}
      />

      <Text mt="md" c="dimmed" size="sm">
        Note: Docker must be running to start the simulator.
      </Text>

      <Group justify="space-between" className="pt-4">
        <div className="flex flex-row gap-2">
          <Checkbox
            label="Connect after starting"
            checked={connectAfterStart}
            onChange={(event) =>
              dispatch(
                setSimulationConnectAfterStart(event.currentTarget.checked),
              )
            }
            disabled={!connectedToSocket}
          />
          <Tooltip
            label={
              connectedToSocket
                ? "If the simulation starts successfully, FGCS will attempt to connect to the first port listed"
                : "Not connected to socket"
            }
          >
            <IconInfoCircle size={20} />
          </Tooltip>
        </div>

        <Button
          variant="filled"
          color={isSimulationRunning ? "red" : "green"}
          onClick={() => {
            if (isSimulationRunning) {
              if (connectedToDrone) {
                // TODO: and that connection is to the simulator
                setPendingStopAfterDisconnect(true)
                dispatch(emitDisconnectFromDrone())
                return
              }

              dispatch(emitStopSimulation())
              return
            }

            dispatch(emitStartSimulation())
          }}
          loading={
            simulationStatus === SimulationStatus.Starting ||
            simulationStatus === SimulationStatus.Stopping
          }
          disabled={
            !connectedToSocket ||
            duplicateHostPorts.size > 0 ||
            duplicateContainerPorts.size > 0 ||
            hasEmptyPort
          }
        >
          {isSimulationRunning ? "Stop Simulator" : "Start Simulator"}
        </Button>
      </Group>

      <ConnectionProgress
        connecting={connecting}
        status={droneConnectionStatus}
      />
    </Modal>
  )
}
