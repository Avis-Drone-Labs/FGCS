/*
  This is the gripper component for the config page.

  It sends the gripper commands to release and grab for testing it functions as specified
*/

// Native imports
import { useEffect, useMemo } from "react"

// 3rd Party Imports
import {
  Button,
  LoadingOverlay,
  NumberInput,
  Select,
  Tooltip,
} from "@mantine/core"

// Data
import apmParamDefsCopter from "../../../data/gen_apm_params_def_copter.json"
import apmParamDefsPlane from "../../../data/gen_apm_params_def_plane.json"

// Redux
import { useDebouncedCallback } from "@mantine/hooks"
import { IconInfoCircle } from "@tabler/icons-react"
import { useDispatch, useSelector } from "react-redux"
import {
  emitGetGripperConfig,
  emitSetGripper,
  emitSetGripperConfigParam,
  emitSetGripperDisabled,
  emitSetGripperEnabled,
  selectGetGripperEnabled,
  selectGripperConfig,
  selectRefreshingGripperConfigData,
} from "../../redux/slices/configSlice"
import {
  emitSetState,
  selectConnectedToDrone,
} from "../../redux/slices/droneConnectionSlice"
import { selectAircraftTypeString } from "../../redux/slices/droneInfoSlice"

const GRIPPER_PARAMS = [
  "GRIP_CAN_ID",
  "GRIP_AUTOCLOSE",
  "GRIP_GRAB",
  "GRIP_NEUTRAL",
  "GRIP_REGRAB",
  "GRIP_RELEASE",
  "GRIP_TYPE",
]

function cleanFloat(value, decimals = 3) {
  if (typeof value === "number") {
    return Number(value.toFixed(decimals))
  }
  if (!isNaN(value)) {
    return Number(parseFloat(value).toFixed(decimals))
  }
  return value
}

// Try to handle floats because mantine handles keys internally as strings
// Which leads to floating point rounding errors
function sanitiseInput(value, toString = false) {
  let sanitisedValue = value
  if (!isNaN(value) && String(value).trim() !== "") {
    sanitisedValue = String(value).includes(".")
      ? parseFloat(value)
      : parseInt(value)
  }

  return toString ? `${sanitisedValue}` : sanitisedValue
}

function InputLabel({ param }) {
  return (
    <p className="flex flex-row items-center gap-1">
      {param.param_id}{" "}
      <span>
        <Tooltip
          className="inline"
          label={
            <>
              <p className="text-wrap max-w-80">
                {param.param_def?.Description}
              </p>
            </>
          }
        >
          <IconInfoCircle size={16} />
        </Tooltip>
      </span>
    </p>
  )
}

export default function Gripper() {
  const dispatch = useDispatch()
  const connected = useSelector(selectConnectedToDrone)
  const aircraftTypeString = useSelector(selectAircraftTypeString)
  const getGripperEnabled = useSelector(selectGetGripperEnabled)
  const gripperConfig = useSelector(selectGripperConfig)
  const refreshingGripperConfigData = useSelector(
    selectRefreshingGripperConfigData,
  )

  const params = useMemo(() => {
    if (!gripperConfig) {
      return []
    }

    const paramDefs =
      aircraftTypeString === "Copter" ? apmParamDefsCopter : apmParamDefsPlane

    return GRIPPER_PARAMS.map((param) => {
      return {
        param_id: param,
        param_value: gripperConfig[param] ?? "UNKNOWN",
        param_def: paramDefs[param],
      }
    })
  }, [gripperConfig, aircraftTypeString])

  useEffect(() => {
    if (!connected) {
      return
    }

    dispatch(emitSetState("config"))
    dispatch(emitGetGripperConfig())
  }, [connected])

  function setGripper(action) {
    dispatch(emitSetGripper(action))
  }

  const toggleGripperEnabled = () => {
    if (getGripperEnabled) {
      dispatch(emitSetGripperDisabled())
    } else {
      dispatch(emitSetGripperEnabled())
    }
    dispatch(emitGetGripperConfig())
  }

  const debouncedUpdate = useDebouncedCallback((param_id, value) => {
    dispatch(emitSetGripperConfigParam({ param_id, value }))
  }, 500)

  if (!getGripperEnabled) {
    return (
      <div className="flex flex-col gap-4 mx-4">
        <p>Gripper is not enabled.</p>

        <Button
          w={"30%"}
          onClick={toggleGripperEnabled}
          color={"green"}
        >
          Enable Gripper
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 mx-4">
      <LoadingOverlay
        visible={refreshingGripperConfigData}
        zIndex={1000}
        overlayProps={{ blur: 2 }}
      />
      <div className="flex flex-col gap-2 w-1/3">
        <Button onClick={() => toggleGripperEnabled()} color={"red"}>
          Disable Gripper
        </Button>
        <div className="flex flex-row gap-2">
          <Button w="100%" onClick={() => setGripper("release")} color={"blue"}>
            Release Gripper
          </Button>
          <Button w="100%" onClick={() => setGripper("grab")} color={"blue"}>
            Grab Gripper
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {params.map((param) => (
          <div key={param.param_id} className="flex flex-row justify-between">
            {param.param_def?.Values ? (
              <Select
                label={<InputLabel param={param} />}
                className="w-64"
                value={`${cleanFloat(param.param_value)}`}
                onChange={(value) => {
                  dispatch(
                    emitSetGripperConfigParam({
                      param_id: param.param_id,
                      value: sanitiseInput(value),
                    }),
                  )
                }}
                data={Object.keys(param.param_def?.Values).map((key) => ({
                  value: `${key}`,
                  label: `${key}: ${param.param_def?.Values[key]}`,
                }))}
                allowDeselect={false}
              />
            ) : (
              <NumberInput
                label={<InputLabel param={param} />}
                description={
                  param.param_def?.Range
                    ? `${param.param_def?.Range.low} - ${param.param_def?.Range.high}`
                    : ""
                }
                className="w-64"
                value={param.param_value}
                onChange={(value) => {
                  if (value === "" || isNaN(value)) {
                    return
                  }
                  debouncedUpdate(param.param_id, value)
                }}
                decimalScale={5}
                hideControls
                min={param.param_def?.Range ? param.param_def?.Range.low : null}
                max={
                  param.param_def?.Range ? param.param_def?.Range.high : null
                }
                suffix={param.param_def?.Units}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
