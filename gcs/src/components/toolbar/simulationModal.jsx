import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  SimpleGrid,
  Modal,
  Text,
  Button,
  Select,
  NumberInput,
  Checkbox,
  Tooltip,
  Group,
} from "@mantine/core"
import { IconInfoCircle, IconRefresh } from "@tabler/icons-react"
import {
  setSimulationModalOpened,
  setSimulationParams,
  setSimulationParam,
  selectSimulationModalOpened,
  selectSimulationParams,
  selectIsSimulationRunning,
  emitStartSimulation,
  emitStopSimulation,
} from "../../redux/slices/droneConnectionSlice"

export default function SimulationModal() {
  const dispatch = useDispatch()
  const modalOpen = useSelector(selectSimulationModalOpened)
  const isSimulationRunning = useSelector(selectIsSimulationRunning)
  const simulationParams = useSelector(selectSimulationParams)
  const [checked, setChecked] = useState(false);

  return (
    <Modal
      opened={modalOpen}
      onClose={() => {
        dispatch(setSimulationModalOpened(false))
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
      <Text mb={16} c="dimmed" size="sm">
        Note: Docker must be running to start the simulator.
      </Text>

      <Select
        mb="md"
        label="Vehicle type"
        placeholder="Pick value"
        data={["ArduCopter", "ArduPlane", "Rover"]}
        value={simulationParams.vehicleType}
        allowDeselect={false}
        onChange={(value) => {
          if (value)
            dispatch(setSimulationParam({ key: "vehicleType", value: value }))
        }}
      />

      <SimpleGrid cols={2} spacing="md">
        <NumberInput
          label="Latitude"
          placeholder="Latitude"
          value={simulationParams.lat}
          onChange={(val) =>
            dispatch(setSimulationParam({ key: "lat", value: val }))
          }
        />

        <NumberInput
          label="Longitude"
          placeholder="Longitude"
          value={simulationParams.lon}
          onChange={(val) =>
            dispatch(setSimulationParam({ key: "lon", value: val }))
          }
        />

        <NumberInput
          label="Altitude"
          placeholder="Altitude"
          value={simulationParams.alt}
          onChange={(val) =>
            dispatch(setSimulationParam({ key: "alt", value: val }))
          }
        />

        <NumberInput
          label="Direction"
          placeholder="Direction"
          value={simulationParams.dir}
          onChange={(val) =>
            dispatch(setSimulationParam({ key: "dir", value: val }))
          }
        />
      </SimpleGrid>

      <Group justify="space-between" className="pt-8">
        <div className="flex flex-row gap-2">
          <Checkbox
            label="Connect after started"
            checked={checked}
            onChange={(event) =>
              setChecked(event.currentTarget.checked)
            }
          />
          <Tooltip label="If the simulation starts successfully, FGCS will attempt to connect to it">
            <IconInfoCircle size={20} />
          </Tooltip>
        </div>

        <Button
          variant="filled"
          color={isSimulationRunning ? "red" : "green"}
          onClick={() => {
            dispatch(
              isSimulationRunning ? emitStopSimulation() : emitStartSimulation(),
            )
          }}
        >
          {isSimulationRunning ? "Stop Simulation" : "Start Simulation"}
        </Button>
      </Group>
    </Modal>
  )
}
