import { Progress } from "@mantine/core"
import { useSelector } from "react-redux"
import { selectFetchingParam } from "../redux/slices/paramsSlice"

export default function ConnectionProgress({ connecting, status }) {
  const param = useSelector(selectFetchingParam)
  const subMessage = status?.sub_message || ""
  const fallbackSubMessage = param ? `Fetching ${param}` : ""
  const details = subMessage || fallbackSubMessage

  return (
    <>
      {connecting &&
        status.message !== null &&
        typeof status.progress === "number" && (
          <>
            <p className="text-center mt-4">{status.message}</p>
            {details && (
              <p className="text-center mb-4 text-falcongrey-400 text-sm">
                {details}
              </p>
            )}
            <Progress
              animated
              size="lg"
              transitionDuration={300}
              value={status.progress}
              className="w-full mx-auto my-auto"
            />
          </>
        )}
    </>
  )
}
