// Serial Ports Configuration Page
import { useEffect } from "react"
import {
  Table,
  Select,
  MultiSelect,
  ScrollArea,
  Text,
  Tooltip,
} from "@mantine/core"
import { useListState } from "@mantine/hooks"

// Custom components, helpers and data
import apmParamDefsCopter from "../../../data/gen_apm_params_def_copter.json"
import apmParamDefsPlane from "../../../data/gen_apm_params_def_plane.json"

import { useSelector, useDispatch } from "react-redux"
import { selectAircraftType } from "../../redux/slices/droneInfoSlice"
import {
  emitGetSerialPortsConfig,
  emitSetSerialPortConfigParam,
  selectSerialPortsConfig,
} from "../../redux/slices/configSlice"
import { emitSetState } from "../../redux/slices/droneConnectionSlice"
import { selectConnectedToDrone } from "../../redux/slices/droneConnectionSlice"

// Bitmask Select component for OPTIONS field.
function OptionsBitmaskSelect({ value, onChange, options }) {
  const [selected, selectedHandler] = useListState([])

  useEffect(() => {
    parseBitmask(value)
  }, [value])

  function parseBitmask(bitmaskToParse) {
    const binaryString = dec2bin(bitmaskToParse)
    const selectedArray = []

    binaryString
      .split("")
      .reverse()
      .map((bit, index) => {
        if (bit === "1") {
          selectedArray.push(`${index}`)
        }
      })

    selectedHandler.setState(selectedArray)
  }

  function createBitmask(value) {
    const initialValue = 0
    const bitmask = value.reduce(
      (accumulator, currentValue) => accumulator + 2 ** parseInt(currentValue),
      initialValue,
    )
    selectedHandler.setState(value)
    onChange(bitmask)
  }

  function dec2bin(dec) {
    return (dec >>> 0).toString(2)
  }

  const data = options
    ? Object.keys(options).map((key) => ({
        value: `${key}`,
        label: `${options[key]}`,
      }))
    : []

  return (
    <ScrollArea.Autosize className="max-h-24 min-w-[200px]">
      <MultiSelect
        value={selected}
        onChange={createBitmask}
        data={data}
        size="xs"
        placeholder="Select options"
      />
    </ScrollArea.Autosize>
  )
}

export default function SerialPorts() {
  const dispatch = useDispatch()
  const aircraftType = useSelector(selectAircraftType)
  const serialPortsConfig = useSelector(selectSerialPortsConfig)
  const connected = useSelector(selectConnectedToDrone)

  // Helper to get paramDef for a given param_id
  function getParamDef(param_id) {
    if (aircraftType === 1) return apmParamDefsPlane[param_id]
    if (aircraftType === 2) return apmParamDefsCopter[param_id]
    return undefined
  }

  // Helper to handle param change
  function handleParamChange(param_id, value) {
    dispatch(
      emitSetSerialPortConfigParam({
        param_id,
        value: parseInt(value),
      }),
    )
  }

  // Build serial port rows (1-7)
  const serialPortRows = Array.from({ length: 7 }, (_, i) => {
    const portNumber = i + 1
    const config = serialPortsConfig[portNumber] || {}
    return {
      number: portNumber,
      protocol: config.protocol,
      baud: config.baud,
      options: config.options,
    }
  })

  useEffect(() => {
    if (connected) {
      dispatch(emitSetState("config.serial_ports"))
      dispatch(emitGetSerialPortsConfig())
    }
  }, [connected, dispatch])

  return (
    <div className="p-4 overflow-auto">
      <Text size="lg" fw={500} mb="md">
        Serial Port Configuration
      </Text>

      <Table withRowBorders={false} className="!w-fit">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Port</Table.Th>
            <Table.Th>Speed</Table.Th>
            <Table.Th>Protocol</Table.Th>
            <Table.Th>Options</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {serialPortRows.map((port) => {
            const num = port.number
            const protocolParam = `SERIAL${num}_PROTOCOL`
            const baudParam = `SERIAL${num}_BAUD`
            const optionsParam = `SERIAL${num}_OPTIONS`

            const protocolDef = getParamDef(protocolParam)
            const baudDef = getParamDef(baudParam)
            const optionsDef = getParamDef(optionsParam)

            const protocolOptions = protocolDef?.Values
              ? Object.entries(protocolDef.Values).map(([value, label]) => ({
                  value,
                  label: `${label}`,
                }))
              : []

            // Baud rate handling
            const baudOptions = baudDef?.Values
              ? Object.entries(baudDef.Values).map(([value, label]) => ({
                  value,
                  label: `${label}`,
                }))
              : []

            return (
              <Table.Tr key={num} className="h-12">
                <Table.Td>
                  <Tooltip
                    label={protocolDef?.DisplayName || `Serial Port ${num}`}
                    position="top-start"
                  >
                    <Text fw={500}>SERIAL{num}</Text>
                  </Tooltip>
                </Table.Td>
                <Table.Td>
                  <Tooltip
                    label={
                      <ScrollArea.Autosize className="max-h-48 max-w-80">
                        <div>
                          {baudDef?.Description || "Baud rate selection"}
                          {baudDef?.Range && (
                            <Text size="xs" mt={4}>
                              Range: {baudDef.Range.low} - {baudDef.Range.high}
                            </Text>
                          )}
                        </div>
                      </ScrollArea.Autosize>
                    }
                    position="top"
                    multiline
                  >
                    <Select
                      data={baudOptions}
                      value={port.baud?.toString() || ""}
                      placeholder="Select baud"
                      size="xs"
                      className="min-w-[120px]"
                      onChange={(val) => handleParamChange(baudParam, val)}
                    />
                  </Tooltip>
                </Table.Td>
                <Table.Td>
                  <Tooltip
                    label={
                      <ScrollArea.Autosize className="max-h-48 max-w-80">
                        {protocolDef?.Description || "Protocol selection"}
                      </ScrollArea.Autosize>
                    }
                    position="top"
                    multiline
                  >
                    <Select
                      data={protocolOptions}
                      value={port.protocol?.toString() || ""}
                      placeholder="Select protocol"
                      size="xs"
                      className="min-w-[180px]"
                      onChange={(val) => handleParamChange(protocolParam, val)}
                    />
                  </Tooltip>
                </Table.Td>
                <Table.Td>
                  <Tooltip
                    label={
                      <ScrollArea.Autosize className="max-h-48 max-w-80">
                        {optionsDef?.Description || "Serial port options"}
                      </ScrollArea.Autosize>
                    }
                    position="top"
                    multiline
                  >
                    <div>
                      <OptionsBitmaskSelect
                        value={port.options || 0}
                        onChange={(val) => handleParamChange(optionsParam, val)}
                        options={optionsDef?.Bitmask}
                      />
                    </div>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>

      <Text size="md" fw={500} mt="md">
        Note: Changes to the serial port settings will not take effect until the
        board is rebooted.
      </Text>
    </div>
  )
}
