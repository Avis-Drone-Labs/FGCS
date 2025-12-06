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
      // Filter out any files are "." or ".." or already exist in top level files
      const filteredNewFiles = action.payload.filter((newFile) => {
        return (
          newFile.name != "." &&
          newFile.name != ".." &&
          !state.files.some(
            (existingFile) => existingFile.path === newFile.path,
          )
        )
      })

      for (const file of filteredNewFiles) {
        // Find parent directory
        const parentPath = file.path.split("/").slice(0, -1).join("/")
        if (parentPath === "") {
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
