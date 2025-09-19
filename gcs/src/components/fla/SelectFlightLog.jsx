import {
  Button,
  Divider,
  LoadingOverlay,
  Progress,
  ScrollArea,
  FileInput
} from "@mantine/core"
import moment from "moment"
import { useRef } from "react";
import { readableBytes } from "./utils"

/**
 * Initial FLA screen for selecting or uploading a flight log file.
 */
export default function SelectFlightLog({
  recentFgcsLogs,
  loadingFile,
  loadingFileProgress,
  updateFile,
  clearFgcsLogs,
}) {
  const fileInputRef = useRef(null);

  return (
    <div className="flex flex-col items-center justify-center h-full mx-auto">
      <div className="flex flex-row items-center justify-center gap-8">
        <div className="flex flex-col gap-4">
          {/* File selection */}
          <FileInput
            ref={fileInputRef}
            accept=".log,.ftlog"
            style={{ display: "none" }}
            onChange={updateFile}
            disabled={loadingFile}
          />
          <Button
            color="blue"
            variant="filled"
            loading={loadingFile}
            onClick={() => fileInputRef.current.click()}
          >
            Analyse a log
          </Button>
          <Button color="red" variant="filled" onClick={clearFgcsLogs}>
            Clear Logs
          </Button>
        </div>
        <Divider size="sm" orientation="vertical" />
        <div className="relative">
          <LoadingOverlay visible={recentFgcsLogs === null || loadingFile} />
          <div className="flex flex-col items-center gap-2">
            <p className="font-bold">Recent FGCS telemetry logs</p>
            <ScrollArea h={250} offsetScrollbars>
              {recentFgcsLogs !== null &&
                recentFgcsLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col px-4 py-2 hover:cursor-pointer hover:bg-falcongrey-700 hover:rounded-sm w-80"
                    onClick={() => updateFile(log)}
                  >
                    <p>{log.name} </p>
                    <div className="flex flex-row gap-2">
                      <p className="text-sm text-gray-400">
                        {moment(
                          log.timestamp.toISOString(),
                          "YYYY-MM-DD_HH-mm-ss",
                        ).fromNow()}
                      </p>
                      <p className="text-sm text-gray-400">
                        {readableBytes(log.size)}
                      </p>
                    </div>
                  </div>
                ))}
            </ScrollArea>
          </div>
        </div>
      </div>
      {loadingFile && (
        <Progress
          value={loadingFileProgress}
          className="w-full my-4"
          color="green"
        />
      )}
    </div>
  )
}
