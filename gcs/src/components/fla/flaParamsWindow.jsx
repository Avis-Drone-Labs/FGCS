"use client"

import { useEffect, useState } from "react"

import { Button, Table, TextInput } from "@mantine/core"
import { useElementSize, useViewportSize } from "@mantine/hooks"
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../helpers/notification"

export default function FlaParamsWindow() {
  const [params, setParams] = useState(null)
  const [fileName, setFileName] = useState("")
  const [paramSearchValue, setParamSearchValue] = useState("")
  const { height } = useViewportSize()
  const { ref, height: searchBarHeight } = useElementSize()

  async function saveParamsToFile() {
    try {
      const options = {
        title: "Save parameters to a file",
        defaultPath: fileName ? `${fileName}_params.param` : "params.param",
        filters: [
          { name: "Param File", extensions: ["param"] },
          { name: "All Files", extensions: ["*"] },
        ],
      }

      const result = await window.ipcRenderer.invoke(
        "app:get-save-file-path",
        options,
      )

      if (!result.canceled && result.filePath) {
        // Save params to file
        const saveResult = await window.ipcRenderer.invoke(
          "fla:save-params-to-file",
          result.filePath,
          params,
        )

        if (saveResult.success) {
          showSuccessNotification(saveResult.message)
        } else {
          showErrorNotification(saveResult.message)
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      showErrorNotification(`Failed to save parameters: ${message}`)
    }
  }

  useEffect(() => {
    const handler = (_event, data) => {
      setParams(data.params)
      setFileName(data.fileName)
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
      <div className="w-full flex flex-row gap-2">
        <TextInput
          ref={ref}
          placeholder="Search parameters"
          value={paramSearchValue}
          onChange={(event) => setParamSearchValue(event.currentTarget.value)}
          className="flex-1"
        />
        <Button onClick={saveParamsToFile}>Save to File</Button>
      </div>
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
                  .startsWith(paramSearchValue.toLowerCase()),
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
