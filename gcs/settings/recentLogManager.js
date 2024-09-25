import fs from 'fs'
import path from 'path'
import { app } from 'electron'

export default function createRecentLogsManager(maxRecentLogs = 10) {
  // JSON file to hold paths to recently opened logs
  const recentLogsPath = path.join(app.getPath('userData'), 'recentLogs.json')

  function loadRecentLogs() {
    try {
      if (fs.existsSync(recentLogsPath)) {
        const data = fs.readFileSync(recentLogsPath, 'utf8')
        return JSON.parse(data)
      }
      return []
    } catch (error) {
      console.error('Error loading recent files:', error)
      return []
    }
  }

  let recentLogs = loadRecentLogs()

  function saveRecentLogs() {
    try {
      fs.writeFileSync(recentLogsPath, JSON.stringify(recentLogs), 'utf8')
    } catch (error) {
      console.error('Error saving recent files:', error)
    }
  }

  return {
    addRecentLog(filePath) {
      // Remove the file if it already exists in the list
      recentLogs = recentLogs.filter((file) => file !== filePath)

      // Add the file to the beginning of the list
      recentLogs.unshift(filePath)

      // Trim the list if it exceeds the maximum allowed
      if (recentLogs.length > maxRecentLogs) {
        recentLogs = recentLogs.slice(0, maxRecentLogs)
      }
      saveRecentLogs()
    },

    getRecentLogs() {
      // Filter out files that no longer exist
      const existingFiles = recentLogs.filter((file) => fs.existsSync(file))

      // Update the list if files were removed
      if (existingFiles.length !== recentLogs.length) {
        recentLogs = existingFiles
        saveRecentLogs()
      }
      return existingFiles
    },

    clearRecentLogs() {
      recentLogs = []
      saveRecentLogs()
    },
  }
}
