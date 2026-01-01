import { useDispatch, useSelector } from "react-redux"
import { Modal, Text, Button } from "@mantine/core"
import {
  setSimulationModalOpened,
  selectSimulationModalOpened,
  selectIsSimulationRunning,
  emitStartSimulation,
  emitStopSimulation,
} from "../../redux/slices/droneConnectionSlice"

export default function SimulationModal() {
  const dispatch = useDispatch()
  const modalOpen = useSelector(selectSimulationModalOpened)
  const isSimulationRunning = useSelector(selectIsSimulationRunning)

  return (
    <Modal
      opened={modalOpen}
      onClose={() => {
        dispatch(setSimulationModalOpened(false))
      }}
      title="Simulation Modal"
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
      <Text mb={16} c="dimmed" size="sm">
        Note: This is a note
      </Text>

      {/* <TextInput
        label="Forwarding Address"
        description={
          isForwarding
            ? "MAVLink packets are being forwarded to this address"
            : "Enter the address to forward MAVLink packets to"
        }
        placeholder="e.g. udpout:192.168.1.10:14550"
        value={forwardingAddress}
        onChange={(event) =>
          dispatch(setForwardingAddress(event.currentTarget.value))
        }
        data-autofocus
        disabled={isForwarding}
      /> */}

      <Button
        className="mt-8"
        variant="filled"
        color={"green"}
        onClick={() => {
          dispatch(
            isSimulationRunning ? emitStopSimulation() : emitStartSimulation()
          )
        }}
      >
        {isSimulationRunning ? "Stop Simulation" : "Start Simulation"}
      </Button>
    </Modal>
  )
}
