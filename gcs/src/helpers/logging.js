import { fmtDate } from "./timeFmt";



function logHelper(level, msg){
    // Log to console
    const date = fmtDate("%d/%m/%Y %H:%M:%S")
    const logStr = `[${date}] [${level}] ${msg}`
    console.log(logStr);

    // Log to file
    window.ipcRenderer.logMessage(level, msg)
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
