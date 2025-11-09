import { Modal, Table } from "@mantine/core"
import { useDispatch, useSelector } from "react-redux"
import {
  selectParamsFailedToWrite,
  selectParamsFailedToWriteModalOpen,
  setParamsFailedToWriteModalOpen,
} from "../../redux/slices/paramsSlice"

export default function ParamsFailedToWriteModal() {
  const dispatch = useDispatch()
  const opened = useSelector(selectParamsFailedToWriteModalOpen)
  const paramsFailedToWriteList = useSelector(selectParamsFailedToWrite)

  return (
    <Modal
      opened={opened}
      onClose={() => dispatch(setParamsFailedToWriteModalOpen(false))}
      title={`Failed to write ${paramsFailedToWriteList.length} parameter(s)`}
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <div className="flex flex-col items-center justify-center gap-4 w-full">
        <Table.ScrollContainer maxHeight={600} className="w-full">
          <Table striped highlightOnHover withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th className="w-56">Parameter</Table.Th>
                <Table.Th className="w-40">Value</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paramsFailedToWriteList
                .sort((a, b) => a.param_id.localeCompare(b.param_id))
                .map((param) => (
                  <Table.Tr key={param.param_id}>
                    <Table.Td>{param.param_id}</Table.Td>
                    <Table.Td>{param.param_value}</Table.Td>
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </div>
    </Modal>
  )
}
