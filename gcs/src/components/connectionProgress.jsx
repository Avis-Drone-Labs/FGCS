import { Progress } from "@mantine/core"

export default function ConnectionProgress({ connecting, status }) {
  return (
    <>
      {connecting &&
        status.message !== null &&
        typeof status.progress === "number" && (
          <>
            <p className="text-center my-4">{status.message}</p>
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
