import { Select } from "@mantine/core"
import { useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { FixedSizeList } from "react-window"
import {
  selectFormatMessages,
  selectMessageFilters,
} from "../../redux/slices/logAnalyserSlice"

// Virtualized row component
const VirtualRow = ({ index, style, data }) => {
  const { rows, columns } = data
  const row = rows[index]

  if (!row) return null

  return (
    <div
      style={style}
      className={`flex border-b border-neutral-700 ${
        index % 2 === 0 ? "bg-falcongrey-800" : "bg-falcongrey-850"
      } hover:bg-falcongrey-700`}
    >
      {columns.map((column, colIndex) => (
        <div
          key={column}
          className={`px-4 py-3 text-sm border-r border-neutral-700 ${
            colIndex === 0 ? "w-48 flex-shrink-0" : "flex-1 min-w-32"
          } ${colIndex === columns.length - 1 ? "border-r-0" : ""}`}
        >
          {row[column] !== undefined && row[column] !== null
            ? typeof row[column] === "number"
              ? row[column].toFixed(6)
              : row[column]
            : "-"}
        </div>
      ))}
    </div>
  )
}

export default function DataTable() {
  const messageFilters = useSelector(selectMessageFilters)
  const formatMessages = useSelector(selectFormatMessages)

  console.log(formatMessages)

  const [selectedMessage, setSelectedMessage] = useState(null)
  const [messageTableData, setMessageTableData] = useState(null)
  const listContainerRef = useRef(null)
  const [listHeight, setListHeight] = useState(400)

  // Get available message types from messageFilters
  const messageTypes = useMemo(() => {
    if (!messageFilters) return []
    return Object.keys(messageFilters).sort()
  }, [messageFilters])

  useEffect(() => {
    async function fetchTableData() {
      if (!selectedMessage) {
        setMessageTableData(null)
        return
      }

      const messageTableData = await window.ipcRenderer.invoke(
        "fla:get-message-data-for-table",
        selectedMessage,
      )

      setMessageTableData(messageTableData)
    }

    fetchTableData()
  }, [selectedMessage])

  // Calculate available height for the list
  useEffect(() => {
    const updateHeight = () => {
      if (listContainerRef.current) {
        const containerHeight = listContainerRef.current.clientHeight
        setListHeight(containerHeight)
      }
    }

    updateHeight()
    window.addEventListener("resize", updateHeight)
    return () => window.removeEventListener("resize", updateHeight)
  }, [messageTableData])

  // Extract columns from the first row of data
  const columns = useMemo(() => {
    if (!messageTableData || messageTableData.length === 0) return []
    return Object.keys(messageTableData[0])
  }, [messageTableData])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Message selector - Fixed at top */}
      <div className="flex flex-col gap-2 py-4 flex-shrink-0 bg-falcongrey-800">
        <Select
          label="Select Message Type"
          placeholder="Choose a message to display"
          data={messageTypes}
          value={selectedMessage}
          onChange={setSelectedMessage}
          searchable
          clearable
          maxDropdownHeight={400}
          className="max-w-md"
        />
      </div>

      {/* Div-based Table with virtualization */}
      {messageTableData && messageTableData.length > 0 && (
        <div className="flex flex-col flex-1 min-h-0 border border-neutral-700">
          {/* Header */}
          <div className="flex bg-falcongrey-900 border-b-2 border-neutral-600 sticky top-0 z-10 flex-shrink-0">
            {columns.map((column, index) => (
              <div
                key={column}
                className={`px-4 py-3 text-sm font-semibold border-r border-neutral-700 ${
                  index === 0 ? "w-48 flex-shrink-0" : "flex-1 min-w-32"
                } ${index === columns.length - 1 ? "border-r-0" : ""}`}
              >
                {column}
              </div>
            ))}
          </div>

          {/* Virtualized Rows */}
          <div className="flex-1 overflow-auto" ref={listContainerRef}>
            <FixedSizeList
              height={listHeight}
              width="100%"
              itemSize={48}
              itemCount={messageTableData.length}
              itemData={{
                rows: messageTableData,
                columns: columns,
              }}
            >
              {VirtualRow}
            </FixedSizeList>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedMessage && (
        <div className="flex items-center justify-center flex-1">
          <p className="text-neutral-400">
            Select a message type to view its data
          </p>
        </div>
      )}

      {selectedMessage &&
        (!messageTableData || messageTableData.length === 0) && (
          <div className="flex items-center justify-center flex-1">
            <p className="text-neutral-400">
              No data available for this message
            </p>
          </div>
        )}
    </div>
  )
}
