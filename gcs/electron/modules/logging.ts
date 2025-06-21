/**
 * Functions related to both console and file logging
 */
import fs from 'node:fs'
import path from "node:path";
import { app, ipcMain } from "electron";

import * as log4js from "log4js";
import { getUserConfiguration } from './settings';

export let electronLogger: log4js.Logger
export let frontendLogger: log4js.Logger

interface Message{
    timestamp: number,
    message: string
}

const LOG_PATH = path.join(app.getPath("home"), "FGCS", "logs");
const TMP_PATH = path.join(app.getPath("home"), "FGCS", "tmp");

/**
 * Get the path of the frontend log file, based on the user preferences.
 * If the user wants both frontend and backend logs in a single file, then the log file
 * is written in the FGCS/tmp directory along with the backend log, then combined into a single log file
 */
function getLogPath(name: string, combine: boolean, keepLast: boolean): string {
    const logFile = combine || keepLast ? `${name}.log` : `${name}-${new Date().getTime()}.log`;
    return path.join(combine ? TMP_PATH : LOG_PATH, logFile);
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
                }
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

export function parseDate(date: string, fmt: string): Date{

    let ptr = 0;
    const epoch = new Date(0);
    while (ptr < fmt.length){
        if (fmt[ptr] == "%"){
            switch (fmt.slice(ptr, ptr+2)){
            case "%H":
                epoch.setHours(parseInt(date.slice(0, 2))); break;
            case "%M":
                epoch.setMinutes(parseInt(date.slice(0, 2))); break;
            case "%S":
                epoch.setSeconds(parseInt(date.slice(0, 2))); break;
            case "%f":
                epoch.setMilliseconds(parseInt(date.slice(0, 3))); break;
            case "%Y":
                epoch.setFullYear(parseInt(date.slice(0,4))); break;
            case "%y":
                // This will break in 1000 years!
                epoch.setFullYear(2000 + parseInt(date.slice(0, 2))); break;
            case "%m":
                epoch.setMonth(parseInt(date.slice(0, 2)) - 1); break;
            case "%d":
                epoch.setDate(parseInt(date.slice(0, 2))); break;
            default:
                break
            }
            date = date.slice(fmt[ptr + 1] == "f" ? 3 : fmt[ptr + 1] == "Y" ? 4 : 2)
            ptr += 2
        } else{
            date = date.slice(1)
            ptr += 1
        }
    }

    return epoch;
}

function writeMessages(messages: Array<Message>){
    if (!fs.existsSync(LOG_PATH)) fs.mkdirSync(LOG_PATH);

    fs.writeFileSync(path.join(LOG_PATH, getUserConfiguration().settings["General"]["onlyKeepLastLog"] ? "fgcs.log" : `fgcs-${new Date().getTime()}.log`), messages.map(item => item.message).join(''), 'utf-8')
}

/**
 * Read the messages from a log file into the given buffer, parsing the date into a js
 * Date object
 * @param logPath
 * @param msgBuffer
 */
function readMessages(logPath: string, msgBuffer: Array<Message>){
    const data = fs.readFileSync(logPath);
    const messages = data.toString().split("\n")
    for (const msg of messages){
        if (!msg) continue;
        msgBuffer.push({message: msg, timestamp: parseDate(msg.split(']')[0].slice(1), "%d/%m/%Y %H:%M:%S:%f").getTime()})
    }
}

/**
 * Combines frontend.log and backend.log (or the most recent frontend and backend logs)
 * into one
 */
export function combineLogFiles(){
    const allMessages: Array<Message> = [];

    const frontendLog = getLogPath("frontend", true, true);
    const backendLog = getLogPath("backend", true, true);

    // Read messages from each log file into the buffer
    readMessages(frontendLog, allMessages);
    readMessages(backendLog, allMessages);

    allMessages.sort((a, b) => a.timestamp - b.timestamp)

    writeMessages(allMessages);

    fs.rmSync(frontendLog);
    fs.rmSync(backendLog);
}

export default function registerLoggingIPC(){
    ipcMain.handle("logMessage", (_, level, msg) => {frontendLogger.log(level, msg)})
}
