import { app } from "electron"
import * as fs from "fs"
import * as path from "path"

export default function createRecentLogsManager(maxRecentLogs: number = 10) {
  // JSON file to hold paths to recently opened logs
  const recentLogsPath: string = path.join(
    app.getPath("userData"),
    "recentLogs.json",
  )

  function loadRecentLogs(): string[] {
    try {
      if (fs.existsSync(recentLogsPath)) {
        const data = fs.readFileSync(recentLogsPath, "utf8")
        const parsed = JSON.parse(data)
        // Ensure we return an array of strings
        return Array.isArray(parsed) ? parsed : []
      }
      return []
    } catch (error) {
      console.error("Error loading recent files:", error)
      return []
    }
  }

  let recentLogs: string[] = loadRecentLogs()

  function saveRecentLogs(): void {
    try {
      fs.writeFileSync(recentLogsPath, JSON.stringify(recentLogs), "utf8")
    } catch (error) {
      console.error("Error saving recent files:", error)
    }
  }

  return {
    addRecentLog(filePath: string): void {
      // Remove the file if it already exists in the list
      recentLogs = recentLogs.filter((file: string) => file !== filePath)

      // Add the file to the beginning of the list
      recentLogs.unshift(filePath)

      // Trim the list if it exceeds the maximum allowed
      if (recentLogs.length > maxRecentLogs) {
        recentLogs = recentLogs.slice(0, maxRecentLogs)
      }
      saveRecentLogs()
    },

    getRecentLogs(): string[] {
      // Filter out files that no longer exist
      const existingFiles: string[] = recentLogs.filter((file: string) =>
        fs.existsSync(file),
      )

      // Update the list if files were removed
      if (existingFiles.length !== recentLogs.length) {
        recentLogs = existingFiles
        saveRecentLogs()
      }
      return existingFiles
    },

    clearRecentLogs(): void {
      recentLogs = []
      saveRecentLogs()
    },
  }
}
