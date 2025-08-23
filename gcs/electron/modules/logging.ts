/**
 * Functions related to both console and file logging
 */
import path from "node:path";
import { app, ipcMain } from "electron";

import * as log4js from "log4js";

export let electronLogger: log4js.Logger
export let frontendLogger: log4js.Logger

const LOG_PATH = path.join(app.getPath("home"), "FGCS", "logs");

/**
 * Get the path of the frontend log file, based on the user preferences.
 * If the user wants both frontend and backend logs in a single file, then the log file
 * is written in the FGCS/tmp directory along with the backend log, then combined into a single log file
 */
function getLogPath(name: string, combine: boolean, keepLast: boolean): string {
    const logFile = combine || keepLast ? `${name}.log` : `${name}-${new Date().getTime()}.log`;
    return path.join(LOG_PATH, logFile);
}

export function setupLog4js(combineLogs: boolean, onlyKeepLast: boolean){
    const logPath = getLogPath("frontend", combineLogs, onlyKeepLast);

    // Change these for the console and file patterns respectively
    const CONSOLE_PATTERN   = "[%d{dd/MM/yyyy hh:mm:ss:SSS}] [%p] %m"
    const FILE_PATTERN      = "[%d{dd/MM/yyyy hh:mm:ss:SSS}] [%p] %c - %m"

    log4js.configure({
        appenders: {
            stdout: {
                type: 'stdout',
                layout: {
                    type: 'pattern',
                    pattern: CONSOLE_PATTERN,
                }
            },
            file: {
                type: 'file',
                filename: logPath,
                layout: {
                    type: 'pattern',
                    pattern: FILE_PATTERN
                },
                flags: "w"
            }
        },
        categories: {
            electron: {
                appenders: ["stdout", "file"],
                level: 'info'
            },
            frontend: {
                appenders: ["file"],
                level: 'debug'
            },
            default: {
                appenders: ["file"],
                level: "info"
            }
        }
    })

    electronLogger = log4js.getLogger("electron");
    frontendLogger = log4js.getLogger("frontend");

    electronLogger.info("Setup frontend logging");
}

export default function registerLoggingIPC(){
    ipcMain.handle("logMessage", (_, {level, message, timestamp}) => {frontendLogger.log(level, message)})
}