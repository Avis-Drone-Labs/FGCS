import { emitLog } from "../redux/slices/loggingSlice"
import { store } from "../redux/store"

function logHelper(level, msg){
    
    store.dispatch(emitLog({
        message: msg,
        level: level,
        timestamp: new Date() / 1000,
        source: "frontend"
    }))

}

export function logDebug(msg){
    logHelper("DEBUG", msg)
}

export function logInfo(msg){
    logHelper("INFO", msg)
}

export function logWarning(msg){
    logHelper("WARNING", msg)
}

export function logError(msg){
    logHelper("ERROR", msg)
}

export function logFatal(msg){
    logHelper("FATAL", msg)
}

// Now these are global and don't need to be imported :D
globalThis.logInfo = logInfo;
globalThis.logDebug = logDebug;
globalThis.logError = logError;
globalThis.logWarn = logWarning;
globalThis.logFatal = logFatal;