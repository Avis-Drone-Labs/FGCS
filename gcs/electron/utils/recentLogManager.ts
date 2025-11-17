import { app } from "electron"
import * as fs from "fs"
import * as path from "path"

interface RecentLog {
  path: string
  lastAccessTime: string
}

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
        
        // Backward compatibility: convert old string[] format to new object format
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && typeof parsed[0] === "string") {
            // Old format detected, convert to new format
            return parsed.map((filePath: string) => ({
              path: filePath,
              lastAccessTime: new Date().toISOString(),
            }))
          }
          return parsed
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
      recentLogs = recentLogs.filter((log) => log.path !== filePath)

      // Add the file to the beginning of the list with current timestamp
      recentLogs.unshift({
        path: filePath,
        lastAccessTime: new Date().toISOString(),
      })

      // Trim the list if it exceeds the maximum allowed
      if (recentLogs.length > maxRecentLogs) {
        recentLogs = recentLogs.slice(0, maxRecentLogs)
      }
      saveRecentLogs()
    },

    getRecentLogs(): RecentLog[] {
      // Filter out files that no longer exist
      const existingFiles = recentLogs.filter((log) =>
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
