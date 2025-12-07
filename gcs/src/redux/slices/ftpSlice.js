import { createSlice } from "@reduxjs/toolkit"

const ftpSlice = createSlice({
  name: "ftp",
  initialState: {
    currentPath: "/",
    files: [],
  },
  reducers: {
    setCurrentPath: (state, action) => {
      state.currentPath = action.payload
    },
    addFiles: (state, action) => {
      // Filter out any files that are "." or ".." or already exist in top level files
      const filteredNewFiles = action.payload.filter((newFile) => {
        return (
          newFile.name !== "." &&
          newFile.name !== ".." &&
          !state.files.some(
            (existingFile) => existingFile.path === newFile.path,
          )
        )
      })

      for (const file of filteredNewFiles) {
        // Find parent directory
        let parentPath = file.path.split("/").slice(0, -1).join("/")
        if (parentPath === "") {
          parentPath = "/"
        }

        if (parentPath === "/") {
          // Add top level files since they don't exist already
          state.files.push(file)
          continue
        }
        // Try find parentDir recursively
        const parentDir = (function findParentDir(directories, targetPath) {
          for (const dir of directories) {
            if (dir.path === targetPath) {
              return dir
            }
            if (dir.children) {
              const found = findParentDir(dir.children, targetPath)
              if (found) {
                return found
              }
            }
          }
          return null
        })(state.files, parentPath)

        if (parentDir) {
          if (!parentDir.children) {
            parentDir.children = []
          }
          parentDir.children.push(file)
        } else {
          console.warn(
            `File "${file.name}" with path "${file.path}" could not be added because its parent directory "${parentPath}" is missing in state`,
          )
        }
      }
    },

    emitListFiles: () => {},
  },
  selectors: {
    selectCurrentPath: (state) => state.currentPath,
    selectFiles: (state) => state.files,
  },
})

export const { setCurrentPath, addFiles, emitListFiles } = ftpSlice.actions

export const { selectCurrentPath, selectFiles } = ftpSlice.selectors

export default ftpSlice
