/**
 * Functions related to both console and file logging
 */
import path from "node:path";
import { app, ipcMain } from "electron";

import * as log4js from "log4js";
import * as layouts from "log4js/lib/layouts";

export let frontendLogger: log4js.Logger
export let backendLogger: log4js.Logger

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


export function setupLog4js(logToWorkspace: boolean, combineLogFiles: boolean, logFormat: string, loggingLevel: string){

    const isDev = process.env.NODE_ENV === 'development'

    const appenders = [isDev && !combineLogFiles ? "multifile" : "file"]
    const directory = isDev && logToWorkspace ? path.join(app.getAppPath(), "logs") : app.getPath("logs")

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
                    pattern: logFormat
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

    frontendLogger.info("Setup frontend logging");
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