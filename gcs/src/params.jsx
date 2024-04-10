import {
  Button,
  Loader,
  Modal,
  MultiSelect,
  NumberInput,
  Progress,
  ScrollArea,
  Select,
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
import { IconEye, IconPencil, IconPower, IconRefresh, IconTool } from '@tabler/icons-react'
import { memo, useEffect, useState } from 'react'
import { showErrorNotification, showSuccessNotification } from './notification.js'

import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import resolveConfig from 'tailwindcss/resolveConfig'
import apmParamDefs from '../data/gen_apm_params_def.json'
import tailwindConfig from '../tailwind.config.js'
import Layout from './components/layout.jsx'
import { socket } from './socket.js'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

function BitmaskSelect({ className, value, onChange, param, options }) {
  const [selected, selectedHandler] = useListState([])

  useEffect(() => {
    parseBitmask(value)
  }, [value])

  function parseBitmask(bitmaskToParse) {
    const binaryString = dec2bin(bitmaskToParse)
    const selectedArray = []

    binaryString
      .split('')
      .reverse()
      .map((bit, index) => {
        if (bit === '1') {
          selectedArray.push(`${index}`)
        }
      })

    selectedHandler.setState(selectedArray)
  }

  function createBitmask(value) {
    const initialValue = 0
    const bitmask = value.reduce(
      (accumulator, currentValue) => accumulator + 2 ** parseInt(currentValue),
      initialValue,
    )
    selectedHandler.setState(value)
    console.log(bitmask)
    onChange(bitmask, param)
  }

  function dec2bin(dec) {
    return (dec >>> 0).toString(2)
  }

  return (
    <ScrollArea.Autosize className={`${className} max-h-24`}>
      <MultiSelect
        value={selected}
        onChange={createBitmask}
        data={Object.keys(options).map((key) => ({
          value: `${key}`,
          label: `${options[key]}`,
        }))}
      />
    </ScrollArea.Autosize>
  )
}

function ValueInput({ param, paramDef, onChange, className }) {
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

const RowItem = memo(({ param, style, onChange }) => {
  const paramDef = apmParamDefs[param.param_id]
  return (
    <div style={style} className='flex flex-row items-center space-x-4'>
      <Tooltip label={paramDef?.DisplayName}>
        <p className='w-56'>{param.param_id}</p>
      </Tooltip>
      <ValueInput param={param} paramDef={paramDef} onChange={onChange} className='w-3/12' />
      <div className='w-1/2'>
        <ScrollArea.Autosize className='max-h-24'>{paramDef?.Description}</ScrollArea.Autosize>
      </div>
    </div>
  )
})

const Row = ({ data, index, style }) => {
  const param = data.params[index]

  return <RowItem param={param} style={style} onChange={data.onChange} />
}

export default function Params() {
  const [connected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })
  const [fetchingVars, setFetchingVars] = useState(false)
  const [fetchingVarsProgress, setFetchingVarsProgress] = useState(0)
  const [params, paramsHandler] = useListState([])
  const [shownParams, shownParamsHandler] = useListState([])
  const [modifiedParams, modifiedParamsHandler] = useListState([])
  const [showModifiedParams, showModifiedParamsToggle] = useToggle()
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearchValue] = useDebouncedValue(searchValue, 150)
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
      shownParamsHandler.setState([])
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
      shownParamsHandler.setState(params)
      setFetchingVars(false)
      setFetchingVarsProgress(0)
      setSearchValue('')
    })

    socket.on('param_request_update', (msg) => {
      setFetchingVarsProgress((msg.current_param_index / msg.total_number_of_params) * 100)
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
  }, [connected])

  useEffect(() => {
    if (!params) return

    const filteredParams = (showModifiedParams ? modifiedParams : params).filter(
      (param) => param.param_id.toLowerCase().indexOf(debouncedSearchValue.toLowerCase()) == 0,
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
                  <p className='my-2'>{rebootData.message} You will need to reconnect.</p>
                  <Button onClick={close} color={tailwindColors.red[600]} className='mt-4'>
                    Close
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </Modal>

      {fetchingVars && (
        <Progress radius='xs' value={fetchingVarsProgress} className='w-1/3 mx-auto my-auto' />
      )}
      {Object.keys(params).length !== 0 && (
        <div className='w-full h-full contents'>
          <div className='flex space-x-4 justify-center'>
            <Tooltip
              label={showModifiedParams ? 'Show all params' : 'Show modified params'}
              position='bottom'
            >
              <Button
                size='sm'
                onClick={showModifiedParamsToggle}
                color={tailwindColors.orange[600]}
              >
                {showModifiedParams ? <IconEye size={14} /> : <IconTool size={14} />}
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
