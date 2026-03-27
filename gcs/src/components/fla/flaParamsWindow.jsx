"use client"

import { useEffect, useState } from "react"

import { Button, Table, TextInput, Tooltip } from "@mantine/core"
import { useElementSize, useViewportSize } from "@mantine/hooks"
import { IconInfoCircle } from "@tabler/icons-react"
import manifest from "../../../data/gen_apm_params_versions.json"
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../helpers/notification"

const paramDefinitionModules = import.meta.glob(
  "../../../data/gen_apm_params_def_*_*.json",
)

const modulePathByFileName = Object.fromEntries(
  Object.keys(paramDefinitionModules).map((path) => [
    path.split("/").pop(),
    path,
  ]),
)

function parseMajorMinor(versionString) {
  const match = String(versionString || "").match(/(\d+)\.(\d+)/)
  if (!match) {
    return null
  }

  return `${match[1]}.${match[2]}`
}

function getResolvedVersion(aircraftKey, firmwareVersion) {
  if (!aircraftKey) {
    return null
  }

  const versions = manifest?.vehicles?.[aircraftKey]?.versions
  if (!Array.isArray(versions) || versions.length === 0) {
    return null
  }

  const requestedVersion = parseMajorMinor(firmwareVersion)
  if (requestedVersion && versions.includes(requestedVersion)) {
    return requestedVersion
  }

  return (
    manifest?.vehicles?.[aircraftKey]?.latest || versions[versions.length - 1]
  )
}

function getModulePath(aircraftKey, resolvedVersion) {
  if (!aircraftKey || !resolvedVersion) {
    return null
  }

  const fileName = manifest?.vehicles?.[aircraftKey]?.files?.[resolvedVersion]
  if (!fileName) {
    return null
  }

  return modulePathByFileName[fileName] || null
}

function getBitmaskInfo(rawValue, paramDef) {
  const bitmaskDef = paramDef?.Bitmask
  if (!bitmaskDef || typeof bitmaskDef !== "object") {
    return {
      isBitmask: false,
      displayValue: String(rawValue),
      selected: [],
    }
  }

  const numericValue = Number(rawValue)
  if (!Number.isFinite(numericValue)) {
    return {
      isBitmask: false,
      displayValue: String(rawValue),
      selected: [],
    }
  }

  const bitmaskValue = Math.trunc(numericValue) >>> 0
  const selected = Object.entries(bitmaskDef)
    .map(([bitKey, label]) => ({
      bit: Number.parseInt(bitKey, 10),
      label,
    }))
    .filter((item) => Number.isInteger(item.bit) && item.bit >= 0)
    .sort((a, b) => a.bit - b.bit)
    .filter((item) => item.bit < 32)
    .filter((item) => (bitmaskValue & (1 << item.bit)) !== 0)

  return {
    isBitmask: true,
    displayValue: String(bitmaskValue),
    selected,
  }
}

function renderParamValue(value, paramDef) {
  const bitmaskInfo = getBitmaskInfo(value, paramDef)

  if (!bitmaskInfo.isBitmask) {
    return bitmaskInfo.displayValue
  }

  return (
    <div className="flex items-center gap-1.5">
      <span>{bitmaskInfo.displayValue}</span>
      {bitmaskInfo.displayValue !== "0" && (
        <Tooltip
          multiline
          w={300}
          label={
            bitmaskInfo.selected.length > 0 && (
              <div className="text-sm">
                {bitmaskInfo.selected.map((item) => (
                  <div key={item.bit}>{`${item.bit}: ${item.label}`}</div>
                ))}
              </div>
            )
          }
        >
          <span className="inline-flex">
            <IconInfoCircle size={16} color="white" />
          </span>
        </Tooltip>
      )}
    </div>
  )
}

export default function FlaParamsWindow() {
  const [params, setParams] = useState(null)
  const [fileName, setFileName] = useState("")
  const [aircraftKey, setAircraftKey] = useState(null)
  const [firmwareVersion, setFirmwareVersion] = useState(null)
  const [paramDefs, setParamDefs] = useState({})
  const [paramSearchValue, setParamSearchValue] = useState("")
  const { height } = useViewportSize()
  const { ref, height: searchBarHeight } = useElementSize()

  useEffect(() => {
    const resolvedVersion = getResolvedVersion(aircraftKey, firmwareVersion)
    const modulePath = getModulePath(aircraftKey, resolvedVersion)

    if (!modulePath) {
      setParamDefs({})
      return
    }

    let cancelled = false

    paramDefinitionModules[modulePath]().then((loadedModule) => {
      if (!cancelled) {
        setParamDefs(loadedModule.default || {})
      }
    })

    return () => {
      cancelled = true
    }
  }, [aircraftKey, firmwareVersion])

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
      setAircraftKey(
        data.aircraftType === "plane" || data.aircraftType === "copter"
          ? data.aircraftType
          : null,
      )
      setFirmwareVersion(data.firmwareVersion ?? null)
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
                  <Table.Td>
                    {renderParamValue(param.value, paramDefs[param.name])}
                  </Table.Td>
                </Table.Tr>
              ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </div>
  )
}
