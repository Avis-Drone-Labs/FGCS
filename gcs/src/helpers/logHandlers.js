export function consoleLogHandler(msg) {

  const message = `[${msg.level}] [${msg.timestamp}] ${msg.source} - ${msg.message}`
  switch (msg.level)
  {
    case 'debug': console.log(message); break
    case 'info': console.info(message); break
    case 'warning': console.warn(message); break
    case 'error' || 'critical' || 'fatal': console.error(message); break
    default: console.log(message)
  }
}

export async function electronLogHandler(msg) {
  await window.ipcRenderer.pushLog(msg)
}
