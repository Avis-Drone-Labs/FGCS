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
    level: log4js.Level,
    data: any[]
}
let logBuffer: BufferedLog[] = []

export function setupLog4js(logToWorkspace: boolean, combineLogFiles: boolean, logFormat: string, loggingLevel: string){

    if (initialised) {
        logWarning("Attempting to initialise log4js when it has already been initialised")
        return;
    }

    logInfo("Setting up logging with args (%s, %s, %s, %s)", logToWorkspace, combineLogFiles, logFormat, loggingLevel)

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
            const data = loggingEvent.data[0]
            return layouts.patternLayout(config.pattern)({...loggingEvent, 
                startTime: new Date(data._epoch * 1000), 
                fileName: data._file,
                lineNumber: data._lineNo,
                data: loggingEvent.data.slice(1)
            });
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
                level: 'info',
                enableCallStack: true
            },
            frontend: {
                appenders: appenders,
                level: loggingLevel,
                enableCallStack: true
            },
            backend: {
                appenders: appenders,
                level: loggingLevel,
                enableCallStack: true
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
    if (initialised) {

        const err = new Error()
        const caller = err.stack?.split('\n').at(3) ?? "unknown"
        const file = caller.split("\\").at(-1) ?? "";
        const fileName = file.slice(0, file.indexOf(":"));

        const lineNo = caller.split(":").at(-2);

        (frontendLogger as any)[log.level.levelStr.toLowerCase()]({_epoch: Date.now() / 1000, _file: fileName, _lineNo: lineNo}, log.message, ...log.data)
    }
    else 
        logBuffer.push(log)
}

export function logDebug(message: string, ...args: any[]) {
    logHelper({message: message, level: log4js.levels.DEBUG, data: args})
}

export function logInfo(message: string, ...args: any[]) {
    logHelper({message: message, level: log4js.levels.INFO, data: args})
}

export function logWarning(message: string, ...args: any[]) {
    logHelper({message: message, level: log4js.levels.WARN, data: args})
}

export function logError(message: string, ...args: any[]) {
    logHelper({message: message, level: log4js.levels.ERROR, data: args})
}

export function logFatal(message: string, ...args: any[]) {
    logHelper({message: message, level: log4js.levels.FATAL, data: args})
}

interface LogPayload {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'critical',
  message: string,
  timestamp: number,
  source: string,
  file: string,
  line: number
}

export default function registerLoggingIPC(){

    ipcMain.handle("logMessage", (_, {level, message, timestamp, source, file, line}: LogPayload) => {
        // backend logs from python come in with CRITICAL level, log4js calls it FATAL (like every other logger ever)
        const resolvedLevel = level === "critical" ? "fatal" : level;
        source === "backend" 
            ? backendLogger[resolvedLevel]({_epoch: timestamp, _file: file, _lineNo: line}, message) 
            : frontendLogger[resolvedLevel]({_epoch: timestamp, _file: file, _lineNo: line}, message);
    })
}