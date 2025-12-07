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
  resetFiles,
  selectFiles,
  selectLoadingListFiles,
} from "../../redux/slices/ftpSlice"

export default function Ftp() {
  const dispatch = useDispatch()
  const files = useSelector(selectFiles)
  const loadingListFiles = useSelector(selectLoadingListFiles)

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
    }
  }

  return (
    <div className="flex flex-col gap-4 mx-4 relative w-fit">
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
          <Group gap={5} {...elementProps} key={node.name}>
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
  )
}
