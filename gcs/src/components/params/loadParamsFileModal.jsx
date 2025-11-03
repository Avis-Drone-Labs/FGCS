/*
    Modal that pops up when loading params from a file to show the user the param diff
*/

// 3rd party imports
import { Button, Modal, Table, TextInput } from "@mantine/core"

// Redux
import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { showSuccessNotification } from "../../helpers/notification"
import {
  appendModifiedParams,
  selectLoadedFileName,
  selectLoadedParams,
  selectLoadParamsFileModalOpen,
  setLoadParamsFileModalOpen,
} from "../../redux/slices/paramsSlice"

export default function LoadParamsFileModal() {
  const dispatch = useDispatch()
  const opened = useSelector(selectLoadParamsFileModalOpen)
  const loadedFileName = useSelector(selectLoadedFileName)
  const loadedParams = useSelector(selectLoadedParams)

  const [paramSearchValue, setParamSearchValue] = useState("")

  function acceptLoadedParams() {
    dispatch(
      appendModifiedParams(
        loadedParams.map((param) => ({
          param_id: param.id,
          param_value: param.newValue,
        })),
      ),
    )
    dispatch(setLoadParamsFileModalOpen(false))
    showSuccessNotification(
      `Successfully loaded ${loadedParams.length} parameters from ${loadedFileName}`,
    )
  }

  return (
    <Modal
      opened={opened}
      onClose={() => dispatch(setLoadParamsFileModalOpen(false))}
      title={`Load params from ${loadedFileName}`}
      closeOnClickOutside={false}
      closeOnEscape={false}
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      size="auto"
    >
      <div className="flex flex-col items-center justify-center gap-4 w-full">
        <TextInput
          placeholder="Search parameters"
          value={paramSearchValue}
          onChange={(event) => setParamSearchValue(event.currentTarget.value)}
          className="w-full"
        />
        <Table.ScrollContainer maxHeight={600} className="w-full">
          <Table striped highlightOnHover withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th className="w-56">Parameter</Table.Th>
                <Table.Th className="w-40">Current value</Table.Th>
                <Table.Th className="w-40">New value</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loadedParams
                .filter((param) =>
                  param.id
                    .toLowerCase()
                    .includes(paramSearchValue.toLowerCase()),
                )
                .sort((a, b) => a.id.localeCompare(b.id))
                .map((param) => (
                  <Table.Tr key={param.id}>
                    <Table.Td>{param.id}</Table.Td>
                    <Table.Td>{param.oldValue}</Table.Td>
                    <Table.Td>{param.newValue}</Table.Td>
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Button onClick={acceptLoadedParams} color="green">
          Load params
        </Button>
      </div>
    </Modal>
  )
}
