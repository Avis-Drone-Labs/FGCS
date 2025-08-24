
export function consoleLogHandler(msg) {
    console.log(`[${msg.level}] [${msg.timestamp}] ${msg.message}`)
}

export async function electronLogHandler(msg) {
    await window.ipcRenderer.pushLog(msg);
}