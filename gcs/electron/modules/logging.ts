/**
 * Functions related to both console and file logging
 */
import path from "node:path";
import { app, ipcMain } from "electron";

import * as log4js from "log4js";

export let electronLogger: log4js.Logger
export let frontendLogger: log4js.Logger
export let backendLogger: log4js.Logger

const LOG_PATH = app.getPath("logs")

require("log4js/lib/appenders/multiFile")

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
                filename: path.join(LOG_PATH, onlyKeepLast ? "fgcs.log" : `${name}-${new Date().getTime()}.log`),
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
                base: LOG_PATH,
                property: "categoryName",
                extension: ".log",
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
                appenders: ["file"],
                level: "info"
            }
        }
    })

    electronLogger = log4js.getLogger("electron");
    frontendLogger = log4js.getLogger("frontend");
    backendLogger = log4js.getLogger("backend");

    electronLogger.info("Setup frontend logging");
}

export default function registerLoggingIPC(){
    ipcMain.handle("logMessage", (_, {level, message, timestamp, source}) => {(source == "backend" ? backendLogger : frontendLogger).log(level, message)})
}