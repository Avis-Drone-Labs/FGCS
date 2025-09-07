/*
Component containing the toolbar for the parameters page

Contains the search bar, as well as the buttons for toggling shown parameters, saving and refreshing parameters, and
rebooting the autopilot
*/

// 3rd party imports
import { Button, TextInput, Tooltip } from "@mantine/core"
import {
  IconEye,
  IconPencil,
  IconPower,
  IconRefresh,
  IconTool,
} from "@tabler/icons-react"

// Custom helper, component and data imports
import { socket } from "../../helpers/socket.js"

// Styling imports
import tailwindConfig from "../../../tailwind.config.js"
import resolveConfig from "tailwindcss/resolveConfig"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Redux
import { useSelector } from "react-redux"
import {
  selectModifiedParams,
  selectShowModifiedParams,
} from "../../redux/slices/paramsSlice.js"

export default function ParamsToolbar({
  searchValue,
  refreshCallback,
  rebootCallback,
  modifiedCallback,
  searchCallback,
}) {
  /**
   * Sets all the modified parameters to their new values on the drone
   */
  function saveModifiedParams() {
    socket.emit("set_multiple_params", modifiedParams)
  }

  const modifiedParams = useSelector(selectModifiedParams)
  const showModifiedParams = useSelector(selectShowModifiedParams)

  return (
    <div className="flex justify-center space-x-4">
      <Tooltip
        label={showModifiedParams ? "Show all params" : "Show modified params"}
        position="bottom"
      >
        <Button
          size="sm"
          onClick={modifiedCallback}
          color={tailwindColors.orange[600]}
        >
          {" "}
          {showModifiedParams ? (
            <IconEye size={14} />
          ) : (
            <IconTool size={14} />
          )}{" "}
        </Button>
      </Tooltip>

      <TextInput
        className="w-1/3"
        placeholder="Search by parameter name"
        value={searchValue}
        onChange={(event) => searchCallback(event.currentTarget.value)}
      />

      <Button
        size="sm"
        rightSection={<IconPencil size={14} />}
        disabled={!modifiedParams.length}
        onClick={saveModifiedParams}
        color={tailwindColors.green[600]}
      >
        {" "}
        Save params{" "}
      </Button>

      <Button
        size="sm"
        rightSection={<IconRefresh size={14} />}
        onClick={refreshCallback}
        color={tailwindColors.blue[600]}
      >
        {" "}
        Refresh params{" "}
      </Button>

      <Button
        size="sm"
        rightSection={<IconPower size={14} />}
        onClick={rebootCallback}
        color={tailwindColors.red[600]}
      >
        {" "}
        Reboot FC{" "}
      </Button>
    </div>
  )
}
