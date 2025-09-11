/*
  Component that holds a single parameter, its value and the description in a row
*/

// Base imports
import { memo, useEffect, useState } from "react"

// 3rd party imports
import { ScrollArea, Tooltip } from "@mantine/core"

// Custom components, helpers and data
import apmParamDefsCopter from "../../../data/gen_apm_params_def_copter.json"
import apmParamDefsPlane from "../../../data/gen_apm_params_def_plane.json"
import ValueInput from "./valueInput"

// Redux
import { useSelector } from "react-redux"
import { selectAircraftType } from "../../redux/slices/droneInfoSlice"
import { selectShownParams } from "../../redux/slices/paramsSlice"

const RowItem = memo(({ index, style, onChange }) => {
  const aircraftType = useSelector(selectAircraftType)
  const shownParams = useSelector(selectShownParams)
  const [paramDef, setParamDef] = useState({})
  const param = shownParams[index]

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
        index={index}
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
