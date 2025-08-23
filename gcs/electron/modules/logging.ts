/**
 * Functions related to both console and file logging
 */
import path from "node:path";
import { app, ipcMain } from "electron";

import * as log4js from "log4js";

export let frontendLogger: log4js.Logger
export let backendLogger: log4js.Logger

const LOG_PATH = app.getPath("logs")
const DEV_LOG_PATH = path.join(app.getAppPath(), "logs")

function getDatedLogFile() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");

  return `fgcs-${year}${month}${day}_${hour}${minute}${second}.log`;
}

export function setupLog4js(combineLogs: boolean, onlyKeepLast: boolean){

    const isBuilt = process.env.NODE_ENV === 'production'

    // Change these for the console and file patterns respectively
    const CONSOLE_PATTERN   = "[%d{dd/MM/yyyy hh:mm:ss:SSS}] [%p] %m"
    const FILE_PATTERN      = "[%d{dd/MM/yyyy hh:mm:ss:SSS}] [%p] %c - %m"

    // If user wants combined logs then we can use the multifile appender else just the standard file appender
    const appenders = [combineLogs ? "file" : "multifile"]

    // Log to console as well if in dev
    if (!isBuilt) appenders.push("console")

    log4js.configure({
        appenders: {
            file: {
                type: 'file',
                filename: path.join(isBuilt ? LOG_PATH : DEV_LOG_PATH, onlyKeepLast ? "fgcs.log" : getDatedLogFile()),
                layout: {
                    type: 'pattern',
                    pattern: FILE_PATTERN
                },
                flags: "w"
            },
            console: {
                type: "console",
                pattern: CONSOLE_PATTERN,
            },
            multifile: {
                type: "multiFile",
                base: isBuilt ? LOG_PATH : DEV_LOG_PATH,
                property: "categoryName",
                extension: ".log",
                layout: {
                    type: 'pattern',
                    pattern: CONSOLE_PATTERN
                },
                flags: "w"
            }
        },
        categories: {
            electron: {
                appenders: appenders,
                level: 'info'
            },
            frontend: {
                appenders: appenders,
                level: 'debug'
            },
            backend: {
                appenders: appenders,
                level: "debug"
            },
            default: {
                appenders: ["console"],
                level: "info"
            }
        }
    })

    frontendLogger = log4js.getLogger("frontend");
    backendLogger = log4js.getLogger("backend");

    frontendLogger.info("Setup frontend logging");
}

export default function registerLoggingIPC(){
    ipcMain.handle("logMessage", (_, {level, message, timestamp, source}) => {(source == "backend" ? backendLogger : frontendLogger).log(level, message)})
}