import { emitLog } from "../redux/slices/loggingSlice"
import { store } from "../redux/store"

function logHelper(level, msg){
    
    store.dispatch(emitLog({
        message: msg,
        level: level,
        timestamp: new Date() / 1000
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