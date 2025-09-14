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
import { IconInfoCircle } from "@tabler/icons-react"

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
      <div className="flex flex-row w-56 gap-x-2">
        <Tooltip label={paramDef?.DisplayName} position="top-start">
          <p className="w-min">{param.param_id}</p>
        </Tooltip>

        {(paramDef?.Values && paramDef?.Range) && 
          <Tooltip
            className="self-center"
            label={
              <div className="text-wrap max-w-80">
                {Object.keys(paramDef?.Values).map((key, index) => {
                  return <p>{key}: {paramDef?.Values[Object.keys(paramDef?.Values)[index]]}</p>
                })}
              </div>
            }
          >
            <IconInfoCircle size={20} />
          </Tooltip>
        }
      </div>

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
