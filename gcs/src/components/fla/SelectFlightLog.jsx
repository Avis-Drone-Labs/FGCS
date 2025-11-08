import {
  Button,
  Divider,
  LoadingOverlay,
  Progress,
  ScrollArea,
} from "@mantine/core"
import moment from "moment"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useDispatch } from "react-redux"
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../helpers/notification.js"
import { setFile } from "../../redux/slices/logAnalyserSlice.js"
import { readableBytes } from "./utils"

/**
 * Initial FLA screen for selecting or uploading a flight log file.
 */
export default function SelectFlightLog({ getLogSummary }) {
  const dispatch = useDispatch()
  const [recentFgcsLogs, setRecentFgcsLogs] = useState(null)
  const [loadingFile, setLoadingFile] = useState(false)
  const [loadingFileProgress, setLoadingFileProgress] = useState(0)

  async function getFgcsLogs() {
    setRecentFgcsLogs(await window.ipcRenderer.invoke("fla:get-recent-logs"))
  }

  async function clearFgcsLogs() {
    await window.ipcRenderer.invoke("fla:clear-recent-logs")
    getFgcsLogs()
  }

  const selectFile = async () => {
    const result = await window.ipcRenderer.invoke(
      "window:select-file-in-explorer",
      [{ name: "Flight Logs", extensions: ["bin", "log", "ftlog"] }],
    )
    if (result) {
      handleFile(result)
    }
  }

  const handleFile = useCallback(
    async function (file) {
      if (!file) return

      console.time(`Loading file: ${file.name}`)

      try {
        dispatch(setFile(file))
        setLoadingFile(true)
        setLoadingFileProgress(0)

        console.log(
          `Starting to load file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        )

        // the result contains a lightweight summary of the log
        const result = await window.ipcRenderer.invoke(
          "fla:open-file",
          file.path,
        )

        if (!result.success) {
          showErrorNotification(
            `Error loading file: ${result.error || "File not found. Please reload."}`,
          )
          return
        }

        await getLogSummary(result)
        showSuccessNotification(`${file.name} loaded successfully`)
        console.timeEnd(`Loading file: ${file.name}`)
      } catch (error) {
        console.error("Error loading file:", error)
        showErrorNotification("Error loading file: " + error.message)
      } finally {
        setLoadingFile(false)
        setLoadingFileProgress(0)
      }
    },
    [dispatch, getLogSummary],
  )

  useEffect(() => {
    const onProgress = (_event, message) =>
      setLoadingFileProgress(message.percent)
    window.ipcRenderer.on("fla:log-parse-progress", onProgress)
    getFgcsLogs()
    return () => {
      window.ipcRenderer.removeAllListeners("fla:log-parse-progress")
    }
  }, [])

  const recentLogItems = useMemo(() => {
    if (!recentFgcsLogs) return null
    return recentFgcsLogs.map((log, idx) => (
      <div
        key={idx}
        className="flex flex-col px-4 py-2 hover:cursor-pointer hover:bg-falcongrey-600 hover:rounded-sm"
        onClick={() => handleFile(log)}
      >
        <p>{log.name} </p>
        <div className="flex flex-row gap-2">
          <p className="text-sm text-gray-400">
            {moment(
              log.timestamp.toISOString(),
              "YYYY-MM-DD_HH-mm-ss",
            ).fromNow()}
          </p>
          <p className="text-sm text-gray-400">{readableBytes(log.size)}</p>
        </div>
      </div>
    ))
  }, [recentFgcsLogs, handleFile])

  const logsExist = useMemo(() => {
    return (
      recentLogItems === null ||
      (recentFgcsLogs !== null && recentLogItems.length === 0)
    )
  }, [recentLogItems, recentFgcsLogs])

  return (
    <div className="flex flex-col items-center justify-center h-full mx-auto">
      <div className="flex flex-row items-center justify-center gap-8">
        <div className="flex flex-col gap-4">
          <Button onClick={selectFile} loading={loadingFile}>
            Analyse a log
          </Button>
          <Button
            disabled={logsExist}
            color="red"
            variant="filled"
            onClick={clearFgcsLogs}
          >
            Clear Logs
          </Button>
        </div>
        <Divider size="xs" orientation="vertical" />
        <div className="relative">
          <LoadingOverlay visible={recentFgcsLogs === null || loadingFile} />
          <div className="flex flex-col items-center gap-2">
            <p className="font-bold">Recent FGCS telemetry logs</p>
            <ScrollArea.Autosize
              className="relative"
              type="always"
              scrollbars="y"
              mah={250}
              offsetScrollbars="present"
            >
              {logsExist ? (
                <p className="w-full my-4 text-center text-falcongrey-400 text-sm">
                  No recent logs
                </p>
              ) : (
                recentLogItems
              )}
            </ScrollArea.Autosize>
          </div>
        </div>
      </div>
      {loadingFile && (
        <Progress
          value={loadingFileProgress}
          className="w-full my-4"
          color="green"
        />
      )}
    </div>
  )
}
