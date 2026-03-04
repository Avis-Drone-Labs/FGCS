import { Progress } from "@mantine/core"
import { useSelector } from "react-redux"
import { selectFetchingParam } from "../redux/slices/paramsSlice"

export default function ConnectionProgress({ connecting, status }) {
  const param = useSelector(selectFetchingParam)
  return (
    <>
      {connecting &&
        status.message !== null &&
        typeof status.progress === "number" && (
          <>
            <p className="text-center mt-4">{status.message}</p>
            <p className="text-center mb-4 text-falcongrey-400 text-sm">
              Fetching {param}
            </p>
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
