import { readFileSync } from "fs"

export const readParamsFile = (filePath: string): Record<string, number> => {
  try {
    const fileContents = readFileSync(filePath, "utf-8")
    const lines = fileContents.split("\n")
    const params: Record<string, number> = {}

    // Params are stored as key,value pairs on each line
    lines.forEach((line) => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const [key, value] = trimmedLine.split(",")
        if (key && value) {
          params[key.trim()] = parseFloat(value.trim())
        }
      }
    })

    return params
  } catch (error) {
    console.error("Error reading params file:", error)
    throw error
  }
}
