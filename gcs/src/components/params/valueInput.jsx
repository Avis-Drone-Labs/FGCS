/*
  Input which allows for modification of a given parameter

  Uses different input styles (NunberInput, Select and BitmaskSelect) depending on the type
  of parameter that is being modified
*/

// 3rd party imports
import { NumberInput, Select } from "@mantine/core"

// custom components, helpers and data
import BitmaskSelect from "./bitmaskSelect"

export default function ValueInput({ param, paramDef, onChange, className }) {
  if (paramDef?.Range) {
    return (
      <NumberInput // Range input
        className={className}
        label={`${paramDef?.Range.low} - ${paramDef?.Range.high}`}
        value={param.param_value}
        onChange={(value) => onChange(value, param)}
        decimalScale={5}
        hideControls
        suffix={paramDef?.Units}
      />
    )
  }
  if (paramDef?.Values) {
    return (
      <Select // Values input
        className={className}
        value={`${param.param_value}`}
        onChange={(value) => onChange(value, param)}
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
        value={param.param_value}
        onChange={onChange}
        param={param}
        options={paramDef?.Bitmask}
      />
    )
  }
  return (
    <NumberInput
      className={className}
      value={param.param_value}
      onChange={(value) => onChange(value, param)}
      decimalScale={5}
      hideControls
      suffix={paramDef?.Units}
    />
  )
}
