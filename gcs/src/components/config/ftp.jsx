/*
  This is the FTP component for the config page.

  It handles all FTP related operations.
*/
// Base imports

// 3rd party imports

// Redux
import { Button, Group, LoadingOverlay, Tree } from "@mantine/core"
import { IconFile, IconFolder, IconFolderOpen } from "@tabler/icons-react"
import { useEffect, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  emitListFiles,
  emitReadFile,
  resetFiles,
  selectFiles,
  selectIsReadingFile,
  selectLoadingListFiles,
  selectReadFileBytes,
} from "../../redux/slices/ftpSlice"

export default function Ftp() {
  const dispatch = useDispatch()
  const files = useSelector(selectFiles)
  const loadingListFiles = useSelector(selectLoadingListFiles)
  const isReadingFile = useSelector(selectIsReadingFile)
  const readFileBytes = useSelector(selectReadFileBytes)

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
    if (readFileBytes) {
      try {
        const decoder = new TextDecoder("utf-8")
        return {
          success: true,
          content: decoder.decode(new Uint8Array(readFileBytes)),
        }
      } catch (e) {
        return {
          success: false,
          content: `Error decoding file content: ${e.message}`,
        }
      }
    }
    return null
  }, [readFileBytes])

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

  function downloadReadFile() {
    if (fileContentString && fileContentString.success) {
      console.log("Downloading file...")
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
        {fileContentString !== null && (
          <div className="flex flex-col relative gap-2">
            <LoadingOverlay
              visible={isReadingFile}
              zIndex={1000}
              overlayProps={{ blur: 2 }}
            />
            <Button
              disabled={!fileContentString || !fileContentString.success}
              onClick={downloadReadFile}
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
