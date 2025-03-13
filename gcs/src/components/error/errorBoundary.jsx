/*
  Generic error boundary prop that handles errors and shows the fallback prop.
*/

// Local Imports
import React from "react"

// 3rd Party Imports
import { Button } from "@mantine/core"
import { CodeHighlight } from '@mantine/code-highlight'

export default function ErrorBoundaryFallback({ error }) {
  return (
    <div className="flex flex-col w-full h-full items-center justify-center text-center text-xl gap-y-2">
      <h1 className="font-bold text-4xl text-falconred-700">
        We've ran into an issue!
      </h1>

      <div>
        <p>
          Please report this{" "}
          <a
            href="https://github.com/Avis-Drone-Labs/FGCS/issues/new?assignees=&labels=bug&projects=&template=bug_report.md&title=%5BBUG%5D"
            target="_blank"
            className="underline text-falconred-700"
          >
            here
          </a>{" "}
          so we can fix it as soon as possible!
        </p>
        <p>To get back to what you were doing, refresh or click below.</p>

        <p
          className="pt-2 text-sm underline text-falconred-700 hover:cursor-pointer"
          onClick={() => {
            document.getElementById("stack-error").hidden =
              !document.getElementById("stack-error").hidden
          }}
        >
          Show stack log
        </p>
        <CodeHighlight
          id="stack-error"
          hidden={true}
          block
          className="!mt-4 !bg-falcongrey-900 !rounded-lg !text-center"
          language="js"
          copyLabel="Copy stacktrace"
          copiedLabel="Copied!"
          code={error.stack}
        />
      </div>

      <Button
        size="lg"
        variant="light"
        color="blue"
        onClick={() => window.ipcRenderer.send("force_reload")}
        className="mt-2"
      >
        Go Back!
      </Button>
    </div>
  )
}
