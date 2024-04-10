import { useEffect, useRef } from 'react'

import { useLocalStorage, usePrevious } from '@mantine/hooks'
import Layout from './components/layout'

import { Select } from '@mantine/core'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config.js'
import RealtimeGraph from './components/realtimeGraph.jsx'
import { socket } from './socket'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

const graphOptions = {
  VFR_HUD: ['airspeed', 'groundspeed', 'throttle', 'alt', 'climb'],
  SYS_STATUS: ['voltage_battery', 'current_battery', 'battery_remaining'],
  ATTITUDE: ['roll', 'pitch', 'yaw', 'rollspeed', 'pitchspeed', 'yawspeed'],
}

const graphLabelColors = {
  graph_a: 'text-sky-400',
  graph_b: 'text-pink-400',
  graph_c: 'text-orange-400',
  graph_d: 'text-green-400',
}

const graphColors = {
  graph_a: tailwindColors.sky[400],
  graph_b: tailwindColors.pink[400],
  graph_c: tailwindColors.orange[400],
  graph_d: tailwindColors.green[400],
}

function MessageSelector({ graphOptions, label, labelColor, valueKey, currentValues, setValue }) {
  return (
    <Select
      label={label}
      classNames={{ option: 'capitalize', label: labelColor }}
      data={Object.keys(graphOptions).map((messageName) => ({
        group: messageName,
        items: graphOptions[messageName].map((v) => ({
          value: `${messageName}/${v}`,
          label: v,
        })),
      }))}
      searchable
      value={currentValues[valueKey]}
      onChange={(value) => {
        setValue({ [valueKey]: value })
      }}
    />
  )
}

