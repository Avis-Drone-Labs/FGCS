/*
  Drone parameter screen.

  Allows the user to change drone parameters via MavLink messages. TODO: Rephrase this!
*/

// Base imports
import { useEffect, useState } from 'react'

// 3rd Party Imports
import { FixedSizeList } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { Button, Progress, TextInput, Tooltip } from '@mantine/core'
import { IconEye, IconPencil, IconPower, IconRefresh, IconTool } from '@tabler/icons-react'
import { useDebouncedValue, useDisclosure, useListState, useLocalStorage, useToggle } from '@mantine/hooks'

// Styling imports
import tailwindConfig from '../tailwind.config.js'
import resolveConfig from 'tailwindcss/resolveConfig'

// Custom components, helpers, and data
import Layout from './components/layout.jsx'
import { socket } from './helpers/socket.js'
import { Row } from './components/params/row.jsx'
import { showErrorNotification, showSuccessNotification } from './helpers/notification.js'
import AutopilotRebootModal from './components/params/autopilotRebootModal.jsx'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

export default function Params() {

  const [connected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: true,
  })
  const [params, paramsHandler] = useListState([])
  const [rebootData, setRebootData] = useState({})
  const [searchValue, setSearchValue] = useState('')
  const [opened, { open, close }] = useDisclosure(false)
  const [fetchingVars, setFetchingVars] = useState(false)
  const [shownParams, shownParamsHandler] = useListState([])
  const [modifiedParams, modifiedParamsHandler] = useListState([])
  const [showModifiedParams, showModifiedParamsToggle] = useToggle()
  const [debouncedSearchValue] = useDebouncedValue(searchValue, 150)
  const [fetchingVarsProgress, setFetchingVarsProgress] = useState(0)

  useEffect(() => {
    socket.on('reboot_autopilot', (msg) => {
      setRebootData(msg)
      if (msg.success) {
        close()
      }
    })

    // Drone has lost connection
    if (!connected) {
      setFetchingVars(false)
      setFetchingVarsProgress(0)
      paramsHandler.setState([])
      shownParamsHandler.setState([])
      modifiedParamsHandler.setState([])
      setSearchValue('')
      setRebootData({})
      return
    }

    // Fetch params
    if (connected && Object.keys(params).length === 0 && !fetchingVars) {
      socket.emit('set_state', { state: 'params' })
      setFetchingVars(true)
    }

    socket.on('params', (params) => {
      paramsHandler.setState(params)
      shownParamsHandler.setState(params)
      setFetchingVars(false)
      setFetchingVarsProgress(0)
      setSearchValue('')
    })

    socket.on('param_request_update', (msg) => {
      setFetchingVarsProgress(
        (msg.current_param_index / msg.total_number_of_params) * 100,
      )
    })

    socket.on('param_set_success', (msg) => {
      showSuccessNotification(msg.message)
      modifiedParamsHandler.setState([])
    })

    socket.on('params_error', (err) => {
      showErrorNotification(err.message)
      setFetchingVars(false)
    })

    return () => {
      socket.off('params')
      socket.off('param_request_update')
      socket.off('param_set_success')
      socket.off('params_error')
      socket.off('reboot_autopilot')
    }
  }, [connected]) // useEffect

  useEffect(() => {
    if (!params) return

    const filteredParams = (
      showModifiedParams ? modifiedParams : params
    ).filter(
      (param) =>
        param.param_id
          .toLowerCase()
          .indexOf(debouncedSearchValue.toLowerCase()) == 0,
    )

    shownParamsHandler.setState(filteredParams)
  }, [debouncedSearchValue, showModifiedParams])

  function addToModifiedParams(value, param) {
    console.log(param.param_id, value)
    // TODO: Can this logic be tidied up?
    if (value === '') return
    if (
      modifiedParams.find((obj) => {
        return obj.param_id === param.param_id
      })
    ) {
      modifiedParamsHandler.applyWhere(
        (item) => item.param_id === param.param_id,
        (item) => ({ ...item, param_value: value }),
      )
    } else {
      param.param_value = value
      modifiedParamsHandler.append(param)
    }

    paramsHandler.applyWhere(
      (item) => item.param_id === param.param_id,
      (item) => ({ ...item, param_value: value }),
    )
  }

  function saveModifiedParams() {
    socket.emit('set_multiple_params', modifiedParams)
  }

  function refreshParams() {
    paramsHandler.setState([])
    shownParamsHandler.setState([])
    socket.emit('refresh_params')
    setFetchingVars(true)
  }

  function rebootAutopilot() {
    socket.emit('reboot_autopilot')
    open()
    setFetchingVars(false)
    setFetchingVarsProgress(0)
    paramsHandler.setState([])
    shownParamsHandler.setState([])
    modifiedParamsHandler.setState([])
    setSearchValue('')
    setRebootData({})
  }

  return (
    <Layout currentPage='params'>

      <AutopilotRebootModal
        rebootData={rebootData}
        opened={opened}
        onClose={close}
      />

      {fetchingVars && (
        <Progress
          radius='xs'
          value={fetchingVarsProgress}
          className='w-1/3 mx-auto my-auto'
        />
      )}
      {Object.keys(params).length !== 0 && (
        <div className='w-full h-full contents'>
          <div className='flex space-x-4 justify-center'>
            <Tooltip
              label={
                showModifiedParams ? 'Show all params' : 'Show modified params'
              }
              position='bottom'
            >
              <Button
                size='sm'
                onClick={showModifiedParamsToggle}
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
              onChange={(event) => setSearchValue(event.currentTarget.value)}
            />
            <Button
              size='sm'
              rightSection={<IconPencil size={14} />}
              disabled={!modifiedParams.length}
              onClick={saveModifiedParams}
              color={tailwindColors.green[600]}
            >
              Save params
            </Button>
            <Button
              size='sm'
              rightSection={<IconRefresh size={14} />}
              onClick={refreshParams}
              color={tailwindColors.blue[600]}
            >
              Refresh params
            </Button>
            <Button
              size='sm'
              rightSection={<IconPower size={14} />}
              onClick={rebootAutopilot}
              color={tailwindColors.red[600]}
            >
              Reboot FC
            </Button>
          </div>
          <div className='h-full w-2/3 mx-auto'>
            <AutoSizer>
              {({ height, width }) => (
                <FixedSizeList
                  height={height}
                  width={width}
                  itemSize={120}
                  itemCount={shownParams.length}
                  itemData={{
                    params: shownParams,
                    onChange: addToModifiedParams,
                  }}
                >
                  {Row}
                </FixedSizeList>
              )}
            </AutoSizer>
          </div>
        </div>
      )}
    </Layout>
  )
}
