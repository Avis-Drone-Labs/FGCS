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
import { useSelector } from "react-redux"
import { selectShownParams } from "../../redux/slices/paramsSlice"

export default function ValueInput({ index, paramDef, onChange, className }) {
  const shownParams = useSelector(selectShownParams)
  const param = shownParams[index]

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

  if (paramDef?.Values && !paramDef?.Range) {
    return (
      <Select // Values input
        className={className}
        value={`${cleanFloat(param.param_value)}`}
        onChange={(value) => onChange(sanitiseInput(value), param)}
        data={Object.keys(paramDef?.Values).map((key) => ({
          value: `${key}`,
          label: `${key}: ${paramDef?.Values[key]}`,
        }))}
        allowDeselect={false}
      />
    )
  }

  if (paramDef?.BitMask) {
    return (
      <BitmaskSelect // Bitmask input
        className={className}
        value={param.param_value}
        onChange={onChange}
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
      value={param.param_value}
      onChange={(value) => onChange(value, param)}
      decimalScale={5}
      hideControls
      min={paramDef?.Range ? paramDef?.Range.low : null}
      max={paramDef?.Range ? paramDef?.Range.high : null}
      suffix={paramDef?.Units}
    />
  )
}
