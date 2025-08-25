/**
 * Functions related to both console and file logging
 */
import path from "node:path";
import { app, ipcMain } from "electron";

import * as log4js from "log4js";

// @ts-ignore
import * as layouts from "log4js/lib/layouts";

let frontendLogger: log4js.Logger
let backendLogger: log4js.Logger

let initialised: boolean = false;

interface BufferedLog {
    message: string,
    level: log4js.Level
}
let logBuffer: BufferedLog[] = []

export function setupLog4js(logToWorkspace: boolean, combineLogFiles: boolean, logFormat: string, loggingLevel: string){

    if (initialised) {
        logWarning("Attempting to initialise log4js when it has already been initialised")
        return;
    }

    const isDev = process.env.NODE_ENV === 'development'

    const appenders = [isDev && !combineLogFiles ? "multifile" : "file"]
    const directory = isDev && logToWorkspace ? path.join(app.getAppPath(), "logs") : app.getPath("logs")

    // If we are logging to separate files no point including the logger name
    const resolvedFormat =  logFormat.replace("%c", '').replace("  ", " ")

    // Log to console as well if in dev
    if (isDev) appenders.push("console")

    // Since logs coming from the backend supply their own epoch timestamp (so that we can log based on when
    // the log is sent not when it is recieved, we need a custom layout to deal with it)
    log4js.addLayout('epochLayout', (config: log4js.Config) => {
        return (loggingEvent) => {

            let ts;

            const data = loggingEvent.data[0]

            if (data._epoch != null) {

                const epoch = Number(data._epoch);
                const epochMs = epoch * 1e3;
                ts = new Date(epochMs).toISOString();
            } else {
                ts = loggingEvent.startTime.toISOString();
            }

            const newTokens = {...config.tokens, d: () => ts}

            return layouts.patternLayout(config.pattern, newTokens)({...loggingEvent, data: loggingEvent.data.slice(1)});
        };
    });

    log4js.configure({
        appenders: {
            file: {
                type: 'file',
                filename: path.join(directory, "fgcs.log"),
                layout: {
                    type: 'epochLayout',
                    pattern: logFormat
                },
                flags: "w"
            },
            console: {
                type: "stdout",
                layout: {
                    type: 'epochLayout',
                    pattern: logFormat
                }
            },
            multifile: {
                type: "multiFile",
                base: directory,
                property: "categoryName",
                extension: ".log",
                layout: {
                    type: 'epochLayout',
                    pattern: resolvedFormat
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
                level: loggingLevel
            },
            backend: {
                appenders: appenders,
                level: loggingLevel
            },
            default: {
                appenders: ["console"],
                level: "info"
            }
        }
    })

    frontendLogger = log4js.getLogger("frontend");
    backendLogger = log4js.getLogger("backend");

    // Log any logs that came through before logging was initialised
    /* frontendLogger.info()
    logBuffer.forEach(lb => frontendLogger.info(lb.message)) */
    initialised = true

    logBuffer.forEach(logHelper);

    logInfo("Setup user logging")
}

// We export these log functions purely for logging within electron
// Since there is a chance logging is uninitialised when logging within the
// Electron process
export function logHelper(log: BufferedLog) {
    if (initialised) 
        frontendLogger.log(log.level, {_epoch: Date.now() / 1000}, log.message)
    else 
        logBuffer.push(log)
}

export function logDebug(message: string) {
    logHelper({message: message, level: log4js.levels.DEBUG})
}

export function logInfo(message: string) {
    logHelper({message: message, level: log4js.levels.INFO})
}

export function logWarning(message: string) {
    logHelper({message: message, level: log4js.levels.WARN})
}

export function logError(message: string) {
    logHelper({message: message, level: log4js.levels.ERROR})
}

export function logFatal(message: string) {
    logHelper({message: message, level: log4js.levels.FATAL})
}

export default function registerLoggingIPC(){

    ipcMain.handle("logMessage", (_, {level, message, timestamp, source}) => {
        // backend logs from python come in with CRITICAL level, log4js calls it FATAL (like everything else)
        const resolvedLevel = level === "CRITICAL" ? "FATAL" : level;
        source === "backend" 
            ? backendLogger.log(resolvedLevel, {_epoch: timestamp}, message) 
            : frontendLogger.log(level, {_epoch: timestamp}, message);
    })
}