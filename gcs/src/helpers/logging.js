import { emitLog } from "../redux/slices/loggingSlice"
import { store } from "../redux/store"

function logHelper(level, msg) {
  const err = new Error()
  const caller = err.stack.split("\n")[3]

  const file = caller.split("/").at(-1)
  const fileName = file.slice(0, file.indexOf(":"))
  const lineNo = caller.split(":").at(-2)

  store.dispatch(
    emitLog({
      message: msg,
      level: level,
      timestamp: new Date() / 1000,
      source: "frontend",
      file: fileName,
      line: lineNo,
    }),
  )
}

export function logDebug(msg) {
  logHelper("DEBUG", msg)
}

export function logInfo(msg) {
  logHelper("INFO", msg)
}

export function logWarning(msg) {
  logHelper("WARNING", msg)
}

export function logError(msg) {
  logHelper("ERROR", msg)
}

export function logFatal(msg) {
  logHelper("FATAL", msg)
}

// Now these are global and don't need to be imported :D
globalThis.logInfo = logInfo
globalThis.logDebug = logDebug
globalThis.logError = logError
globalThis.logWarn = logWarning
globalThis.logFatal = logFatal