export default function Graphs() {
  const [connected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })

  const [selectValues, setSelectValues] = useLocalStorage({
    key: 'graphSelectedValues',
    defaultValue: {
      graph_a: null,
      graph_b: null,
      graph_c: null,
      graph_d: null,
    },
  })

  const previousSelectValues = usePrevious(selectValues)

  const graphRefs = {
    graph_a: useRef(null),
    graph_b: useRef(null),
    graph_c: useRef(null),
    graph_d: useRef(null),
  }

  useEffect(() => {
    if (!connected) {
      return
    } else {
      socket.emit('set_state', { state: 'graphs' })
    }
  }, [connected])

  useEffect(() => {
    console.log(selectValues)
    socket.on('incoming_msg', (msg) => {
      const graphResults = getGraphDataFromMessage(msg, msg.mavpackettype)
      if (graphResults !== false) {
        graphResults.forEach((graphResult) => {
          graphRefs[graphResult.graphKey]?.current.data.datasets[0].data.push(graphResult.data)
          graphRefs[graphResult.graphKey]?.current.update('quiet')
        })
      }
    })

    return () => {
      socket.off('incoming_msg')
    }
  }, [selectValues])

  useEffect(() => {
    if (!previousSelectValues) return

    for (let graphKey in selectValues) {
      if (
        selectValues[graphKey] !== previousSelectValues[graphKey] &&
        selectValues[graphKey] !== null
      ) {
        graphRefs[graphKey].current.data.datasets[0].data = []
        graphRefs[graphKey].current.update('quiet')
      }
    }
  }, [previousSelectValues])

  function getGraphDataFromMessage(msg, targetMessageKey) {
    const returnDataArray = []
    for (let graphKey in selectValues) {
      const messageKey = selectValues[graphKey]
      if (messageKey && messageKey.includes(targetMessageKey)) {
        const [, valueName] = messageKey.split('/')
        returnDataArray.push({
          data: { x: Date.now(), y: msg[valueName].toFixed(3) },
          graphKey: graphKey,
        })
      }
    }
    if (returnDataArray.length) {
      return returnDataArray
    }
    return false
  }

  function updateSelectValues(values) {
    const updatedSelectValues = { ...selectValues, ...values }
    console.log('updatedSelectValues', updatedSelectValues)
    setSelectValues(updatedSelectValues)
  }

  return (
    <Layout currentPage='graphs'>
      {connected ? (
        <div className='flex flex-col gap-2 h-full'>
          <div className='flex flex-row gap-4 w-fit mx-auto'>
            <MessageSelector
              graphOptions={graphOptions}
              label='Graph A'
              labelColor={graphLabelColors.graph_a}
              valueKey='graph_a'
              currentValues={selectValues}
              setValue={updateSelectValues}
            />
            <MessageSelector
              graphOptions={graphOptions}
              label='Graph B'
              labelColor={graphLabelColors.graph_b}
              valueKey='graph_b'
              currentValues={selectValues}
              setValue={updateSelectValues}
            />
            <MessageSelector
              graphOptions={graphOptions}
              label='Graph C'
              labelColor={graphLabelColors.graph_c}
              valueKey='graph_c'
              currentValues={selectValues}
              setValue={updateSelectValues}
            />
            <MessageSelector
              graphOptions={graphOptions}
              label='Graph D'
              labelColor={graphLabelColors.graph_d}
              valueKey='graph_d'
              currentValues={selectValues}
              setValue={updateSelectValues}
            />
          </div>
          <PanelGroup autoSaveId='verticalGraphs' direction='vertical' className='h-full'>
            <Panel minSize={20}>
              <PanelGroup autoSaveId='horizontalGraphs1' direction='horizontal'>
                <Panel minSize={10}>
                  {selectValues.graph_a ? (
                    <RealtimeGraph
                      ref={graphRefs.graph_a}
                      datasetLabel={selectValues.graph_a.split('/')[1]}
                      lineColor={graphColors.graph_a}
                    />
                  ) : (
                    <p className='flex items-center justify-center h-full'>
                      Select a value to plot on graph A
                    </p>
                  )}
                </Panel>
                <PanelResizeHandle className='w-1 bg-zinc-700 hover:bg-zinc-500 data-[resize-handle-state="hover"]:bg-zinc-500 data-[resize-handle-state="drag"]:bg-zinc-500' />
                <Panel minSize={10}>
                  {selectValues.graph_b ? (
                    <RealtimeGraph
                      ref={graphRefs.graph_b}
                      datasetLabel={selectValues.graph_b.split('/')[1]}
                      lineColor={graphColors.graph_b}
                    />
                  ) : (
                    <p className='flex items-center justify-center h-full'>
                      Select a value to plot on graph B
                    </p>
                  )}
                </Panel>
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className='h-1 bg-zinc-700 hover:bg-zinc-500 data-[resize-handle-state="hover"]:bg-zinc-500 data-[resize-handle-state="drag"]:bg-zinc-500' />
            <Panel minSize={20}>
              <PanelGroup autoSaveId='horizontalGraphs2' direction='horizontal'>
                <Panel minSize={10}>
                  {selectValues.graph_c ? (
                    <RealtimeGraph
                      ref={graphRefs.graph_c}
                      datasetLabel={selectValues.graph_c.split('/')[1]}
                      lineColor={graphColors.graph_c}
                    />
                  ) : (
                    <p className='flex items-center justify-center h-full'>
                      Select a value to plot on graph C
                    </p>
                  )}
                </Panel>
                <PanelResizeHandle className='w-1 bg-zinc-700 hover:bg-zinc-500 data-[resize-handle-state="hover"]:bg-zinc-500 data-[resize-handle-state="drag"]:bg-zinc-500' />
                <Panel minSize={10}>
                  {selectValues.graph_d ? (
                    <RealtimeGraph
                      ref={graphRefs.graph_d}
                      datasetLabel={selectValues.graph_d.split('/')[1]}
                      lineColor={graphColors.graph_d}
                    />
                  ) : (
                    <p className='flex items-center justify-center h-full'>
                      Select a value to plot on graph D
                    </p>
                  )}
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      ) : (
        <div className='flex items-center justify-center h-full'>
          <p className='text-red-400'>Not connected to drone. Please connect to view graphs</p>
        </div>
      )}
    </Layout>
  )
}
