import {
  Button,
  Divider,
  LoadingOverlay,
  Progress,
  ScrollArea,
} from "@mantine/core"
import moment from "moment"

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
  return (
    <div className="flex flex-col items-center justify-center h-full mx-auto">
      <div className="flex flex-row items-center justify-center gap-8">
        <div className="flex flex-col gap-4">
          {/* File selection */}
          <input
            type="file"
            accept=".log,.ftlog"
            style={{ display: "none" }}
            id="flight-log-upload"
            onChange={(e) => updateFile(e.target.files[0])}
            disabled={loadingFile}
          />
          <label htmlFor="flight-log-upload">
            <Button
              component="span"
              color="blue"
              variant="filled"
              loading={loadingFile}
            >
              Analyse a log
            </Button>
          </label>
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
                        {Math.round(log.size / 1024)}KB
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
