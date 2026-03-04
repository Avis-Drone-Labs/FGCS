import { Select, Table } from "@mantine/core"
import { useVirtualizer } from "@tanstack/react-virtual"
import moment from "moment"
import { useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { showErrorNotification } from "../../helpers/notification"
import {
  selectMessageFilters,
  selectUtcAvailable,
} from "../../redux/slices/logAnalyserSlice"

const TABLE_CELL_MIN_WIDTH = 80
const TABLE_CELL_DEFAULT_WIDTH = 150

// Helper function to format UtcTimeUS to human-readable string
function formatUtcTime(seconds) {
  if (typeof seconds !== "number" || !isFinite(seconds)) {
    return seconds
  }
  return moment(seconds).format("YYYY-MM-DD HH:mm:ss.SSS")
}

export default function DataTable() {
  const messageFilters = useSelector(selectMessageFilters)
  const utcAvailable = useSelector(selectUtcAvailable)

  const [selectedMessage, setSelectedMessage] = useState("MSG")
  const [messageTableData, setMessageTableData] = useState(null)
  const [columnWidths, setColumnWidths] = useState({})
  const [resizingColumn, setResizingColumn] = useState(null)
  const parentRef = useRef(null)
  const persistedWidthsRef = useRef({})
  const cleanupResizeRef = useRef(null)

  // Cleanup resize listeners on unmount
  useEffect(() => {
    return () => {
      if (cleanupResizeRef.current) {
        cleanupResizeRef.current()
        cleanupResizeRef.current = null
      }
    }
  }, [])

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

      const result = await window.ipcRenderer.invoke(
        "fla:get-message-data-for-table",
        selectedMessage,
      )

      if (Array.isArray(result)) {
        setMessageTableData(result)
      } else if (!result?.success) {
        showErrorNotification(result?.message)
      }
    }

    fetchTableData()
  }, [selectedMessage])

  // Extract columns from the first row of data and ensure minimum 16 columns
  // Order: "name" first, "TimeUS" second, "UtcTimeUS" third (if utcAvailable), then rest
  const columns = useMemo(() => {
    if (!messageTableData || messageTableData.length === 0) return []
    const dataColumns = Object.keys(messageTableData[0])

    const orderedColumns = []

    if (dataColumns.includes("name")) {
      orderedColumns.push("name")
    }

    if (dataColumns.includes("TimeUS")) {
      orderedColumns.push("TimeUS")
    }

    if (utcAvailable && dataColumns.includes("UtcTimeUS")) {
      orderedColumns.push("UtcTimeUS")
    }

    const remainingColumns = dataColumns.filter(
      (col) => !orderedColumns.includes(col),
    )
    orderedColumns.push(...remainingColumns)

    // If we have fewer than 16 columns, pad with empty column names
    if (orderedColumns.length < 16) {
      const emptyColumns = Array.from(
        { length: 16 - orderedColumns.length },
        (_, i) => `_empty_${i}`,
      )
      return [...orderedColumns, ...emptyColumns]
    }

    return orderedColumns
  }, [messageTableData, utcAvailable])

  // Initialize default column widths when data changes
  useEffect(() => {
    if (
      !messageTableData ||
      messageTableData.length === 0 ||
      columns.length === 0
    ) {
      return
    }

    const widths = {}

    // Set width for all columns, using persisted widths by column index
    columns.forEach((column, index) => {
      const persistedWidth = persistedWidthsRef.current[index]
      widths[column] = persistedWidth || TABLE_CELL_DEFAULT_WIDTH
    })

    setColumnWidths(widths)
  }, [messageTableData, columns])

  // Handle column resize
  const handleMouseDown = (column, columnIndex, e) => {
    e.preventDefault()
    setResizingColumn(column)

    const startX = e.clientX
    const startWidth = columnWidths[column]

    const handleMouseMove = (e) => {
      const diff = e.clientX - startX
      const newWidth = Math.max(TABLE_CELL_MIN_WIDTH, startWidth + diff)
      setColumnWidths((prev) => ({ ...prev, [column]: newWidth }))
      // Persist the width change by column index
      persistedWidthsRef.current[columnIndex] = newWidth
    }

    const handleMouseUp = () => {
      setResizingColumn(null)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      cleanupResizeRef.current = null
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    // Store cleanup function in ref so it can be called on unmount
    cleanupResizeRef.current = () => {
      setResizingColumn(null)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }

  // Initialize virtualizer
  const rowVirtualizer = useVirtualizer({
    count: messageTableData?.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // Initial estimate
    overscan: 5,
    measureElement: (element) => element?.getBoundingClientRect().height ?? 40,
  })

  return (
    <div className="flex flex-col h-full min-h-0 py-4">
      {messageTableData && messageTableData.length > 0 && (
        <div
          className="flex-1 min-h-0 overflow-auto border-gray-600 border"
          ref={parentRef}
        >
          <Table
            striped
            highlightOnHover
            withColumnBorders
            stickyHeader
            className="text-sm w-max table-fixed"
          >
            <Table.Thead>
              <Table.Tr>
                {columns.map((column, index) => (
                  <Table.Th
                    key={column}
                    className="whitespace-nowrap"
                    style={{
                      width: `${columnWidths[column] ?? TABLE_CELL_DEFAULT_WIDTH}px`,
                      minWidth: `${columnWidths[column] ?? TABLE_CELL_DEFAULT_WIDTH}px`,
                      maxWidth: `${columnWidths[column] ?? TABLE_CELL_DEFAULT_WIDTH}px`,
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {index === 0 ? (
                        <Select
                          placeholder="Select message"
                          data={messageTypes}
                          value={selectedMessage}
                          onChange={setSelectedMessage}
                          maxDropdownHeight={400}
                          size="xs"
                          allowDeselect={false}
                        />
                      ) : (
                        <span>
                          {column.startsWith("_empty_") ? "" : column}
                        </span>
                      )}
                      {!column.startsWith("_empty_") && index !== 0 && (
                        <div
                          onMouseDown={(e) => handleMouseDown(column, index, e)}
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize select-none z-10"
                          style={{
                            backgroundColor:
                              resizingColumn === column
                                ? "rgba(241, 167, 160, 0.6)"
                                : "transparent",
                          }}
                        />
                      )}
                    </div>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = messageTableData[virtualRow.index]
                return (
                  <Table.Tr
                    key={virtualRow.index}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {columns.map((column) => {
                      let cellValue = row[column]

                      // Format UtcTimeUS as human-readable date/time
                      if (
                        column === "UtcTimeUS" &&
                        cellValue !== undefined &&
                        cellValue !== null
                      ) {
                        cellValue = formatUtcTime(cellValue)
                      }

                      return (
                        <Table.Td
                          key={column}
                          className="truncate"
                          style={{
                            position: "relative",
                            width: `${columnWidths[column] ?? TABLE_CELL_DEFAULT_WIDTH}px`,
                            minWidth: `${columnWidths[column] ?? TABLE_CELL_DEFAULT_WIDTH}px`,
                            maxWidth: `${columnWidths[column] ?? TABLE_CELL_DEFAULT_WIDTH}px`,
                          }}
                        >
                          {column.startsWith("_empty_")
                            ? ""
                            : cellValue !== undefined &&
                              cellValue !== null &&
                              cellValue}
                        </Table.Td>
                      )
                    })}
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
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
