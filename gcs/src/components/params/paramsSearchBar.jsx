
// 3rd party imports
import { Button, TextInput, Tooltip } from '@mantine/core'
import { IconEye, IconPencil, IconPower, IconRefresh, IconTool } from '@tabler/icons-react'

// Styling imports
import tailwindConfig from '../../../tailwind.config.js'
import resolveConfig from 'tailwindcss/resolveConfig'
import { socket } from '../../helpers/socket.js'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function ParamsHeader({searchValue, modifiedParams, showModifiedParams, paramRefreshCallback, autopilotRebootCallback, modifiedParamsCallback, searchCallback}){

  function saveModifiedParams() {
    socket.emit('set_multiple_params', modifiedParams)
  }

  return (
    <div className='flex space-x-4 justify-center'>
      <Tooltip
        label={showModifiedParams ? 'Show all params' : 'Show modified params'}
        position='bottom'
      >
        <Button
          size='sm'
          onClick={modifiedParamsCallback}
          color={tailwindColors.orange[600]}
        >
          {showModifiedParams ? (
            <IconEye size={14} />
          ) : (
            <IconTool size={14} />
          )}
        </Button>
      </Tooltip>

      <TextInput
        className='w-1/3'
        placeholder='Search by parameter name'
        value={searchValue}
        onChange={(event) => searchCallback(event.currentTarget.value)}
      />

      <Button
        size='sm'
        rightSection={<IconPencil size={14} />}
        disabled={!modifiedParams.length}
        onClick={saveModifiedParams}
        color={tailwindColors.green[600]}
      > Save params </Button>

      <Button
        size='sm'
        rightSection={<IconRefresh size={14} />}
        onClick={paramRefreshCallback}
        color={tailwindColors.blue[600]}
      > Refresh params </Button>

      <Button
        size='sm'
        rightSection={<IconPower size={14} />}
        onClick={autopilotRebootCallback}
        color={tailwindColors.red[600]}
      > Reboot FC </Button>
    </div>
  )
}
