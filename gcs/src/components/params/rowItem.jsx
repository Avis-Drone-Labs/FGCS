/*
  Component that holds a single parameter, its value and the description in a row
*/

// Base imports
import { memo, useEffect, useState } from "react"

// 3rd party imports
import { ScrollArea, Tooltip } from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"

// Custom components, helpers and data
import apmParamDefsCopter from "../../../data/gen_apm_params_def_copter.json"
import apmParamDefsPlane from "../../../data/gen_apm_params_def_plane.json"
import ValueInput from "./valueInput"

const RowItem = memo(({ param, style, onChange }) => {
  const [aircraftType] = useLocalStorage({
    key: "aircraftType",
  })
  const [paramDef, setParamDef] = useState({})

  useEffect(() => {
    if (aircraftType === 1) {
      setParamDef(apmParamDefsPlane[param.param_id])
    } else if (aircraftType === 2) {
      setParamDef(apmParamDefsCopter[param.param_id])
    }
  }, [aircraftType, param])

  return (
    <div style={style} className="flex flex-row items-center space-x-4">
      <Tooltip label={paramDef?.DisplayName}>
        <p className="w-56">{param.param_id}</p>
      </Tooltip>

      <ValueInput
        param={param}
        paramDef={paramDef}
        onChange={onChange}
        className="w-3/12"
      />

      <div className="w-1/2">
        <ScrollArea.Autosize className="max-h-24">
          {paramDef?.Description}
        </ScrollArea.Autosize>
      </div>
    </div>
  )
})

export default RowItem
