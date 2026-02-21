/*
  This is the FTP component for the config page.

  It handles all FTP related operations.
*/
// Base imports

// 3rd party imports

// Redux
import {
  Button,
  Group,
  LoadingOverlay,
  Progress,
  Text,
  Tree,
} from "@mantine/core"
import { IconFile, IconFolder, IconFolderOpen } from "@tabler/icons-react"
import { useEffect, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../helpers/notification"
import {
  emitSetState,
  selectConnectedToDrone,
} from "../../redux/slices/droneConnectionSlice"
import {
  emitListFiles,
  emitReadFile,
  resetFiles,
  selectFiles,
  selectIsReadingFile,
  selectLoadingListFiles,
  selectReadFileData,
  selectReadFileProgress,
} from "../../redux/slices/ftpSlice"

export default function Ftp() {
  const dispatch = useDispatch()
  const connected = useSelector(selectConnectedToDrone)
  const files = useSelector(selectFiles)
  const loadingListFiles = useSelector(selectLoadingListFiles)
  const isReadingFile = useSelector(selectIsReadingFile)
  const readFileData = useSelector(selectReadFileData)
  const readFileProgress = useSelector(selectReadFileProgress)

  const convertedFiles = useMemo(() => {
    if (!files || files.length === 0) return []
    return files.map((file) => {
      // Need to convert all children recursively

      const convertChildren = (children) => {
        if (!children) return undefined
        return children.map((child) => {
          return {
            value: child.path,
            label: child.name,
            children: convertChildren(child.children),
            path: child.path,
            is_dir: child.is_dir,
          }
        })
      }

      return {
        value: file.path,
        label: file.name,
        children: convertChildren(file.children),
        path: file.path,
        is_dir: file.is_dir,
      }
    })
  }, [files])

  const fileContentString = useMemo(() => {
    if (readFileData) {
      try {
        const decoder = new TextDecoder("utf-8")
        return {
          success: true,
          content: decoder.decode(new Uint8Array(readFileData.file_data)),
        }
      } catch (e) {
        return {
          success: false,
          content: `Error decoding file content: ${e.message}`,
        }
      }
    }
    return null
  }, [readFileData])

  useEffect(() => {
    if (!connected) {
      return
    }

    dispatch(emitSetState("config.ftp"))
  }, [connected, dispatch])

  useEffect(() => {
    if (files.length === 0) {
      dispatch(emitListFiles({ path: "/" }))
    }
  }, [files.length, dispatch])

  function handleFileClick(node) {
    if (node.is_dir) {
      if (node.children === undefined) {
        dispatch(emitListFiles({ path: node.path }))
      }
    } else {
      dispatch(emitReadFile({ path: node.path }))
    }
  }

  async function downloadReadFile() {
    if (fileContentString && fileContentString.success) {
      const options = {
        title: "Save file",
        defaultPath: readFileData.file_name,
        filters: [{ name: "All Files", extensions: ["*"] }],
      }

      const result = await window.ipcRenderer.invoke(
        "app:get-save-file-path",
        options,
      )

      if (!result.canceled && result.filePath) {
        const saveResult = await window.ipcRenderer.invoke("app:save-file", {
          filePath: result.filePath,
          content: readFileData.file_data,
        })

        if (saveResult.success) {
          showSuccessNotification(
            `File saved successfully to: ${result.filePath}`,
          )
        } else {
          showErrorNotification("Error saving file:", saveResult.error)
        }
      }
    }
  }

  return (
    <div className="flex flex-row gap-4 p-4 w-full">
      <div className="flex flex-col gap-4 relative flex-1">
        <LoadingOverlay
          visible={loadingListFiles}
          zIndex={1000}
          overlayProps={{ blur: 2 }}
        />
        {loadingListFiles && <p>Loading files...</p>}
        <Button
          onClick={() => {
            dispatch(resetFiles())
            dispatch(emitListFiles({ path: "/" }))
          }}
          w={"fit-content"}
        >
          Refresh files
        </Button>
        <Tree
          data={convertedFiles}
          renderNode={({ node, expanded, elementProps }) => (
            <Group gap={5} {...elementProps} key={node.path}>
              {node.is_dir ? (
                <>
                  {expanded ? (
                    <IconFolderOpen size={20} />
                  ) : (
                    <IconFolder size={20} />
                  )}
                </>
              ) : (
                <IconFile size={20} />
              )}
              <span
                onClick={() => {
                  handleFileClick(node)
                }}
              >
                {node.label}
              </span>
            </Group>
          )}
        />
      </div>
      <div className="flex flex-col gap-4 flex-1">
        {isReadingFile && readFileProgress && (
          <div className="flex flex-col gap-2">
            <Text size="sm">
              Downloading: {readFileProgress.bytes_downloaded.toLocaleString()}{" "}
              / {readFileProgress.total_bytes.toLocaleString()} bytes
            </Text>
            <Progress
              value={readFileProgress.percentage}
              size="lg"
              animated
              color="blue"
            />
            <Text size="xs" c="dimmed">
              {readFileProgress.percentage}% complete
            </Text>
          </div>
        )}

        {fileContentString !== null && (
          <div className="flex flex-col relative gap-2">
            <LoadingOverlay
              visible={isReadingFile}
              zIndex={1000}
              overlayProps={{ blur: 2 }}
            />
            <Button
              disabled={!fileContentString || !fileContentString.success}
              onClick={async () => {
                await downloadReadFile()
              }}
              w={"fit-content"}
            >
              Download
            </Button>

            <div className="p-4 border border-falcongrey-600 rounded bg-falcongrey-800">
              {fileContentString.success ? (
                <pre className="whitespace-pre-wrap break-all">
                  {fileContentString.content}
                </pre>
              ) : (
                <p className="text-red-500">{fileContentString.content}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
