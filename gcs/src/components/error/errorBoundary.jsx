/*
  Generic error boundary prop that handles errors and shows the fallback prop.
*/

// Local Imports
import React from "react";

// 3rd Party Imports
import { Button } from "@mantine/core";

export function ErrorComponent() {
  return (
    <div className="flex flex-col w-full h-full items-center justify-center text-center text-xl gap-y-2">
      <h1 className="font-bold text-4xl text-falconred-700">We've ran into an issue!</h1>

      <div>
        <p>
          Please report this{' '}
          <a 
            href="https://github.com/Avis-Drone-Labs/FGCS/issues/new?assignees=&labels=bug&projects=&template=bug_report.md&title=%5BBUG%5D"
            target="_blank"
            className="underline text-falconred-700"
          >
            here
          </a>
          {' '}
          so we can fix it as soon as possible!
        </p>
        <p>
          To get back to what you were doing, refresh or click below.
        </p>
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

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorComponent></ErrorComponent>;
    }

    return this.props.children; 
  }
}