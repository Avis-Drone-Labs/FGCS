import {
  Button,
  Divider,
  FileButton,
  LoadingOverlay,
  Progress,
  ScrollArea,
} from "@mantine/core"
import moment from "moment"
import { useEffect, useState, useMemo, useCallback } from "react"
import { useDispatch } from "react-redux"
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../helpers/notification.js"
import { setFile } from "../../redux/slices/logAnalyserSlice.js"
import { readableBytes } from "./utils"
import { useRenderCount } from "./debug/renderCount.js"

/**
 * Initial FLA screen for selecting or uploading a flight log file.
 */
export default function SelectFlightLog({ processLoadedFile }) {
  useRenderCount("SelectFlightLog")
  const dispatch = useDispatch()
  const [recentFgcsLogs, setRecentFgcsLogs] = useState(null)
  const [loadingFile, setLoadingFile] = useState(false)
  const [loadingFileProgress, setLoadingFileProgress] = useState(0)

  async function getFgcsLogs() {
    setRecentFgcsLogs(await window.ipcRenderer.getRecentLogs())
  }

  async function clearFgcsLogs() {
    await window.ipcRenderer.clearRecentLogs()
    getFgcsLogs()
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

        const result = await window.ipcRenderer.loadFile(file.path)

        if (!result.success) {
          showErrorNotification(
            `Error loading file: ${result.error || "File not found. Please reload."}`,
          )
          return
        }

        await processLoadedFile(result)
        showSuccessNotification(`${file.name} loaded successfully`)
        console.timeEnd(`Loading file: ${file.name}`)
      } catch (error) {
        console.error("Error loading file:", error)
        showErrorNotification("Error loading file: " + error.message)
      } finally {
        setLoadingFile(false)
        setLoadingFileProgress(0)
      }
    }, [dispatch, processLoadedFile],
  )

  useEffect(() => {
    const onProgress = (evt, message) => setLoadingFileProgress(message.percent)
    window.ipcRenderer.on("fla:log-parse-progress", onProgress)
    getFgcsLogs()
    return () => {
      window.ipcRenderer.removeAllListeners(["fla:log-parse-progress"])
    }
  }, [])

  const recentLogItems = useMemo(() => {
    if (!recentFgcsLogs) return null
    return recentFgcsLogs.map((log, idx) => (
      <div
        key={idx}
        className="flex flex-col px-4 py-2 hover:cursor-pointer hover:bg-falcongrey-700 hover:rounded-sm w-80"
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

  return (
    <div className="flex flex-col items-center justify-center h-full mx-auto">
      <div className="flex flex-row items-center justify-center gap-8">
        <div className="flex flex-col gap-4">
          {/* File selection */}
          <FileButton onChange={handleFile} accept=".log,.ftlog">
            {(props) => (
              <Button {...props} loading={loadingFile}>
                Analyse a log
              </Button>
            )}
          </FileButton>
          <Button color="red" variant="filled" onClick={clearFgcsLogs}>
            Clear Logs
          </Button>
        </div>
        <Divider size="sm" orientation="vertical" />
        <div className="relative">
          <LoadingOverlay visible={recentFgcsLogs === null || loadingFile} />
          <div className="flex flex-col items-center gap-2">
            <p className="font-bold">Recent FGCS telemetry logs</p>
            <ScrollArea h={250} offsetScrollbars>
              {recentLogItems}
            </ScrollArea>
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
