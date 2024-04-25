/*
  Component that holds a single parameter, its value and the description in a row
*/

// Base imports
import { memo } from "react"

// 3rd party imports
import { ScrollArea, Tooltip } from "@mantine/core"

// Custom components, helpers and data
import ValueInput from "./valueInput"
import apmParamDefs from '../../../data/gen_apm_params_def.json'

const RowItem = memo(({ param, style, onChange }) => {
  const paramDef = apmParamDefs[param.param_id]

  return (
    <div style={style} className='flex flex-row items-center space-x-4'>
      <Tooltip label={paramDef?.DisplayName}>
        <p className='w-56'>{param.param_id}</p>
      </Tooltip>

      <ValueInput
        param={param}
        paramDef={paramDef}
        onChange={onChange}
        className='w-3/12'
      />
      
      <div className='w-1/2'>
        <ScrollArea.Autosize className='max-h-24'>
          {paramDef?.Description}
        </ScrollArea.Autosize>
      </div>
    </div>
  )
})

export default RowItem