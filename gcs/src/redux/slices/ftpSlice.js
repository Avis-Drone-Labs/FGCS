import { createSlice } from "@reduxjs/toolkit"

const ftpSlice = createSlice({
  name: "ftp",
  initialState: {
    files: [],
    loadingListFiles: false,
    isReadingFile: false,
    readFileData: null,
    readFileProgress: null, // { bytes_downloaded, total_bytes, percentage }
    logPath: null, // The discovered log directory path
  },
  reducers: {
    resetFiles: (state) => {
      state.files = []
      state.logPath = null
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

        // If this is a top-level file or if there are no existing files in state,
        // treat it as a top-level file
        if (parentPath === "/" || state.files.length === 0) {
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
          // If parent directory doesn't exist, treat as top-level file
          // This happens when we list a specific directory like /logs
          state.files.push(file)
        }
      }
    },
    setLoadingListFiles: (state, action) => {
      state.loadingListFiles = action.payload
    },
    setIsReadingFile: (state, action) => {
      state.isReadingFile = action.payload
    },
    setReadFileData: (state, action) => {
      state.readFileData = action.payload
    },
    setReadFileProgress: (state, action) => {
      state.readFileProgress = action.payload
    },
    setLogPath: (state, action) => {
      state.logPath = action.payload
    },

    emitListFiles: () => {},
    emitListLogFiles: () => {},
    emitReadFile: () => {},
  },
  selectors: {
    selectFiles: (state) => state.files,
    selectLoadingListFiles: (state) => state.loadingListFiles,
    selectIsReadingFile: (state) => state.isReadingFile,
    selectReadFileData: (state) => state.readFileData,
    selectReadFileProgress: (state) => state.readFileProgress,
    selectLogPath: (state) => state.logPath,
  },
})

export const {
  resetFiles,
  addFiles,
  setLoadingListFiles,
  setIsReadingFile,
  setReadFileData,
  setReadFileProgress,
  setLogPath,
  cancelReadFile,

  emitListFiles,
  emitListLogFiles,
  emitReadFile,
} = ftpSlice.actions

export const {
  selectFiles,
  selectLoadingListFiles,
  selectIsReadingFile,
  selectReadFileData,
  selectReadFileProgress,
  selectLogPath,
} = ftpSlice.selectors

export default ftpSlice
