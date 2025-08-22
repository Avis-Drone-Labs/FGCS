
export function consoleLogHandler(msg) {
    console.log(`[${msg.level}] [${msg.timestamp}] ${msg.message}`)
}

export function electronLogHandler(msg) {
    window.ipcRenderer.pushLog(msg);
}