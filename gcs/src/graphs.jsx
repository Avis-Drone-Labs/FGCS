/*
  Live graph data screen.

  This shows 4 different graphs following the live data chosen from the user. These graphs can change size will update in real time as new messages are sent to the GCS.
*/

// Base imports
import { useEffect, useRef } from 'react'

// 3rd Party Imports
import { useLocalStorage, usePrevious } from '@mantine/hooks'

// Styling imports
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config.js'

// Custom components and helpers
import GraphPanel from './components/graphs/graphPanel.jsx'
import MessageSelector from './components/graphs/messageSelector.jsx'
import Layout from './components/layout'
import NoDroneConnected from './components/noDroneConnected.jsx'
import { socket } from './helpers/socket'
import { graphOptions } from './helpers/realTimeGraphOptions.js'
import { dataFormatters } from './helpers/dataFormatters.js'

const tailwindColors = resolveConfig(tailwindConfig).theme.colors

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
    socket.on('incoming_msg', (msg) => {
      const graphResults = getGraphDataFromMessage(msg, msg.mavpackettype)
      if (graphResults !== false) {
        graphResults.forEach((graphResult) => {
          graphRefs[graphResult.graphKey]?.current.data.datasets[0].data.push(
            graphResult.data,
          )
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
        graphRefs[graphKey].current !== null &&
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
        const [, valueName] = messageKey.split('.')

        // Applying Data Formatters
        let formatted_value = msg[valueName]
        if (messageKey in dataFormatters) {
          formatted_value = dataFormatters[messageKey](msg[valueName].toFixed(3));
        }

        returnDataArray.push({
          data: { x: Date.now(), y: formatted_value },
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
          <GraphPanel
            selectValues={selectValues}
            graphRefs={graphRefs}
            graphColors={graphColors}
          />
        </div>
      ) : (
        <NoDroneConnected />
      )}
    </Layout>
  )
}
