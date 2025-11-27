import { app } from "electron"
import * as fs from "fs"
import * as path from "path"
import type { RecentLog } from "../types/flaTypes"

export default function createRecentLogsManager(maxRecentLogs: number = 10) {
  // JSON file to hold paths to recently opened logs
  const recentLogsPath: string = path.join(
    app.getPath("userData"),
    "recentLogs.json",
  )

  function loadRecentLogs(): RecentLog[] {
    try {
      if (fs.existsSync(recentLogsPath)) {
        const data = fs.readFileSync(recentLogsPath, "utf8")
        const parsed = JSON.parse(data)

        // Backward compatibility: convert array of strings to array of objects
        if (Array.isArray(parsed)) {
          return parsed.map((item) => {
            if (typeof item === "string") {
              // Old format: use mtime as fallback
              try {
                const stats = fs.statSync(item)
                return { path: item, timestamp: stats.mtime.getTime() }
              } catch {
                return { path: item, timestamp: Date.now() }
              }
            }
            // New format: validate and return
            if (
              typeof item === "object" &&
              item !== null &&
              "path" in item &&
              "timestamp" in item
            ) {
              return item as RecentLog
            }
            // Invalid format: treat as current time
            return { path: String(item), timestamp: Date.now() }
          })
        }
        return []
      }
      return []
    } catch (error) {
      console.error("Error loading recent files:", error)
      return []
    }
  }

  let recentLogs: RecentLog[] = loadRecentLogs()

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
      recentLogs = recentLogs.filter((log: RecentLog) => log.path !== filePath)

      // Add the file to the beginning of the list with current timestamp
      recentLogs.unshift({ path: filePath, timestamp: Date.now() })

      // Trim the list if it exceeds the maximum allowed
      if (recentLogs.length > maxRecentLogs) {
        recentLogs = recentLogs.slice(0, maxRecentLogs)
      }
      saveRecentLogs()
    },

    getRecentLogs(): RecentLog[] {
      // Filter out files that no longer exist
      const existingFiles: RecentLog[] = recentLogs.filter((log: RecentLog) =>
        fs.existsSync(log.path),
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
