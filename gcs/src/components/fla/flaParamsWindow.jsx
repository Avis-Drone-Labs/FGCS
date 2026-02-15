"use client"

import { useEffect, useState } from "react"

import { Table, TextInput } from "@mantine/core"
import { useElementSize, useViewportSize } from "@mantine/hooks"

export default function FlaParamsWindow() {
  const [params, setParams] = useState(null)
  const [paramSearchValue, setParamSearchValue] = useState("")
  const { height } = useViewportSize()
  const { ref, height: searchBarHeight } = useElementSize()

  useEffect(() => {
    const handler = (_event, params) => {
      setParams(params)
    }
    window.ipcRenderer.on("app:send-fla-params", handler)

    return () => {
      window.ipcRenderer.removeAllListeners("app:send-fla-params")
    }
  }, [])

  if (!params) {
    return (
      <div className="w-full h-full bg-falcongrey-800 flex flex-row items-center justify-center p-4">
        <span className="text-falcongrey-400">No parameters available</span>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-falcongrey-800 flex flex-col items-center gap-4 p-4">
      <TextInput
        ref={ref}
        placeholder="Search parameters"
        value={paramSearchValue}
        onChange={(event) => setParamSearchValue(event.currentTarget.value)}
        className="w-full"
      />
      <Table.ScrollContainer
        maxHeight={height - searchBarHeight}
        className="w-full"
      >
        <Table striped highlightOnHover withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th className="w-56">Parameter</Table.Th>
              <Table.Th className="w-40">Value</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {params
              .filter((param) =>
                param.name
                  .toLowerCase()
                  .includes(paramSearchValue.toLowerCase()),
              )
              .map((param) => (
                <Table.Tr key={param.name}>
                  <Table.Td>{param.name}</Table.Td>
                  <Table.Td>{param.value}</Table.Td>
                </Table.Tr>
              ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </div>
  )
}
