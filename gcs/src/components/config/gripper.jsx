/*
  This is the gripper component for the config page.

  It sends the gripper commands to release and grab for testing it functions as specified
*/

// 3rd Party Imports
import { Button } from "@mantine/core"

// Styling Imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Custom helper function
import { socket } from "../../helpers/socket"

export default function Gripper() {
  // Set gripper config values
  function setGripper(action) {
    socket.emit("set_gripper", action)
  }

  return (
    <div className="m-4 w-1/2">
      <div className="flex flex-row gap-2">
        <Button
          onClick={() => setGripper("release")}
          color={tailwindColors.falconred[800]}
        >
          Release Gripper
        </Button>
        <Button
          onClick={() => setGripper("grab")}
          color={tailwindColors.falconred[800]}
        >
          Grab Gripper
        </Button>
      </div>
    </div>
  )
}
