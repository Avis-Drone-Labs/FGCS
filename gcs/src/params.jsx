import {
  Button,
  Loader,
  Modal,
  NumberInput,
  Progress,
  ScrollArea,
  Table,
  TextInput,
  Tooltip,
} from '@mantine/core'
import {
  useDebouncedValue,
  useDisclosure,
  useListState,
  useLocalStorage,
  useToggle,
} from '@mantine/hooks'
import {
  IconEye,
  IconPencil,
  IconPower,
  IconRefresh,
  IconTool,
} from '@tabler/icons-react'
import { memo, useCallback, useEffect, useState } from 'react'
import {
  showErrorNotification,
  showSuccessNotification,
} from './notification.js'

import resolveConfig from 'tailwindcss/resolveConfig'
import apmParamDefs from '../data/gen_apm_params_def.json'
import tailwindConfig from '../tailwind.config.js'
import Layout from './components/layout.jsx'
import { socket } from './socket.js'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const RowItem = memo(({ param, value, onChange }) => {
  const paramDef = apmParamDefs[param.param_id]
  return (
    <Table.Tr key={param.param_id}>
      <Tooltip label={paramDef?.DisplayName}>
        <Table.Td>{param.param_id}</Table.Td>
      </Tooltip>
      <Table.Td>
        {/* {paramDef?.Range ? (
              <>
                {paramDef?.Values ? (
                  <>
                    {paramDef?.Bitmask ? (
                      <NumberInput // Bitmask input
                        value={param.param_value}
                        onChange={(value) => addToModifiedParams(value, param)}
                        decimalScale={5}
                      />
                    ) : (
                      <NumberInput // Values input
                        value={param.param_value}
                        onChange={(value) => addToModifiedParams(value, param)}
                        decimalScale={5}
                      />
                    )}
                  </>
                ) : (
                  <NumberInput // Range input
                    value={param.param_value}
                    onChange={(value) => addToModifiedParams(value, param)}
                    decimalScale={5}
                    min={parseFloat(paramDef?.Range.low)}
                    max={parseFloat(paramDef?.Range.high)}
                  />
                )}
              </>
            ) : (
              <NumberInput // Normal number input
                value={param.param_value}
                onChange={(value) => addToModifiedParams(value, param)}
                decimalScale={5}
              />
            )} */}
        <NumberInput
          label={<p>{param.param_id}</p>}
          value={value}
          onChange={(value) => onChange(value, param)}
          decimalScale={5}
        />
      </Table.Td>
      <Table.Td className='w-1/12'>{paramDef?.Units}</Table.Td>
      <Table.Td className='w-1/2'>
        <ScrollArea.Autosize className='max-h-24'>
          {paramDef?.Description}
        </ScrollArea.Autosize>
      </Table.Td>
    </Table.Tr>
  )
}, arePropsEqual)

function arePropsEqual(oldProps, newProps) {
  if (oldProps.param.param_value !== newProps.param.param_value) {
    console.log('false')
  }
  return oldProps.param.param_value === newProps.param.param_value
}

export default function Params() {
  const [connected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })
  const [fetchingVars, setFetchingVars] = useState(false)
  const [fetchingVarsProgress, setFetchingVarsProgress] = useState(0)
  const [params, paramsHandler] = useListState([])
  const [modifiedParams, modifiedParamsHandler] = useListState([])
  const [showModifiedParams, showModifiedParamsToggle] = useToggle()
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearchValue] = useDebouncedValue(searchValue, 350)
  const [opened, { open, close }] = useDisclosure(false)
  const [rebootData, setRebootData] = useState({})

  useEffect(() => {
    socket.on('reboot_autopilot', (msg) => {
      setRebootData(msg)
      if (msg.success) {
        close()
      }
    })

    if (!connected) {
      setFetchingVars(false)
      setFetchingVarsProgress(0)
      paramsHandler.setState([])
      modifiedParamsHandler.setState([])
      setSearchValue('')
      setRebootData({})
      return
    }

    if (connected && Object.keys(params).length === 0 && !fetchingVars) {
      socket.emit('set_state', { state: 'params' })
      setFetchingVars(true)
    }

    socket.on('params', (params) => {
      paramsHandler.setState(params)
      setFetchingVars(false)
      setFetchingVarsProgress(0)
    })

    socket.on('param_request_update', (msg) => {
      setFetchingVarsProgress(
        (msg.current_param_index / msg.total_number_of_params) * 100,
      )
    })

    socket.on('param_set_success', (msg) => {
      showSuccessNotification(msg.message)
      const clonedParams = structuredClone(params)
      modifiedParams.forEach((param) => {
        clonedParams[param.param_id].param_value = param.param_value
      })

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
  }, [connected])

  function addToModifiedParams(value, param) {
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
    socket.emit('refresh_params')
    setFetchingVars(true)
  }

  function rebootAutopilot() {
    socket.emit('reboot_autopilot')
    open()
    setFetchingVars(false)
    setFetchingVarsProgress(0)
    paramsHandler.setState([])
    modifiedParamsHandler.setState([])
    setSearchValue('')
    setRebootData({})
  }

  const onChange = useCallback((param, value) => {
    addToModifiedParams(param, value)
  }, [])

  // TODO: Improve usability by only rendering what's viewed in window, e.g. using react-visualizer or react-window
  const rows = (showModifiedParams ? modifiedParams : params)
    .filter(
      (param) =>
        param.param_id
          .toLowerCase()
          .indexOf(debouncedSearchValue.toLowerCase()) == 0,
    )
    .map((param) => {
      return (
        <RowItem
          key={param.param_id}
          param={param}
          value={param.param_value}
          onChange={onChange}
        />
      )
    })

  return (
    <Layout currentPage='params'>
      <Modal
        opened={opened}
        onClose={close}
        title='Rebooting autopilot'
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <div className='flex flex-col items-center justify-center'>
          {rebootData.message === undefined ? (
            <Loader />
          ) : (
            <>
              {!rebootData.success && (
                <>
                  <p className='my-2'>
                    {rebootData.message} You will need to reconnect.
                  </p>
                  <Button
                    onClick={close}
                    color={tailwindColors.red[600]}
                    className='mt-4'
                  >
                    Close
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </Modal>

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
          <ScrollArea className='flex-auto mx-auto w-2/3' offsetScrollbars>
            <Table stickyHeader highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Value</Table.Th>
                  <Table.Th>Units</Table.Th>
                  <Table.Th>Description</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </ScrollArea>
        </div>
      )}
    </Layout>
  )
}
