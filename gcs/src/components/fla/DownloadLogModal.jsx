import {
  Button,
  Group,
  LoadingOverlay,
  Modal,
  Progress,
  ScrollArea,
  Text,
} from "@mantine/core"
import { useEffect, useMemo, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { showErrorNotification } from "../../helpers/notification"
import {
  emitListLogFiles,
  emitReadFile,
  resetFiles,
  selectFiles,
  selectIsReadingFile,
  selectLoadingListFiles,
  selectLogPath,
  selectReadFileProgress,
} from "../../redux/slices/ftpSlice"
import { readableBytes } from "./utils"

export default function DownloadLogModal({ opened, onClose }) {
  const dispatch = useDispatch()
  const files = useSelector(selectFiles)
  const loadingListFiles = useSelector(selectLoadingListFiles)
  const isReadingFile = useSelector(selectIsReadingFile)
  const readFileProgress = useSelector(selectReadFileProgress)
  const logPath = useSelector(selectLogPath)

  const [selectedLog, setSelectedLog] = useState(null)
  const [hasFetched, setHasFetched] = useState(false)

  const logFiles = useMemo(() => {
    return files
  }, [files])

  useEffect(() => {
    // Fetch log files when modal opens (only once per opening)
    if (opened && !hasFetched) {
      dispatch(emitListLogFiles())
      setHasFetched(true)
    }
  }, [opened, hasFetched, dispatch])

  useEffect(() => {
    // Reset files and fetch state when modal closes
    if (!opened) {
      dispatch(resetFiles())
      setSelectedLog(null)
      setHasFetched(false)
    }
  }, [opened, dispatch])

  async function handleLogClick(log) {
    // First, ask user where to save the file
    try {
      const options = {
        title: "Save log file",
        defaultPath: log.name,
        filters: [
          { name: "Log Files", extensions: ["bin", "log"] },
          { name: "All Files", extensions: ["*"] },
        ],
      }

      const result = await window.ipcRenderer.invoke(
        "app:get-save-file-path",
        options,
      )

      if (!result.canceled && result.filePath) {
        // Now download the file with the save path
        setSelectedLog(log)
        dispatch(emitReadFile({ path: log.path, savePath: result.filePath }))
      }
    } catch (error) {
      showErrorNotification(`Error selecting save location: ${error.message}`)
    }
  }

  function handleRefresh() {
    dispatch(resetFiles())
    setHasFetched(false)
    dispatch(emitListLogFiles())
    setHasFetched(true)
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Download Log from Drone"
      size="lg"
      centered
      closeOnEscape={!isReadingFile}
      closeOnClickOutside={!isReadingFile}
      withCloseButton={!isReadingFile}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <Text size="sm" c="dimmed">
              {logFiles.length > 0
                ? `Found ${logFiles.length} log file${logFiles.length !== 1 ? "s" : ""}`
                : loadingListFiles
                  ? "Searching for logs..."
                  : "No log files found"}
            </Text>
            {logPath && logFiles.length > 0 && (
              <Text size="xs" c="dimmed">
                Location: {logPath}
              </Text>
            )}
          </div>
          <Button
            size="xs"
            onClick={handleRefresh}
            disabled={loadingListFiles || isReadingFile}
            loading={loadingListFiles}
          >
            Refresh
          </Button>
        </div>

        {isReadingFile && readFileProgress && (
          <div className="flex flex-col gap-2 p-3 bg-falcongrey-900/20 rounded">
            <div className="flex justify-between items-center">
              <Text size="sm">Downloading: {selectedLog?.name}</Text>
            </div>
            <Text size="xs" c="dimmed">
              {readFileProgress.bytes_downloaded.toLocaleString()} /{" "}
              {readFileProgress.total_bytes.toLocaleString()} bytes
            </Text>
            <Progress
              value={readFileProgress.percentage}
              size="lg"
              animated
              color="blue"
            />
            <Text size="xs" c="dimmed" ta="center">
              {readFileProgress.percentage}% complete
            </Text>
          </div>
        )}

        <div className="relative">
          <LoadingOverlay
            visible={loadingListFiles}
            zIndex={1000}
            overlayProps={{ blur: 2 }}
          />

          <ScrollArea.Autosize mah={400} offsetScrollbars>
            {logFiles.length > 0 ? (
              <div className="flex flex-col gap-1">
                {logFiles.map((log, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-1 rounded cursor-pointer transition-colors ${
                      selectedLog?.path === log.path
                        ? "bg-falcongrey-700/30"
                        : "hover:bg-falcongrey-600"
                    } ${isReadingFile ? "opacity-50 pointer-events-none" : ""}`}
                    onClick={() => handleLogClick(log)}
                  >
                    <div className="flex-1">
                      <Text size="sm">{log.name}</Text>
                      <Group gap={8}>
                        <Text size="xs" c="dimmed">
                          {readableBytes(log.size_b)}
                        </Text>
                      </Group>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !loadingListFiles && (
                <div className="text-center py-8 text-gray-400">
                  <Text size="sm">No log files found</Text>
                </div>
              )
            )}
          </ScrollArea.Autosize>
        </div>
      </div>
    </Modal>
  )
}
