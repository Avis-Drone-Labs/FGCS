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

// Styling imports
import resolveConfig from "tailwindcss/resolveConfig"
import tailwindConfig from "../../../tailwind.config.js"
const tailwindColors = resolveConfig(tailwindConfig).theme.colors

// Redux
import { useDispatch, useSelector } from "react-redux"
import {
  emitRebootAutopilot,
  emitRefreshParams,
  emitSetMultipleParams,
  resetParamState,
  selectModifiedParams,
  selectParamSearchValue,
  selectShowModifiedParams,
  setAutoPilotRebootModalOpen,
  setFetchingVars,
  setModifiedParams,
  setParams,
  setParamSearchValue,
  setShownParams,
  toggleShowModifiedParams,
} from "../../redux/slices/paramsSlice.js"

export default function ParamsToolbar() {
  const dispatch = useDispatch()
  const modifiedParams = useSelector(selectModifiedParams)
  const showModifiedParams = useSelector(selectShowModifiedParams)
  const searchValue = useSelector(selectParamSearchValue)

  function refreshCallback() {
    dispatch(setParams([]))
    dispatch(setModifiedParams([]))
    dispatch(setShownParams([]))
    dispatch(emitRefreshParams())
    dispatch(setFetchingVars(true))
  }

  function rebootCallback() {
    dispatch(emitRebootAutopilot())
    dispatch(setAutoPilotRebootModalOpen(true))
    dispatch(resetParamState())
  }

  return (
    <div className="flex justify-center space-x-4">
      <Tooltip
        label={showModifiedParams ? "Show all params" : "Show modified params"}
        position="bottom"
      >
        <Button
          size="sm"
          onClick={() => dispatch(toggleShowModifiedParams())}
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
        onChange={(event) =>
          dispatch(setParamSearchValue(event.currentTarget.value))
        }
      />

      <Button
        size="sm"
        rightSection={<IconPencil size={14} />}
        disabled={!modifiedParams.length}
        onClick={() => dispatch(emitSetMultipleParams(modifiedParams))}
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
