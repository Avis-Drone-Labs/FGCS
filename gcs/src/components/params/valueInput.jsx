/*

*/
import BitmaskSelect from "./bitmaskSelect"
import { NumberInput, Select } from "@mantine/core"

export default function ValueInput({ param, paramDef, onChange, className }) {
  if (paramDef?.Range) {
    return (
      <NumberInput // Range input
        className={className}
        label={`${paramDef?.Range.low} - ${paramDef?.Range.high}`}
        value={param.param_value}
        onChange={(value) => onChange(value, param)}
        decimalScale={5}
        // min={parseFloat(paramDef?.Range.low)}
        // max={parseFloat(paramDef?.Range.high)}
        hideControls
        suffix={paramDef?.Units}
      />
    )
  } else if (paramDef?.Values) {
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
  } else if (paramDef?.Bitmask) {
    return (
      <BitmaskSelect // Bitmask input
        className={className}
        value={param.param_value}
        onChange={onChange}
        param={param}
        options={paramDef?.Bitmask}
      />
    )
  } else {
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
}
