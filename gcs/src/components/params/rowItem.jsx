/*
  Component that holds a single parameter, its value and the description in a row
*/

// Base imports
import { memo, useEffect, useState } from "react"

// 3rd party imports
import { ActionIcon, ScrollArea, Tooltip } from "@mantine/core"

// Custom components, helpers and data
import apmParamDefsCopter from "../../../data/gen_apm_params_def_copter.json"
import apmParamDefsPlane from "../../../data/gen_apm_params_def_plane.json"
import ValueInput from "./valueInput"

// Redux
import { useDispatch, useSelector } from "react-redux"
import { selectAircraftType } from "../../redux/slices/droneInfoSlice"
import {
  deleteModifiedParam,
  selectModifiedParams,
  selectShownParams,
} from "../../redux/slices/paramsSlice"
import { IconArrowBack, IconInfoCircle } from "@tabler/icons-react"

const RowItem = memo(({ index, style }) => {
  const dispatch = useDispatch()
  const aircraftType = useSelector(selectAircraftType)
  const shownParams = useSelector(selectShownParams)
  const modifiedParams = useSelector(selectModifiedParams)
  const [paramDef, setParamDef] = useState({})
  const param = shownParams[index]
  const hasBeenModified = modifiedParams.find(
    (item) => item.param_id == param.param_id,
  )

  function removeModified(param) {
    let initial_value = modifiedParams.find(
      (item) => item.param_id == param.param_id,
    ).initial_value
    dispatch(
      deleteModifiedParam({
        param_id: param.param_id,
        initial_value: initial_value,
      }),
    )
  }

  useEffect(() => {
    if (aircraftType === 1) {
      setParamDef(apmParamDefsPlane[param.param_id])
    } else if (aircraftType === 2) {
      setParamDef(apmParamDefsCopter[param.param_id])
    }
  }, [aircraftType, param])

  return (
    <div style={style} className="flex flex-row items-center space-x-4">
      <div className="flex flex-row w-2/12 gap-x-2">
        <Tooltip label={paramDef?.DisplayName} position="top-start">
          <p>{param.param_id}</p>
        </Tooltip>

        {paramDef?.Values && paramDef?.Range && (
          <Tooltip
            className="self-center"
            label={
              <div className="text-wrap max-w-80">
                {Object.keys(paramDef?.Values).map((key) => {
                  return (
                    <p key={key}>
                      {key}: {paramDef?.Values[key]}
                    </p>
                  )
                })}
              </div>
            }
          >
            <IconInfoCircle size={20} />
          </Tooltip>
        )}
      </div>

      <div className="flex items-end w-4/12 justify-between gap-x-4">
        <ValueInput index={index} paramDef={paramDef} className="grow" />
        {hasBeenModified && (
          <Tooltip
            label={`Reset to initial value of ${modifiedParams.find((item) => item.param_id == param.param_id).initial_value}`}
          >
            <ActionIcon
              size="lg"
              color="red"
              variant="light"
              onClick={() => removeModified(param)}
            >
              <IconArrowBack />
            </ActionIcon>
          </Tooltip>
        )}
      </div>

      <div className="w-1/2">
        <ScrollArea.Autosize className="max-h-24">
          {paramDef?.Description}
        </ScrollArea.Autosize>
      </div>
    </div>
  )
})

export default RowItem
