/*
  Component that holds a single parameter, its value and the description in a row
*/

// Base imports
import { memo } from "react"

// 3rd party imports
import { ActionIcon, ScrollArea, Tooltip } from "@mantine/core"

// Custom components, helpers and data
import { useParamDefinitions } from "../../helpers/paramDefinitions"
import ValueInput from "./valueInput"

// Redux
import { IconArrowBack, IconInfoCircle } from "@tabler/icons-react"
import { useDispatch, useSelector } from "react-redux"
import {
  deleteModifiedParam,
  selectModifiedParams,
  selectShownParams,
  selectSingleParam,
} from "../../redux/slices/paramsSlice"

const RowItem = memo(({ index, style }) => {
  const dispatch = useDispatch()
  const { paramDefs } = useParamDefinitions()
  const shownParams = useSelector(selectShownParams)
  const modifiedParams = useSelector(selectModifiedParams)
  const param = shownParams[index]
  const paramDef = paramDefs[param.param_id]
  const paramPreviousValue = useSelector((state) =>
    selectSingleParam(state, param.param_id),
  )
  const hasBeenModified = modifiedParams.find(
    (item) => item.param_id === param.param_id,
  )

  function removeModified(param) {
    let initial_value = modifiedParams.find(
      (item) => item.param_id === param.param_id,
    ).initial_value
    dispatch(
      deleteModifiedParam({
        param_id: param.param_id,
        initial_value: initial_value,
      }),
    )
  }

  return (
    <div
      style={style}
      className="flex items-center px-8 gap-6 border-t border-neutral-700"
    >
      <div className="flex items-center w-2/12 gap-x-2">
        <Tooltip label={paramDef?.DisplayName ?? null} position="top-start">
          <p>{param.param_id}</p>
        </Tooltip>

        {paramDef?.Values && paramDef?.Range && (
          <Tooltip
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
        <ValueInput
          index={index}
          paramDef={paramDef}
          className="grow"
          disabled={paramDef?.ReadOnly === "True"}
        />
        {hasBeenModified && (
          <Tooltip
            label={`Reset to previous value of ${paramPreviousValue?.param_value}`}
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
