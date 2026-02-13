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
import { IconInfoCircle, IconX } from "@tabler/icons-react"
import {
  SimulationStatus,
  addSimulationPort,
  emitStartSimulation,
  emitStopSimulation,
  removeSimulationPort,
  selectIsSimulationRunning,
  selectSimulationConnectAfterStart,
  selectSimulationModalOpened,
  selectSimulationPorts,
  selectSimulationStatus,
  selectSimulationVehicleType,
  setSimulationConnectAfterStart,
  setSimulationModalOpened,
  setSimulationVehicleType,
  updateSimulationPort,
} from "../../redux/slices/simulationParamsSlice"
import { selectIsConnectedToSocket } from "../../redux/slices/socketSlice"
import { showNotification } from "../../helpers/notification"

export default function SimulationModal() {
  const dispatch = useDispatch()
  const modalOpen = useSelector(selectSimulationModalOpened)
  const isSimulationRunning = useSelector(selectIsSimulationRunning)
  const simulationStatus = useSelector(selectSimulationStatus)
  const ports = useSelector(selectSimulationPorts)
  const vehicleType = useSelector(selectSimulationVehicleType)
  const connectAfterStart = useSelector(selectSimulationConnectAfterStart)
  const connectedToSocket = useSelector(selectIsConnectedToSocket)

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
      {ports.map((port, index) => (
        <Group spacing="md" mb="md" key={index} wrap="nowrap" align="end">
          <NumberInput
            label="Host Port"
            min={1025}
            max={65535}
            allowDecimal={false}
            value={port.hostPort}
            style={{ flex: 1 }}
            onChange={(val) =>
              dispatch(
                updateSimulationPort({
                  index,
                  key: "hostPort",
                  value: val,
                }),
              )
            }
          />

          <NumberInput
            label="Container Port"
            min={1}
            max={65535}
            allowDecimal={false}
            value={port.containerPort}
            style={{ flex: 1 }}
            onChange={(val) =>
              dispatch(
                updateSimulationPort({
                  index,
                  key: "containerPort",
                  value: val,
                }),
              )
            }
          />

          {ports.length > 1 && (
            <ActionIcon
              color="red"
              aria-label="Remove port"
              size={36}
              onClick={() => dispatch(removeSimulationPort(index))}
            >
              <IconX size={18} />
            </ActionIcon>
          )}
        </Group>
      ))}

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
                ? "If the simulation starts successfully, FGCS will attempt to connect to it"
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
            dispatch(
              isSimulationRunning
                ? emitStopSimulation()
                : emitStartSimulation(),
            )
          }}
          loading={simulationStatus === SimulationStatus.Starting}
          disabled={!connectedToSocket && !isSimulationRunning}
        >
          {isSimulationRunning ? "Stop Simulator" : "Start Simulator"}
        </Button>
      </Group>
    </Modal>
  )
}
