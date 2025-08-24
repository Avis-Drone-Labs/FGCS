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

    // If user wants combined logs then we can use the multifile appender else just the standard file appender
    const appenders = [combineLogs ? "file" : "multifile"]

    // Log to console as well if in dev
    if (!isBuilt) appenders.push("console")

    // Since logs coming from the backend supply their own epoch timestamp (so that we can log based on when
    // the log is sent not when it is recieved, we need a custom layout to deal with it)
    log4js.addLayout('epochLayout', () => {
        return (loggingEvent) => {
            const first = loggingEvent.data && loggingEvent.data[0];
            let ts;
            let messageParts;

            if (first && typeof first === 'object' && first._epoch != null) {

                const epoch = Number(first._epoch);
                const epochMs = epoch * 1e3;
                ts = new Date(epochMs).toISOString();

                // remove that meta object from displayed message
                messageParts = loggingEvent.data.slice(1);
            } else {
                ts = loggingEvent.startTime.toISOString();
                messageParts = loggingEvent.data;
            }

            const msg = messageParts.map(part =>
                (typeof part === 'object' ? JSON.stringify(part) : String(part))
            ).join(' ');

            return `[${ts}] [${loggingEvent.level.toString()}] ${loggingEvent.categoryName} - ${msg}`;
        };
    });

    log4js.configure({
        appenders: {
            file: {
                type: 'file',
                filename: path.join(isBuilt ? LOG_PATH : DEV_LOG_PATH, onlyKeepLast ? "fgcs.log" : getDatedLogFile()),
                layout: {
                    type: 'epochLayout'
                },
                flags: "w"
            },
            console: {
                type: "stdout",
                layout: {
                    type: 'epochLayout'
                }
            },
            multifile: {
                type: "multiFile",
                base: isBuilt ? LOG_PATH : DEV_LOG_PATH,
                property: "categoryName",
                extension: ".log",
                layout: {
                    type: 'epochLayout'
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

    
    ipcMain.handle("logMessage", (_, {level, message, timestamp, source}) => {
        // backend logs from python come in with CRITICAL level, log4js calls it FATAL (like everything else)
        const resolvedLevel = level === "CRITICAL" ? "FATAL" : level;
        source === "backend" 
            ? backendLogger.log(resolvedLevel, {_epoch: timestamp}, message) 
            : frontendLogger.log(level, {_epoch: timestamp}, message);
    })
}