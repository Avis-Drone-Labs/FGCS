/*
  Input which allows for modification of a given parameter

  Uses different input styles (NumberInput, Select and BitmaskSelect) depending on the type
  of parameter that is being modified
*/

// 3rd party imports
import { NumberInput, Select } from "@mantine/core"

// Custom components, helpers and data
import BitmaskSelect from "./bitmaskSelect"

// Redux
import { useDispatch, useSelector } from "react-redux"
import {
  appendModifiedParams,
  selectModifiedParams,
  selectShownParams,
  updateModifiedParamValue,
} from "../../redux/slices/paramsSlice"

export default function ValueInput({ index, paramDef, className }) {
  const dispatch = useDispatch()
  const params = useSelector(selectShownParams)
  const modifiedParams = useSelector(selectModifiedParams)
  const param = params[index]
  const hasBeenModified = modifiedParams.find(
    (item) => item.param_id === param.param_id,
  )
  const param_value = hasBeenModified
    ? hasBeenModified.param_value
    : param.param_value

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

  function cleanFloat(value, decimals = 3) {
    if (typeof value === "number") {
      return Number(value.toFixed(decimals))
    }
    if (!isNaN(value)) {
      return Number(parseFloat(value).toFixed(decimals))
    }
    return value
  }

  // Checks if a parameter has been modified since the last save
  function isModified(param) {
    return modifiedParams.find((obj) => {
      return obj.param_id === param.param_id
    })
  }

  // Adds a parameter to the list of parameters that have been modified since the last save
  function addToModifiedParams(value, param) {
    if (value === "") return

    if (isModified(param)) {
      dispatch(
        updateModifiedParamValue({
          param_id: param.param_id,
          param_value: value,
        }),
      )
    } else {
      // Otherwise add it to modified params
      dispatch(
        appendModifiedParams({
          param_id: param.param_id,
          param_value: value,
          param_type: param.param_type,
          initial_value: param.param_value,
        }),
      )
    }

    // dispatch(updateParamValue({ param_id: param.param_id, param_value: value }))
  }

  if (paramDef?.Values && !paramDef?.Range) {
    return (
      <Select // Values input
        className={className}
        value={`${cleanFloat(param_value)}`}
        onChange={(value) => addToModifiedParams(sanitiseInput(value), param)}
        data={Object.keys(paramDef?.Values).map((key) => ({
          value: `${key}`,
          label: `${key}: ${paramDef?.Values[key]}`,
        }))}
        allowDeselect={false}
      />
    )
  }

  if (paramDef?.Bitmask) {
    return (
      <BitmaskSelect // Bitmask input
        className={className}
        value={param_value}
        onChange={addToModifiedParams}
        param={param}
        options={paramDef?.Bitmask}
      />
    )
  }

  // Default return NumberInput, with range if the param supports it
  return (
    <NumberInput
      className={className}
      label={
        paramDef?.Range
          ? `${paramDef?.Range.low} - ${paramDef?.Range.high}`
          : ""
      }
      value={param_value}
      onChange={(value) => addToModifiedParams(value, param)}
      decimalScale={5}
      hideControls
      min={paramDef?.Range ? paramDef?.Range.low : null}
      max={paramDef?.Range ? paramDef?.Range.high : null}
      suffix={paramDef?.Units}
    />
  )
}
